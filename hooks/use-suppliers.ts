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
  or,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

// Cache singleton para compartilhar entre componentes (mesmo padrão de use-trucks)
let cachedSuppliers: Supplier[] | null = null
let globalUnsubscribe: (() => void) | null = null
let listenerCount = 0
const subscribers = new Set<() => void>()

function notify() {
  subscribers.forEach((callback) => callback())
}

export interface Supplier {
  id: string
  name: string                // Razão social
  tradeName?: string          // Nome fantasia
  cnpj: string
  email?: string
  phone: string
  address?: string
  city?: string
  state?: string
  contactName?: string        // Nome do responsável/contato
  category?: string           // Tipo: peças, combustível, manutenção, equipamentos, etc.
  status: "active" | "inactive"
  notes?: string
  userId: string
  adminId?: string
  createdBy?: string
  createdByRole?: "admin" | "collaborator"
  createdAt?: Date
  updatedAt?: Date
}

export function useSuppliers() {
  const { user } = useAuth()
  const [suppliers, setSuppliers] = useState<Supplier[]>(cachedSuppliers || [])
  const [isLoading, setIsLoading] = useState(cachedSuppliers === null)

  useEffect(() => {
    if (!user) {
      setSuppliers([])
      setIsLoading(false)
      return
    }

    const handleUpdate = () => {
      setSuppliers(cachedSuppliers || [])
      setIsLoading(false)
    }

    subscribers.add(handleUpdate)
    listenerCount++

    if (listenerCount === 1 && !globalUnsubscribe) {
      let suppliersQuery

      if (user.role === "admin") {
        suppliersQuery = query(
          collection(db, "suppliers"),
          or(where("userId", "==", user.id), where("adminId", "==", user.id)),
        )
      } else if (user.role === "collaborator" && user.adminId) {
        suppliersQuery = query(
          collection(db, "suppliers"),
          or(where("userId", "==", user.id), where("userId", "==", user.adminId)),
        )
      } else {
        suppliersQuery = query(collection(db, "suppliers"), where("userId", "==", user.id))
      }

      globalUnsubscribe = onSnapshot(
        suppliersQuery,
        (snapshot: any) => {
          const data = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
          })) as Supplier[]

          // Ordena alfabeticamente por nome client-side
          data.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))

          cachedSuppliers = data
          notify()
        },
        (error: any) => {
          console.error("Erro na snapshot de suppliers:", error)
          cachedSuppliers = []
          notify()
        },
      )
    } else if (cachedSuppliers !== null) {
      setIsLoading(false)
    }

    return () => {
      subscribers.delete(handleUpdate)
      listenerCount--
      if (listenerCount === 0 && globalUnsubscribe) {
        globalUnsubscribe()
        globalUnsubscribe = null
        cachedSuppliers = null
      }
    }
  }, [user])

  const addSupplier = async (supplierData: Omit<Supplier, "id" | "userId">) => {
    if (!user) {
      throw new Error("Usuário não autenticado")
    }

    try {
      const cleanData = Object.fromEntries(
        Object.entries({
          ...supplierData,
          userId: user.id,
          createdBy: user.name,
          createdByRole: user.role,
          createdAt: new Date(),
          ...(user.role === "collaborator" && user.adminId && { adminId: user.adminId }),
        }).filter(([_, value]) => value !== undefined && value !== ""),
      )

      console.log("[useSuppliers] addSupplier — payload:", cleanData)

      await addDoc(collection(db, "suppliers"), cleanData)
      return true
    } catch (error: any) {
      console.error("[useSuppliers] Erro ao adicionar fornecedor:", error)
      console.error("[useSuppliers] Error code:", error?.code)
      console.error("[useSuppliers] Error message:", error?.message)

      // Repassa o erro com mais contexto pra UI mostrar uma mensagem útil
      if (error?.code === "permission-denied") {
        throw new Error(
          "Permissão negada pelo Firestore. As regras da coleção 'suppliers' provavelmente não foram deployadas. Rode: firebase deploy --only firestore:rules",
        )
      }
      throw new Error(error?.message || "Erro desconhecido ao salvar fornecedor")
    }
  }

  const updateSupplier = async (
    id: string,
    supplierData: Partial<Omit<Supplier, "id" | "userId">>,
  ) => {
    try {
      const cleanData = Object.fromEntries(
        Object.entries({
          ...supplierData,
          updatedAt: new Date(),
        }).filter(([_, value]) => value !== undefined),
      )

      const supplierRef = doc(db, "suppliers", id)
      await updateDoc(supplierRef, cleanData)
      return true
    } catch (error: any) {
      console.error("[useSuppliers] Erro ao atualizar fornecedor:", error)
      if (error?.code === "permission-denied") {
        throw new Error(
          "Permissão negada pelo Firestore. As regras da coleção 'suppliers' provavelmente não foram deployadas. Rode: firebase deploy --only firestore:rules",
        )
      }
      throw new Error(error?.message || "Erro desconhecido ao atualizar fornecedor")
    }
  }

  const deleteSupplier = async (id: string) => {
    try {
      const supplierRef = doc(db, "suppliers", id)
      await deleteDoc(supplierRef)
      return true
    } catch (error) {
      console.error("Erro ao deletar fornecedor:", error)
      return false
    }
  }

  return {
    suppliers,
    isLoading,
    addSupplier,
    updateSupplier,
    deleteSupplier,
  }
}
