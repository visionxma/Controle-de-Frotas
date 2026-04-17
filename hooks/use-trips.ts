"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, addDoc, updateDoc, deleteDoc, doc, onSnapshot, or, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useTrucks } from "./use-trucks"
import { differenceInHours, differenceInDays } from "date-fns"

// Modulo-level cache to share singleton across components (prevents multi-listeners memory leak and firestore read quota burst)
let cachedTrips: Trip[] | null = null;
let globalUnsubscribe: (() => void) | null = null;
let listenerCount = 0;
const subscribers = new Set<() => void>();

function notify() {
  subscribers.forEach((callback) => callback());
}

export interface TripPhoto {
  id: string
  url: string
  thumbnailUrl?: string
  uploadedAt: string
  description?: string
  type?: "cargo" | "receipt" | "other"
}

export interface TripProgressEntry {
  km: number
  city: string
  timestamp: string
}

export interface TripRefuelingEntry {
  id: string
  liters: number
  station?: string
  timestamp: string
}

export interface Trip {
  id: string
  truckId: string
  truckPlate: string
  driverId: string
  driverName: string
  startLocation: string
  endLocation?: string
  startKm: number
  endKm?: number
  startDate: string
  startTime: string
  endDate?: string
  endTime?: string
  refuelingLiters?: number // Abastecimento em litros
  fuelConsumption?: number // km/L (quilômetros por litro) - consumo médio
  freightValue?: number // Valor do frete em BRL
  status: "in_progress" | "completed"
  userId: string
  adminId?: string
  createdBy?: string
  createdByRole?: "admin" | "collaborator"
  cargoDescription?: string
  photos?: TripPhoto[]
  // Progress tracking (synced with mobile app)
  progressEntries?: TripProgressEntry[]
  currentKm?: number
  currentCity?: string
  observations?: string
  refuelingEntries?: TripRefuelingEntry[]
}

export function useTrips() {
  const { user } = useAuth()
  const [trips, setTrips] = useState<Trip[]>(cachedTrips || [])
  const [isLoading, setIsLoading] = useState(cachedTrips === null)
  const { updateTruck, incrementTotalFuel, updateFuelLevel } = useTrucks()

  useEffect(() => {
    if (!user) {
      setTrips([])
      setIsLoading(false)
      return
    }

    const handleUpdate = () => {
      setTrips(cachedTrips || [])
      setIsLoading(false)
    }

    subscribers.add(handleUpdate)
    listenerCount++

    if (listenerCount === 1 && !globalUnsubscribe) {
      let tripsQuery;

      if (user.role === "admin") {
        tripsQuery = query(collection(db, "trips"), or(where("userId", "==", user.id), where("adminId", "==", user.id)), orderBy("createdAt", "desc"), limit(200))
      } else if (user.role === "collaborator" && user.adminId) {
        tripsQuery = query(
          collection(db, "trips"),
          or(where("userId", "==", user.id), where("userId", "==", user.adminId)),
          orderBy("createdAt", "desc"), limit(200)
        )
      } else {
        tripsQuery = query(collection(db, "trips"), where("userId", "==", user.id), orderBy("createdAt", "desc"), limit(200))
      }

      const subscribeToQuery = (q: any) => {
        return onSnapshot(
          q,
          (snapshot: any) => {
            const tripsData = snapshot.docs.map((doc: any) => ({
              id: doc.id,
              ...doc.data(),
            })) as Trip[]

            tripsData.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
            cachedTrips = tripsData
            notify()
          },
          (error: any) => {
            console.error("Erro na snapshot de trips:", error)
            // Firebase pode lançar erro pedindo índice composto. Tenta fallback ignorando limit/orderBy.
            if (error.message.includes("index")) {
                console.warn("Fallback (Sem Index compôsto): Consultando DB inteiro...")
                const fallbackQ = query(collection(db, "trips"), or(where("userId", "==", user.id), where("adminId", "==", user.id)))
                globalUnsubscribe && globalUnsubscribe()
                globalUnsubscribe = subscribeToQuery(fallbackQ)
            } else {
                cachedTrips = []
                notify()
            }
          },
        )
      }

      globalUnsubscribe = subscribeToQuery(tripsQuery)
    } else if (cachedTrips !== null) {
      setIsLoading(false)
    }

    return () => {
      subscribers.delete(handleUpdate)
      listenerCount--
      if (listenerCount === 0 && globalUnsubscribe) {
        globalUnsubscribe()
        globalUnsubscribe = null
        cachedTrips = null
      }
    }
  }, [user])

  const addTrip = async (tripData: Omit<Trip, "id" | "userId" | "status">) => {
    if (!user) return false

    try {
      const docData = {
        ...tripData,
        status: "in_progress" as const,
        userId: user.id,
        createdAt: new Date(),
        createdBy: user.name,
        createdByRole: user.role,
        ...(user.role === "collaborator" && user.adminId && { adminId: user.adminId }),
      }

      await addDoc(collection(db, "trips"), docData)
      return true
    } catch (error) {
      return false
    }
  }

  const updateTrip = async (id: string, tripData: Partial<Omit<Trip, "id" | "userId">>) => {
    try {
      const tripRef = doc(db, "trips", id)
      await updateDoc(tripRef, {
        ...tripData,
        updatedAt: new Date(),
      })
      return true
    } catch (error) {
      console.error("Erro ao atualizar viagem:", error)
      return false
    }
  }

  const calculateTripDuration = (startDate: string, startTime: string, endDate?: string, endTime?: string) => {
    if (!endDate || !endTime) return { hours: 0, days: 0 }

    const start = new Date(`${startDate}T${startTime}`)
    const end = new Date(`${endDate}T${endTime}`)

    const diffHours = differenceInHours(end, start)
    const diffDays = differenceInDays(end, start)

    const hours = Math.max(0, diffHours)
    const days = Math.max(0, diffDays)

    return { hours, days }
  }

  const completeTrip = async (
    id: string,
    endData: {
      endLocation: string
      endKm: number
      endDate: string
      endTime: string
      refuelingLiters: number
      fuelConsumption: number // Added manual fuel consumption parameter
    },
  ) => {
    try {
      const currentTrip = trips.find((trip) => trip.id === id)
      if (!currentTrip) {
        return false
      }

      const kmTraveled = endData.endKm - currentTrip.startKm

      const tripRef = doc(db, "trips", id)
      await updateDoc(tripRef, {
        endLocation: endData.endLocation,
        endKm: endData.endKm,
        endDate: endData.endDate,
        endTime: endData.endTime,
        refuelingLiters: endData.refuelingLiters,
        fuelConsumption: Math.round(endData.fuelConsumption * 100) / 100,
        status: "completed",
        updatedAt: new Date(),
      })

      if (kmTraveled > 0) {
        await updateTruck(currentTrip.truckId, { mileage: endData.endKm })
      }

      if (endData.refuelingLiters > 0) {
        await incrementTotalFuel(currentTrip.truckId, endData.refuelingLiters)
        await updateFuelLevel(currentTrip.truckId, endData.refuelingLiters)
      }

      return true
    } catch (error) {
      return false
    }
  }

  const deleteTrip = async (id: string) => {
    try {
      const tripRef = doc(db, "trips", id)
      await deleteDoc(tripRef)
      return true
    } catch (error) {
      console.error("Erro ao deletar viagem:", error)
      return false
    }
  }

  return {
    trips,
    isLoading,
    addTrip,
    updateTrip,
    completeTrip,
    deleteTrip,
    calculateTripDuration,
  }
}
