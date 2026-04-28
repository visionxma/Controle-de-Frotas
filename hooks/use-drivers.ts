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

// Modulo-level cache to share singleton across components (prevents multi-listeners memory leak and firestore read quota burst)
let cachedDrivers: Driver[] | null = null;
let globalUnsubscribe: (() => void) | null = null;
let listenerCount = 0;
const subscribers = new Set<() => void>();

function notify() {
  subscribers.forEach((callback) => callback());
}

export interface DriverPermissions {
  can_create_trips: boolean
  can_cancel_trips: boolean
  can_complete_trips: boolean
  can_add_expenses: boolean
  can_upload_photos: boolean
  can_edit_notes: boolean
  can_view_finances: boolean
  can_view_settings: boolean
}

export const DEFAULT_DRIVER_PERMISSIONS: DriverPermissions = {
  can_create_trips: true,
  can_cancel_trips: true,
  can_complete_trips: true,
  can_add_expenses: true,
  can_upload_photos: true,
  can_edit_notes: true,
  can_view_finances: true,
  can_view_settings: true,
}

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
  status: "active" | "inactive" | "suspended" | "in_route"
  commissionPercentage?: number
  permissions?: DriverPermissions
  userId: string
  adminId?: string
  createdAt?: Date
  updatedAt?: Date
  createdBy?: string // Name of the user who created this record
  createdByRole?: "admin" | "collaborator" // Role of the creator
  // App mobile access fields
  uid?: string
  hasAppAccess?: boolean
  role?: string
}

export function useDrivers() {
  const { user } = useAuth()
  const [drivers, setDrivers] = useState<Driver[]>(cachedDrivers || [])
  const [isLoading, setIsLoading] = useState(cachedDrivers === null)

  useEffect(() => {
    if (!user) {
      setDrivers([])
      setIsLoading(false)
      return
    }

    const handleUpdate = () => {
      setDrivers(cachedDrivers || [])
      setIsLoading(false)
    }

    subscribers.add(handleUpdate)
    listenerCount++

    if (listenerCount === 1 && !globalUnsubscribe) {
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

      globalUnsubscribe = onSnapshot(
        driversQuery,
        (snapshot: any) => {
          const driversData = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
          })) as Driver[]

          cachedDrivers = driversData
          notify()
        },
        (error: any) => {
          console.error("Erro na snapshot de drivers:", error)
          cachedDrivers = []
          notify()
        },
      )
    } else if (cachedDrivers !== null) {
      setIsLoading(false)
    }

    return () => {
      subscribers.delete(handleUpdate)
      listenerCount--
      if (listenerCount === 0 && globalUnsubscribe) {
        globalUnsubscribe()
        globalUnsubscribe = null
        cachedDrivers = null
      }
    }
  }, [user])

  const addDriver = async (driverData: Omit<Driver, "id" | "userId">) => {
    if (!user) return false

    try {
      // Verifica CPF duplicado usando o cache local (evita query composta que exige índice)
      const cpfExists = (cachedDrivers || []).some(
        (d) => d.cpf === driverData.cpf
      )

      if (cpfExists) {
        return false // CPF já cadastrado
      }

      const dataToSave = {
        ...driverData,
        permissions: driverData.permissions || DEFAULT_DRIVER_PERMISSIONS,
        userId: user.id,
        createdAt: new Date(),
        createdBy: user.name,
        createdByRole: user.role,
        ...(user.role === "collaborator" && user.adminId && { adminId: user.adminId }),
      }

      // Remove campos undefined antes de salvar (Firestore rejeita undefined)
      const cleanData = Object.fromEntries(
        Object.entries(dataToSave).filter(([_, v]) => v !== undefined)
      )

      console.log("[addDriver] Salvando motorista:", { cpf: driverData.cpf, userId: user.id, keys: Object.keys(cleanData) })
      await addDoc(collection(db, "drivers"), cleanData)
      console.log("[addDriver] Motorista salvo com sucesso")
      return true
    } catch (error: any) {
      console.error("[addDriver] ERRO:", error.code, error.message, error)
      return false
    }
  }

  const updateDriver = async (id: string, driverData: Partial<Omit<Driver, "id" | "userId">>) => {
    try {
      const driverRef = doc(db, "drivers", id)
      // Remove campos undefined antes de atualizar (Firestore rejeita undefined)
      const cleanData = Object.fromEntries(
        Object.entries({ ...driverData, updatedAt: new Date() }).filter(([_, v]) => v !== undefined)
      )
      await updateDoc(driverRef, cleanData)
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
