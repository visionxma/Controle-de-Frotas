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
  getDocs,
  or,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface Driver {
  id: string
  name: string
  cpf: string
  cnh: string
  cnhCategory: string
  cnhExpiry: string
  phone: string
  email?: string
  address?: string
  birthDate: string
  status: "active" | "inactive" | "suspended"
  userId: string
  adminId?: string
  createdAt?: Date
  updatedAt?: Date
  createdBy?: string // Name of the user who created this record
  createdByRole?: "admin" | "collaborator" // Role of the creator
}

export function useDrivers() {
  const { user } = useAuth()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      let driversQuery

      if (user.role === "admin") {
        // Admin sees their own data and all collaborators' data
        driversQuery = query(
          collection(db, "drivers"),
          or(where("userId", "==", user.id), where("adminId", "==", user.id)),
        )
      } else if (user.role === "collaborator" && user.adminId) {
        // Collaborator sees admin's data and their own data
        driversQuery = query(
          collection(db, "drivers"),
          or(where("userId", "==", user.id), where("userId", "==", user.adminId)),
        )
      } else {
        // Fallback to individual user data
        driversQuery = query(collection(db, "drivers"), where("userId", "==", user.id))
      }

      const unsubscribe = onSnapshot(
        driversQuery,
        (snapshot) => {
          const driversData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Driver[]

          setDrivers(driversData)
          setIsLoading(false)
        },
        (error) => {
          setDrivers([])
          setIsLoading(false)
        },
      )

      return () => unsubscribe()
    } else {
      setDrivers([])
      setIsLoading(false)
    }
  }, [user])

  const addDriver = async (driverData: Omit<Driver, "id" | "userId">) => {
    if (!user) return false

    try {
      const driversQuery = query(
        collection(db, "drivers"),
        where("userId", "==", user.id),
        where("cpf", "==", driverData.cpf),
      )
      const existingDrivers = await getDocs(driversQuery)

      if (!existingDrivers.empty) {
        return false // CPF já cadastrado
      }

      const dataToSave = {
        ...driverData,
        userId: user.id,
        createdAt: new Date(),
        createdBy: user.name,
        createdByRole: user.role,
        ...(user.role === "collaborator" && user.adminId && { adminId: user.adminId }),
      }

      await addDoc(collection(db, "drivers"), dataToSave)
      return true
    } catch (error) {
      console.error("Erro ao adicionar motorista:", error)
      return false
    }
  }

  const updateDriver = async (id: string, driverData: Partial<Omit<Driver, "id" | "userId">>) => {
    try {
      const driverRef = doc(db, "drivers", id)
      await updateDoc(driverRef, {
        ...driverData,
        updatedAt: new Date(),
      })
      return true
    } catch (error) {
      console.error("Erro ao atualizar motorista:", error)
      return false
    }
  }

  const deleteDriver = async (id: string) => {
    try {
      const driverRef = doc(db, "drivers", id)
      await deleteDoc(driverRef)
      return true
    } catch (error) {
      console.error("Erro ao deletar motorista:", error)
      return false
    }
  }

  return {
    drivers,
    isLoading,
    addDriver,
    updateDriver,
    deleteDriver,
  }
}
