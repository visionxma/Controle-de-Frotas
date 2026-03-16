"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, addDoc, updateDoc, deleteDoc, doc, onSnapshot, or } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface Machinery {
  id: string
  model: string
  brand: string
  serialNumber: string
  year: number
  type: "tractor" | "excavator" | "loader" | "bulldozer" | "crane" | "other"
  status: "active" | "maintenance" | "inactive"
  hours: number // Horímetro
  userId: string
  adminId?: string
  createdBy?: string // Name of the user who created this record
  createdByRole?: "admin" | "collaborator" // Role of the creator
  createdAt?: Date
  updatedAt?: Date
}

export function useMachinery() {
  const { user } = useAuth()
  const [machinery, setMachinery] = useState<Machinery[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log("[v0] useMachinery - user:", user)
    console.log("[v0] useMachinery - user.id:", user?.id)

    if (user) {
      let machineryQuery

      if (user.role === "admin") {
        machineryQuery = query(
          collection(db, "machinery"),
          or(where("userId", "==", user.id), where("adminId", "==", user.id)),
        )
      } else if (user.role === "collaborator" && user.adminId) {
        machineryQuery = query(
          collection(db, "machinery"),
          or(where("userId", "==", user.id), where("userId", "==", user.adminId)),
        )
      } else {
        machineryQuery = query(collection(db, "machinery"), where("userId", "==", user.id))
      }

      console.log("[v0] useMachinery - criando query para userId:", user.id)

      const unsubscribe = onSnapshot(
        machineryQuery,
        (snapshot) => {
          console.log("[v0] useMachinery - snapshot recebido, docs:", snapshot.docs.length)
          const machineryData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Machinery[]

          setMachinery(machineryData)
          setIsLoading(false)
        },
        (error) => {
          console.error("[v0] useMachinery - Erro ao carregar máquinas:", error)
          console.error("[v0] useMachinery - Error code:", error.code)
          console.error("[v0] useMachinery - Error message:", error.message)
          setMachinery([])
          setIsLoading(false)
        },
      )

      return () => unsubscribe()
    } else {
      console.log("[v0] useMachinery - usuário não autenticado")
      setMachinery([])
      setIsLoading(false)
    }
  }, [user])

  const addMachinery = async (machineryData: Omit<Machinery, "id" | "userId">) => {
    if (!user) return false

    try {
      const dataToSave = {
        ...machineryData,
        userId: user.id,
        createdAt: new Date(),
        createdBy: user.name,
        createdByRole: user.role,
        ...(user.role === "collaborator" && user.adminId && { adminId: user.adminId }),
      }

      await addDoc(collection(db, "machinery"), dataToSave)
      return true
    } catch (error) {
      console.error("Erro ao adicionar máquina:", error)
      return false
    }
  }

  const updateMachinery = async (id: string, machineryData: Partial<Omit<Machinery, "id" | "userId">>) => {
    try {
      const machineryRef = doc(db, "machinery", id)
      await updateDoc(machineryRef, {
        ...machineryData,
        updatedAt: new Date(),
      })
      return true
    } catch (error) {
      console.error("Erro ao atualizar máquina:", error)
      return false
    }
  }

  const deleteMachinery = async (id: string) => {
    try {
      const machineryRef = doc(db, "machinery", id)
      await deleteDoc(machineryRef)
      return true
    } catch (error) {
      console.error("Erro ao deletar máquina:", error)
      return false
    }
  }

  return {
    machinery,
    isLoading,
    addMachinery,
    updateMachinery,
    deleteMachinery,
  }
}
