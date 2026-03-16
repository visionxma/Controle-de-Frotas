"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, addDoc, updateDoc, deleteDoc, doc, onSnapshot, or } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useMachinery } from "./use-machinery"

export interface Rental {
  id: string
  machineryId: string
  machinerySerial: string
  driverId: string
  driverName: string
  startLocation: string
  endLocation?: string
  initialHours: number
  finalHours?: number
  date: string
  endDate?: string
  hourlyRate: number
  status: "in_progress" | "completed"
  userId: string
  adminId?: string
  createdBy?: string // Name of the user who created this record
  createdByRole?: "admin" | "collaborator" // Role of the creator
  createdAt?: Date
  updatedAt?: Date
}

export function useRentals() {
  const { user } = useAuth()
  const [rentals, setRentals] = useState<Rental[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { updateMachinery } = useMachinery()

  useEffect(() => {
    if (user) {
      console.log("[v0] useRentals - user:", user)
      console.log("[v0] useRentals - user.id:", user.id)

      let rentalsQuery

      if (user.role === "admin") {
        rentalsQuery = query(
          collection(db, "rentals"),
          or(where("userId", "==", user.id), where("adminId", "==", user.id)),
        )
      } else if (user.role === "collaborator" && user.adminId) {
        rentalsQuery = query(
          collection(db, "rentals"),
          or(where("userId", "==", user.id), where("userId", "==", user.adminId)),
        )
      } else {
        rentalsQuery = query(collection(db, "rentals"), where("userId", "==", user.id))
      }

      console.log("[v0] useRentals - criando query para userId:", user.id)

      const unsubscribe = onSnapshot(
        rentalsQuery,
        (snapshot) => {
          console.log("[v0] useRentals - snapshot recebido, docs:", snapshot.docs.length)
          const rentalsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Rental[]

          rentalsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

          setRentals(rentalsData)
          setIsLoading(false)
        },
        (error) => {
          console.error("Erro ao carregar locações:", error)
          console.log("[v0] useRentals - Error code:", error.code)
          console.log("[v0] useRentals - Error message:", error.message)
          setRentals([])
          setIsLoading(false)
        },
      )

      return () => unsubscribe()
    } else {
      setRentals([])
      setIsLoading(false)
    }
  }, [user])

  const addRental = async (rentalData: Omit<Rental, "id" | "userId" | "status">) => {
    if (!user) return false

    try {
      console.log("[v0] useRentals - addRental chamado com:", rentalData)
      console.log("[v0] useRentals - user.id:", user.id)

      const docData = {
        ...rentalData,
        status: "in_progress" as const,
        userId: user.id,
        createdAt: new Date(),
        createdBy: user.name,
        createdByRole: user.role,
        ...(user.role === "collaborator" && user.adminId && { adminId: user.adminId }),
      }

      console.log("[v0] useRentals - dados para salvar:", docData)

      await addDoc(collection(db, "rentals"), docData)
      console.log("[v0] useRentals - locação adicionada com sucesso")
      return true
    } catch (error) {
      console.error("Erro ao adicionar locação:", error)
      console.log("[v0] useRentals - Error code:", (error as any).code)
      console.log("[v0] useRentals - Error message:", (error as any).message)
      return false
    }
  }

  const updateRental = async (id: string, rentalData: Partial<Omit<Rental, "id" | "userId">>) => {
    try {
      const rentalRef = doc(db, "rentals", id)
      await updateDoc(rentalRef, {
        ...rentalData,
        updatedAt: new Date(),
      })
      return true
    } catch (error) {
      console.error("Erro ao atualizar locação:", error)
      return false
    }
  }

  const calculateRentalStats = (rental: Rental) => {
    if (!rental.finalHours) {
      return {
        totalHours: 0,
        totalValue: 0,
        workingDays: 0,
        effectiveHours: 0,
      }
    }

    const totalHours = rental.finalHours - rental.initialHours
    const totalValue = totalHours * rental.hourlyRate

    // Calcular dias trabalhados
    const startDate = new Date(rental.date)
    const endDate = new Date(rental.endDate || rental.date)
    const timeDiff = endDate.getTime() - startDate.getTime()
    const workingDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1

    // Horas efetivas (assumindo 8 horas por dia útil)
    const effectiveHours = workingDays * 8

    return {
      totalHours: Math.round(totalHours * 100) / 100,
      totalValue: Math.round(totalValue * 100) / 100,
      workingDays,
      effectiveHours,
    }
  }

  const completeRental = async (
    id: string,
    endData: {
      endLocation: string
      finalHours: number
      endDate: string
    },
  ) => {
    try {
      const currentRental = rentals.find((rental) => rental.id === id)
      if (!currentRental) {
        console.error("Locação não encontrada para atualização")
        return false
      }

      const rentalRef = doc(db, "rentals", id)
      await updateDoc(rentalRef, {
        endLocation: endData.endLocation,
        finalHours: endData.finalHours,
        endDate: endData.endDate,
        status: "completed",
        updatedAt: new Date(),
      })

      const hoursWorked = endData.finalHours - currentRental.initialHours
      if (hoursWorked > 0) {
        console.log(`[v0] Atualizando horímetro da máquina ${currentRental.machineryId} com +${hoursWorked} horas`)

        // Usar o horímetro final da locação como novo horímetro da máquina
        await updateMachinery(currentRental.machineryId, { hours: endData.finalHours })
        console.log(`[v0] Horímetro da máquina atualizado para ${endData.finalHours} horas`)
      }

      return true
    } catch (error) {
      console.error("Erro ao finalizar locação:", error)
      return false
    }
  }

  const deleteRental = async (id: string) => {
    try {
      const rentalRef = doc(db, "rentals", id)
      await deleteDoc(rentalRef)
      return true
    } catch (error) {
      console.error("Erro ao deletar locação:", error)
      return false
    }
  }

  return {
    rentals,
    isLoading,
    addRental,
    updateRental,
    completeRental,
    deleteRental,
    calculateRentalStats,
  }
}
