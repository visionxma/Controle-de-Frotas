"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, addDoc, updateDoc, deleteDoc, doc, onSnapshot, or } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useTrucks } from "./use-trucks"

export interface TripPhoto {
  id: string
  url: string
  thumbnailUrl?: string
  uploadedAt: string
  description?: string
  type?: "cargo" | "receipt" | "other"
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
  status: "in_progress" | "completed"
  userId: string
  adminId?: string
  createdBy?: string
  createdByRole?: "admin" | "collaborator"
  cargoDescription?: string
  photos?: TripPhoto[]
}

export function useTrips() {
  const { user } = useAuth()
  const [trips, setTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { updateTruck, incrementTotalFuel, updateFuelLevel } = useTrucks()

  useEffect(() => {
    if (user) {
      let tripsQuery

      if (user.role === "admin") {
        tripsQuery = query(collection(db, "trips"), or(where("userId", "==", user.id), where("adminId", "==", user.id)))
      } else if (user.role === "collaborator" && user.adminId) {
        tripsQuery = query(
          collection(db, "trips"),
          or(where("userId", "==", user.id), where("userId", "==", user.adminId)),
        )
      } else {
        tripsQuery = query(collection(db, "trips"), where("userId", "==", user.id))
      }

      const unsubscribe = onSnapshot(
        tripsQuery,
        (snapshot) => {
          const tripsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Trip[]

          tripsData.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())

          setTrips(tripsData)
          setIsLoading(false)
        },
        (error) => {
          setTrips([])
          setIsLoading(false)
        },
      )

      return () => unsubscribe()
    } else {
      setTrips([])
      setIsLoading(false)
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

    const diffMs = end.getTime() - start.getTime()
    const hours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100 // 2 casas decimais
    const days = Math.round((diffMs / (1000 * 60 * 60 * 24)) * 100) / 100 // 2 casas decimais

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
