"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, addDoc, updateDoc, deleteDoc, doc, onSnapshot, or, getDoc, getDocs, writeBatch, increment } from "firebase/firestore"
import { ref, deleteObject } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
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

export interface TripFreightEntry {
  id: string
  value: number
  description?: string
  origin?: string
  destination?: string
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
  freightValue?: number // Valor total do frete em BRL (soma de freightEntries, se houver)
  freightEntries?: TripFreightEntry[] // Lista de fretes da viagem (múltiplas cargas)
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

      // or() + orderBy exige índice composto por cada ramo do OR. A ordenação
      // é feita client-side logo abaixo, então omitimos orderBy/limit no servidor
      // para dispensar os índices e eliminar o FirebaseError "multiple indexes".
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

  const addTrip = async (tripData: Omit<Trip, "id" | "userId" | "status">): Promise<string | null> => {
    if (!user) return null

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

      const docRef = await addDoc(collection(db, "trips"), docData)

      // Marca caminhão e motorista como "em rota" para que não fiquem
      // disponíveis para outras viagens enquanto esta estiver em andamento.
      if (tripData.truckId) {
        await updateDoc(doc(db, "trucks", tripData.truckId), {
          status: "in_route",
          updatedAt: new Date(),
        })
      }
      if (tripData.driverId) {
        await updateDoc(doc(db, "drivers", tripData.driverId), {
          status: "in_route",
          updatedAt: new Date(),
        })
      }

      return docRef.id
    } catch (error) {
      return null
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

      // Libera caminhão e motorista para novas viagens.
      if (currentTrip.truckId) {
        await updateDoc(doc(db, "trucks", currentTrip.truckId), {
          status: "active",
          updatedAt: new Date(),
        })
      }
      if (currentTrip.driverId) {
        await updateDoc(doc(db, "drivers", currentTrip.driverId), {
          status: "active",
          updatedAt: new Date(),
        })
      }

      return true
    } catch (error) {
      return false
    }
  }

  const deleteTrip = async (id: string) => {
    try {
      const tripRef = doc(db, "trips", id)

      // 1. Lê do Firestore (não do estado local, que pode estar defasado).
      const tripSnap = await getDoc(tripRef)
      const tripData = tripSnap.exists()
        ? (tripSnap.data() as Trip)
        : null

      // 2. Apaga fotos do Storage (best-effort — se alguma falhar, seguimos).
      if (tripData?.photos?.length) {
        await Promise.all(
          tripData.photos.map(async (photo) => {
            try {
              const decodedUrl = decodeURIComponent(photo.url)
              const pathMatch = decodedUrl.match(/\/o\/(.+?)\?/)
              if (pathMatch) {
                await deleteObject(ref(storage, pathMatch[1]))
              }
            } catch (err) {
              console.warn(`[deleteTrip] Foto ${photo.id} não pôde ser removida do Storage:`, err)
            }
          }),
        )
      }

      // 3. Busca transações vinculadas por `tripId`.
      const byTripIdSnap = await getDocs(
        query(collection(db, "transactions"), where("tripId", "==", id)),
      )
      const docsToDelete = new Map<string, any>()
      byTripIdSnap.docs.forEach((d) => docsToDelete.set(d.id, d.ref))

      // 4. Rede de segurança para fretes legados sem `tripId`.
      const freightIds = (tripData?.freightEntries || [])
        .map((f) => f.id)
        .filter((fid): fid is string => Boolean(fid))

      for (let i = 0; i < freightIds.length; i += 30) {
        const chunk = freightIds.slice(i, i + 30)
        if (!chunk.length) continue
        const byFreightIdSnap = await getDocs(
          query(collection(db, "transactions"), where("freightEntryId", "in", chunk)),
        )
        byFreightIdSnap.docs.forEach((d) => docsToDelete.set(d.id, d.ref))
      }

      // 5. Se a viagem estava concluída, calcula o KM correto que o caminhão
      //    deve ter após a exclusão: o maior endKm entre as demais viagens
      //    concluídas do mesmo caminhão, ou o startKm desta viagem se não
      //    houver outras.
      let mileageRollback: number | null = null
      if (tripData?.status === "completed" && tripData.truckId) {
        const remainingSnap = await getDocs(
          query(
            collection(db, "trips"),
            where("truckId", "==", tripData.truckId),
            where("status", "==", "completed"),
          ),
        )
        let maxEndKm = tripData.startKm
        remainingSnap.docs.forEach((d) => {
          if (d.id !== id) {
            const t = d.data() as Trip
            if (t.endKm && t.endKm > maxEndKm) maxEndKm = t.endKm
          }
        })
        mileageRollback = maxEndKm
      }

      // 6. Atômico: apaga transações + viagem e corrige dados do caminhão.
      const batch = writeBatch(db)
      docsToDelete.forEach((txRef) => batch.delete(txRef))
      batch.delete(tripRef)

      if (mileageRollback !== null && tripData?.truckId) {
        const truckRef = doc(db, "trucks", tripData.truckId)
        const truckUpdates: Record<string, any> = {
          mileage: mileageRollback,
          updatedAt: new Date(),
        }
        const liters = tripData.refuelingLiters ?? 0
        if (liters > 0) {
          truckUpdates.totalFuelLiters = increment(-liters)
          truckUpdates.currentFuelLevel = increment(liters)
        }
        batch.update(truckRef, truckUpdates)
      }

      // Se a viagem ainda estava em andamento, libera caminhão e motorista
      // (caso já estivesse concluída, ambos já estão "active").
      if (tripData?.status === "in_progress") {
        if (tripData.truckId) {
          batch.update(doc(db, "trucks", tripData.truckId), {
            status: "active",
            updatedAt: new Date(),
          })
        }
        if (tripData.driverId) {
          batch.update(doc(db, "drivers", tripData.driverId), {
            status: "active",
            updatedAt: new Date(),
          })
        }
      }

      await batch.commit()

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
