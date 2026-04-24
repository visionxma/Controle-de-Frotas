"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, addDoc, updateDoc, deleteDoc, doc, onSnapshot, or, getDoc, getDocs, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Modulo-level cache to share singleton across components
let cachedTransactions: Transaction[] | null = null;
let globalUnsubscribe: (() => void) | null = null;
let listenerCount = 0;
const subscribers = new Set<() => void>();

function notify() {
  subscribers.forEach((callback) => callback());
}

export interface Transaction {
  id: string
  type: "receita" | "despesa"
  description: string
  amount: number
  date: string
  category: string
  truckId?: string
  driverId?: string
  tripId?: string // Adicionado campo para associar transação a uma viagem
  freightEntryId?: string // Linka esta transação a uma entrada específica no trip.freightEntries
  rentalId?: string // Adicionado campo para associar transação a uma locação
  supplierId?: string // Adicionado campo para associar despesa a um fornecedor (Empresas)
  itemName?: string // Nome do equipamento/item comprado (uso em compras de fornecedor)
  quantity?: number // Quantidade comprada (uso em compras de fornecedor)
  unitPrice?: number // Preço unitário (uso em compras de fornecedor)
  isCommission?: boolean
  userId: string
  adminId?: string
  createdBy?: string // Name of the user who created this record
  createdByRole?: "admin" | "collaborator" // Role of the creator
  createdAt?: Date
  updatedAt?: Date
}

export function useTransactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>(cachedTransactions || [])
  const [isLoading, setIsLoading] = useState(cachedTransactions === null)

  useEffect(() => {
    if (!user) {
      setTransactions([])
      setIsLoading(false)
      return
    }

    const handleUpdate = () => {
      setTransactions(cachedTransactions || [])
      setIsLoading(false)
    }

    subscribers.add(handleUpdate)
    listenerCount++

    if (listenerCount === 1 && !globalUnsubscribe) {
      let transactionsQuery

      // or() sem orderBy/limit evita exigência de índices compostos no Firestore.
      // A ordenação é feita client-side no callback do onSnapshot.
      if (user.role === "admin") {
        transactionsQuery = query(
          collection(db, "transactions"),
          or(where("userId", "==", user.id), where("adminId", "==", user.id)),
        )
      } else if (user.role === "collaborator" && user.adminId) {
        transactionsQuery = query(
          collection(db, "transactions"),
          or(where("userId", "==", user.id), where("userId", "==", user.adminId)),
        )
      } else {
        transactionsQuery = query(
          collection(db, "transactions"),
          where("userId", "==", user.id),
        )
      }

      const subscribeToQuery = (q: any) => {
        return onSnapshot(
          q,
          (snapshot: any) => {
            const transactionsData = snapshot.docs.map((doc: any) => ({
              id: doc.id,
              ...doc.data(),
            })) as Transaction[]

            // Fallback locale sorting to maintain correctness if DB index fails
            transactionsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

            cachedTransactions = transactionsData
            notify()
          },
          (error: any) => {
            console.error("Erro na snapshot de transactions:", error)
            if (error.message.includes("index")) {
                console.warn("Fallback (Sem Index compôsto): Consultando DB inteiro...")
                const fallbackQ = query(collection(db, "transactions"), or(where("userId", "==", user.id), where("adminId", "==", user.id)))
                globalUnsubscribe && globalUnsubscribe()
                globalUnsubscribe = subscribeToQuery(fallbackQ)
            } else {
                cachedTransactions = []
                notify()
            }
          },
        )
      }

      globalUnsubscribe = subscribeToQuery(transactionsQuery)
    } else if (cachedTransactions !== null) {
      setIsLoading(false)
    }

    return () => {
      subscribers.delete(handleUpdate)
      listenerCount--
      if (listenerCount === 0 && globalUnsubscribe) {
        globalUnsubscribe()
        globalUnsubscribe = null
        cachedTransactions = null
      }
    }
  }, [user])

  const addTransaction = async (transactionData: Omit<Transaction, "id" | "userId">) => {
    if (!user) return false

    try {
      const cleanData = Object.fromEntries(
        Object.entries({
          ...transactionData,
          userId: user.id,
          createdBy: user.name,
          createdByRole: user.role,
          createdAt: new Date(),
          ...(user.role === "collaborator" && user.adminId && { adminId: user.adminId }),
        }).filter(([_, value]) => value !== undefined),
      )

      await addDoc(collection(db, "transactions"), cleanData)
      return true
    } catch (error) {
      console.error("Erro ao adicionar transação:", error)
      return false
    }
  }

  // Upsert idempotente para a transação (receita) vinculada a um freightEntry.
  // Consulta direto o Firestore para não depender do estado local (que pode
  // estar defasado pelo onSnapshot). Se já existe uma transação com o mesmo
  // freightEntryId, atualiza; caso contrário, cria. Elimina a duplicação que
  // ocorria quando o fluxo tentava criar a transação duas vezes em paralelo.
  const upsertFreightTransaction = async (
    freightEntryId: string,
    data: Omit<Transaction, "id" | "userId" | "freightEntryId">,
  ) => {
    if (!user) return false

    try {
      const existingSnap = await getDocs(
        query(
          collection(db, "transactions"),
          where("freightEntryId", "==", freightEntryId),
          limit(1),
        ),
      )

      if (!existingSnap.empty) {
        // Transação já existe: atualiza em vez de criar outra.
        const cleanUpdate = Object.fromEntries(
          Object.entries({
            ...data,
            updatedAt: new Date(),
          }).filter(([_, value]) => value !== undefined),
        )
        await updateDoc(existingSnap.docs[0].ref, cleanUpdate)
        return true
      }

      const cleanData = Object.fromEntries(
        Object.entries({
          ...data,
          freightEntryId,
          userId: user.id,
          createdBy: user.name,
          createdByRole: user.role,
          createdAt: new Date(),
          ...(user.role === "collaborator" && user.adminId && { adminId: user.adminId }),
        }).filter(([_, value]) => value !== undefined),
      )
      await addDoc(collection(db, "transactions"), cleanData)
      return true
    } catch (error) {
      console.error("Erro ao salvar transação do frete:", error)
      return false
    }
  }

  // Mantém trip.freightEntries em sincronia com o documento da transação
  // quando o usuário edita/apaga um frete direto pelo Financeiro. Sem isso,
  // trip-details continua exibindo o valor antigo da lista de fretes.
  const syncFreightEntryInTrip = async (
    tripId: string,
    freightEntryId: string,
    action:
      | { type: "update"; value?: number; description?: string }
      | { type: "delete" },
  ) => {
    try {
      const tripRef = doc(db, "trips", tripId)
      const tripSnap = await getDoc(tripRef)
      if (!tripSnap.exists()) return
      const tripData = tripSnap.data() as { freightEntries?: Array<Record<string, unknown>> }
      const entries = Array.isArray(tripData.freightEntries) ? tripData.freightEntries : []
      if (!entries.length) return

      let newEntries: typeof entries
      if (action.type === "delete") {
        newEntries = entries.filter((e) => (e as any).id !== freightEntryId)
      } else {
        newEntries = entries.map((e) =>
          (e as any).id === freightEntryId
            ? {
                ...e,
                ...(action.value !== undefined && { value: action.value }),
                ...(action.description !== undefined && action.description.trim() && { description: action.description }),
              }
            : e,
        )
      }
      const newTotal = newEntries.reduce(
        (sum, e) => sum + (typeof (e as any).value === "number" ? (e as any).value : 0),
        0,
      )
      await updateDoc(tripRef, {
        freightEntries: newEntries,
        freightValue: newTotal,
      })
    } catch (err) {
      console.warn("[syncFreightEntryInTrip] Falha ao sincronizar trip.freightEntries:", err)
    }
  }

  const updateTransaction = async (id: string, transactionData: Partial<Omit<Transaction, "id" | "userId">>) => {
    try {
      const cleanData = Object.fromEntries(
        Object.entries({
          ...transactionData,
          updatedAt: new Date(),
        }).filter(([_, value]) => value !== undefined),
      )

      const transactionRef = doc(db, "transactions", id)

      // Lê do Firestore direto para pegar freightEntryId/tripId antes do update —
      // depender do estado local é frágil (pode estar defasado pelo onSnapshot).
      const currentSnap = await getDoc(transactionRef)
      const currentTx = currentSnap.exists()
        ? (currentSnap.data() as Transaction)
        : null

      await updateDoc(transactionRef, cleanData)

      // Espelha alterações de valor/descrição no freight entry correspondente
      // da viagem (quando a transação é um frete linkado).
      if (currentTx?.freightEntryId && currentTx?.tripId) {
        await syncFreightEntryInTrip(currentTx.tripId, currentTx.freightEntryId, {
          type: "update",
          value: transactionData.amount,
          description: transactionData.description,
        })
      }

      return true
    } catch (error) {
      console.error("Erro ao atualizar transação:", error)
      return false
    }
  }

  const deleteTransaction = async (id: string) => {
    try {
      const transactionRef = doc(db, "transactions", id)

      // Lê do Firestore direto (não do estado local) — garante que o sync
      // aconteça mesmo se o onSnapshot ainda não hidratou `transactions`.
      const currentSnap = await getDoc(transactionRef)
      if (currentSnap.exists()) {
        const currentTx = currentSnap.data() as Transaction
        // Frete linkado: remove também a entrada em trip.freightEntries ANTES
        // de apagar a transação, para não deixar o frete fantasma na viagem.
        if (currentTx.freightEntryId && currentTx.tripId) {
          await syncFreightEntryInTrip(currentTx.tripId, currentTx.freightEntryId, {
            type: "delete",
          })
        }
      }

      await deleteDoc(transactionRef)
      return true
    } catch (error) {
      console.error("Erro ao deletar transação:", error)
      return false
    }
  }

  // Apaga a transação (receita) vinculada a um freightEntry, buscando direto
  // no Firestore por freightEntryId. Não depende do estado local — usado
  // pelo trip-details quando o usuário remove um frete da viagem.
  const deleteFreightTransaction = async (freightEntryId: string) => {
    try {
      const snap = await getDocs(
        query(
          collection(db, "transactions"),
          where("freightEntryId", "==", freightEntryId),
        ),
      )
      if (snap.empty) return true
      // Se por algum motivo houver múltiplas (dados antigos), apaga todas.
      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
      return true
    } catch (error) {
      console.error("Erro ao apagar transação do frete:", error)
      return false
    }
  }

  const getMonthlyStats = () => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const monthlyTransactions = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date)
      return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear
    })

    const revenue = monthlyTransactions.filter((t) => t.type === "receita").reduce((sum, t) => sum + t.amount, 0)

    const expenses = monthlyTransactions.filter((t) => t.type === "despesa").reduce((sum, t) => sum + t.amount, 0)

    return { revenue, expenses, profit: revenue - expenses }
  }

  const getChartData = () => {
    const last6Months = []
    const now = new Date()

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthTransactions = transactions.filter((transaction) => {
        const transactionDate = new Date(transaction.date)
        return transactionDate.getMonth() === date.getMonth() && transactionDate.getFullYear() === date.getFullYear()
      })

      const receita = monthTransactions.filter((t) => t.type === "receita").reduce((sum, t) => sum + t.amount, 0)

      const despesa = monthTransactions.filter((t) => t.type === "despesa").reduce((sum, t) => sum + t.amount, 0)

      last6Months.push({
        month: date.toLocaleDateString("pt-BR", { month: "short" }),
        receita,
        despesa,
      })
    }

    return last6Months
  }

  const getFilteredStats = (
    period: string,
    truckFilter: string | null,
    driverFilter: string | null,
    tripFilter: string | null,
  ) => {
    const now = new Date()
    let startDate: Date

    switch (period) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "3m":
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
        break
      case "6m":
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
        break
      case "1y":
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        break
      default:
        startDate = new Date(0) // Todo período
    }

    const filteredTransactions = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date)

      if (period !== "all" && transactionDate < startDate) return false

      if (truckFilter && transaction.truckId !== truckFilter) return false

      if (driverFilter && transaction.driverId !== driverFilter) return false

      if (tripFilter && transaction.tripId !== tripFilter) return false

      return true
    })

    const revenue = filteredTransactions.filter((t) => t.type === "receita").reduce((sum, t) => sum + t.amount, 0)

    const expenses = filteredTransactions.filter((t) => t.type === "despesa").reduce((sum, t) => sum + t.amount, 0)

    return { revenue, expenses, profit: revenue - expenses }
  }

  const getFilteredChartData = (
    period: string,
    truckFilter: string | null,
    driverFilter: string | null,
    tripFilter: string | null,
  ) => {
    const now = new Date()
    let monthsToShow = 6

    switch (period) {
      case "7d":
      case "30d":
        monthsToShow = 2
        break
      case "3m":
        monthsToShow = 3
        break
      case "6m":
        monthsToShow = 6
        break
      case "1y":
        monthsToShow = 12
        break
      default:
        monthsToShow = 6
    }

    const chartData = []

    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthTransactions = transactions.filter((transaction) => {
        const transactionDate = new Date(transaction.date)
        const sameMonth =
          transactionDate.getMonth() === date.getMonth() && transactionDate.getFullYear() === date.getFullYear()

        if (!sameMonth) return false

        if (truckFilter && transaction.truckId !== truckFilter) return false
        if (driverFilter && transaction.driverId !== driverFilter) return false
        if (tripFilter && transaction.tripId !== tripFilter) return false

        return true
      })

      const receita = monthTransactions.filter((t) => t.type === "receita").reduce((sum, t) => sum + t.amount, 0)

      const despesa = monthTransactions.filter((t) => t.type === "despesa").reduce((sum, t) => sum + t.amount, 0)

      chartData.push({
        month: date.toLocaleDateString("pt-BR", { month: "short" }),
        receita,
        despesa,
      })
    }

    return chartData
  }

  return {
    transactions,
    isLoading,
    addTransaction,
    upsertFreightTransaction,
    updateTransaction,
    deleteTransaction,
    deleteFreightTransaction,
    getMonthlyStats,
    getChartData,
    getFilteredStats,
    getFilteredChartData,
  }
}
