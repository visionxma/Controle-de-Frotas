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
  increment,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

// Modulo-level cache to share singleton across components (prevents multi-listeners memory leak and firestore read quota burst)
let cachedTrucks: Truck[] | null = null;
let globalUnsubscribe: (() => void) | null = null;
let listenerCount = 0;
const subscribers = new Set<() => void>();

function notify() {
  subscribers.forEach((callback) => callback());
}

export interface Truck {
  id: string
  plate: string
  brand: string
  model: string
  year: number
  color: string
  status: "active" | "maintenance" | "inactive"
  mileage: number
  userId: string
  adminId?: string
  createdBy?: string
  createdByRole?: "admin" | "collaborator"
  totalFuelLiters?: number // Total de combustível consumido em todas as viagens
  fuelCapacity?: number // Capacidade do tanque em litros
  currentFuelLevel?: number // Nível atual de combustível em litros
}

export function useTrucks() {
  const { user } = useAuth()
  const [trucks, setTrucks] = useState<Truck[]>(cachedTrucks || [])
  const [isLoading, setIsLoading] = useState(cachedTrucks === null)

  useEffect(() => {
    if (!user) {
      setTrucks([])
      setIsLoading(false)
      return
    }

    const handleUpdate = () => {
      setTrucks(cachedTrucks || [])
      setIsLoading(false)
    }

    subscribers.add(handleUpdate)
    listenerCount++

    if (listenerCount === 1 && !globalUnsubscribe) {
      let trucksQuery

      if (user.role === "admin") {
        trucksQuery = query(
          collection(db, "trucks"),
          or(where("userId", "==", user.id), where("adminId", "==", user.id)),
        )
      } else if (user.role === "collaborator" && user.adminId) {
        trucksQuery = query(
          collection(db, "trucks"),
          or(where("userId", "==", user.id), where("userId", "==", user.adminId)),
        )
      } else {
        trucksQuery = query(collection(db, "trucks"), where("userId", "==", user.id))
      }

      globalUnsubscribe = onSnapshot(
        trucksQuery,
        (snapshot: any) => {
          const trucksData = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
          })) as Truck[]

          cachedTrucks = trucksData
          notify()
        },
        (error: any) => {
          console.error("Erro na snapshot de trucks:", error)
          cachedTrucks = []
          notify()
        },
      )
    } else if (cachedTrucks !== null) {
      setIsLoading(false)
    }

    return () => {
      subscribers.delete(handleUpdate)
      listenerCount--
      if (listenerCount === 0 && globalUnsubscribe) {
        globalUnsubscribe()
        globalUnsubscribe = null
        cachedTrucks = null
      }
    }
  }, [user])

  const isAtTruckLimit =
    user?.max_trucks != null && user.max_trucks > 0 && trucks.length >= user.max_trucks

  const addTruck = async (truckData: Omit<Truck, "id" | "userId">) => {
    if (!user) return false

    // Bloqueia cadastro acima do limite do plano
    if (isAtTruckLimit) {
      console.warn(`Limite de caminhões atingido: ${trucks.length}/${user.max_trucks}`)
      return false
    }

    try {
      const dataToSave = {
        ...truckData,
        userId: user.id,
        createdAt: new Date(),
        createdBy: user.name,
        createdByRole: user.role,
        totalFuelLiters: 0, // Initialize total fuel to 0
        currentFuelLevel: truckData.fuelCapacity || 0, // Start with full tank
        ...(user.role === "collaborator" && user.adminId && { adminId: user.adminId }),
      }

      await addDoc(collection(db, "trucks"), dataToSave)
      return true
    } catch (error) {
      console.error("Erro ao adicionar caminhão:", error)
      return false
    }
  }

  const updateTruck = async (id: string, truckData: Partial<Omit<Truck, "id" | "userId">>) => {
    try {
      const truckRef = doc(db, "trucks", id)
      await updateDoc(truckRef, {
        ...truckData,
        updatedAt: new Date(),
      })
      return true
    } catch (error) {
      console.error("Erro ao atualizar caminhão:", error)
      return false
    }
  }

  const deleteTruck = async (id: string) => {
    try {
      const truckRef = doc(db, "trucks", id)
      await deleteDoc(truckRef)
      return true
    } catch (error) {
      console.error("Erro ao deletar caminhão:", error)
      return false
    }
  }

  const incrementTotalFuel = async (truckId: string, fuelLiters: number) => {
    try {
      const truckRef = doc(db, "trucks", truckId)
      await updateDoc(truckRef, {
        totalFuelLiters: increment(fuelLiters),
        updatedAt: new Date(),
      })
      return true
    } catch (error) {
      console.error("Erro ao atualizar combustível total do caminhão:", error)
      return false
    }
  }

  const updateFuelLevel = async (truckId: string, fuelUsed: number) => {
    try {
      const truck = trucks.find((t) => t.id === truckId)
      if (!truck) return false

      const newFuelLevel = Math.max(0, (truck.currentFuelLevel || 0) - fuelUsed)

      const truckRef = doc(db, "trucks", truckId)
      await updateDoc(truckRef, {
        currentFuelLevel: newFuelLevel,
        updatedAt: new Date(),
      })
      return true
    } catch (error) {
      console.error("Erro ao atualizar nível de combustível do caminhão:", error)
      return false
    }
  }

  return {
    trucks,
    isLoading,
    isAtTruckLimit,
    addTruck,
    updateTruck,
    deleteTruck,
    incrementTotalFuel,
    updateFuelLevel,
  }
}
