"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import {
  collection,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

let cachedFixedExpenses: FixedExpense[] | null = null
let globalUnsubscribe: (() => void) | null = null
let listenerCount = 0
const subscribers = new Set<() => void>()

function notify() {
  subscribers.forEach((callback) => callback())
}

export interface FixedExpense {
  id: string
  description: string
  amount: number
  category: string
  dayOfMonth: number
  truckId?: string
  driverId?: string
  userId: string
  adminId?: string
  createdAt?: Date
  updatedAt?: Date
  createdBy?: string
  createdByRole?: "admin" | "collaborator"
}

export function useFixedExpenses() {
  const { user } = useAuth()
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>(cachedFixedExpenses || [])
  const [isLoading, setIsLoading] = useState(cachedFixedExpenses === null)

  useEffect(() => {
    if (!user) {
      setFixedExpenses([])
      setIsLoading(false)
      return
    }

    const handleUpdate = () => {
      setFixedExpenses(cachedFixedExpenses || [])
      setIsLoading(false)
    }

    subscribers.add(handleUpdate)
    listenerCount++

    if (listenerCount === 1 && !globalUnsubscribe) {
      // Query simples por userId — evita INTERNAL ASSERTION FAILED em coleções
      // novas sem índice composto. O fallback no onError também protege.
      const ownerId = user.role === "collaborator" && user.adminId ? user.adminId : user.id
      const q = query(collection(db, "fixed_expenses"), where("userId", "==", ownerId))

      const subscribeToQuery = (q: any) =>
        onSnapshot(
          q,
          (snapshot: any) => {
            const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as FixedExpense[]
            data.sort((a, b) => a.dayOfMonth - b.dayOfMonth)
            cachedFixedExpenses = data
            notify()
          },
          (error: any) => {
            console.warn("[fixed_expenses] Erro na query composta, usando fallback simples:", error?.message ?? error)
            // Fallback: query simples sem or() — evita INTERNAL ASSERTION FAILED
            // em coleções novas sem índice composto criado no Firestore Console
            try {
              const fallbackQ = query(collection(db, "fixed_expenses"), where("userId", "==", user!.id))
              if (globalUnsubscribe) {
                globalUnsubscribe()
                globalUnsubscribe = null
              }
              globalUnsubscribe = subscribeToQuery(fallbackQ)
            } catch {
              cachedFixedExpenses = []
              notify()
            }
          },
        )

      globalUnsubscribe = subscribeToQuery(q)
    } else if (cachedFixedExpenses !== null) {
      setIsLoading(false)
    }

    return () => {
      subscribers.delete(handleUpdate)
      listenerCount--
      if (listenerCount === 0 && globalUnsubscribe) {
        globalUnsubscribe()
        globalUnsubscribe = null
        cachedFixedExpenses = null
      }
    }
  }, [user])

  const addFixedExpense = async (data: Omit<FixedExpense, "id" | "userId">) => {
    if (!user) return false
    try {
      const clean = Object.fromEntries(
        Object.entries({
          ...data,
          userId: user.id,
          createdBy: user.name,
          createdByRole: user.role,
          createdAt: new Date(),
          ...(user.role === "collaborator" && user.adminId && { adminId: user.adminId }),
        }).filter(([_, v]) => v !== undefined),
      )
      await addDoc(collection(db, "fixed_expenses"), clean)
      return true
    } catch (error) {
      console.error("Erro ao adicionar despesa fixa:", error)
      return false
    }
  }

  const updateFixedExpense = async (id: string, data: Partial<Omit<FixedExpense, "id" | "userId">>) => {
    try {
      await updateDoc(doc(db, "fixed_expenses", id), { ...data, updatedAt: new Date() })
      return true
    } catch (error) {
      console.error("Erro ao atualizar despesa fixa:", error)
      return false
    }
  }

  const deleteFixedExpense = async (id: string) => {
    try {
      await deleteDoc(doc(db, "fixed_expenses", id))
      return true
    } catch (error) {
      console.error("Erro ao deletar despesa fixa:", error)
      return false
    }
  }

  const totalMonthly = fixedExpenses.reduce((sum, e) => sum + e.amount, 0)

  return {
    fixedExpenses,
    isLoading,
    totalMonthly,
    addFixedExpense,
    updateFixedExpense,
    deleteFixedExpense,
  }
}
