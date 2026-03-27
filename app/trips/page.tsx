"use client"

import { useState, useMemo } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"
import { TripForm } from "@/components/trip-form"
import { TripList } from "@/components/trip-list"
import { CompleteTrip } from "@/components/complete-trip"
import { TripDetails } from "@/components/trip-details"
import { useTrips, type Trip } from "@/hooks/use-trips"
import { useToast } from "@/hooks/use-toast"
import { SearchFilter } from "@/components/search-filter"
import { usePdfReports } from "@/hooks/use-pdf-reports"

export default function TripsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const tripIdParam = searchParams.get("tripId")

  const [showForm, setShowForm] = useState(false)
  const [showCompleteForm, setShowCompleteForm] = useState(false)
  const [completingTrip, setCompletingTrip] = useState<Trip | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const { trips, isLoading, addTrip, completeTrip, deleteTrip } = useTrips()

  const selectedTrip = useMemo(() => {
    if (!tripIdParam || !trips) return null
    return trips.find(t => t.id === tripIdParam) || null
  }, [tripIdParam, trips])

  const showDetails = !!selectedTrip
  const { toast } = useToast()
  const { generateTripsReport, generateSingleTripReport } = usePdfReports()

  const handleSubmit = async (data: Omit<Trip, "id" | "userId" | "status">) => {
    setIsSubmitting(true)

    try {
      const success = await addTrip(data)
      if (success) {
        toast({
          title: "Viagem iniciada",
          description: "A viagem foi registrada com sucesso.",
        })
        setShowForm(false)
      } else {
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao iniciar a viagem. Tente novamente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleComplete = (trip: Trip) => {
    setCompletingTrip(trip)
    setShowCompleteForm(true)
  }

  const handleCompleteSubmit = async (endData: {
    endLocation: string
    endKm: number
    endDate: string
    endTime: string
    refuelingLiters: number
    fuelConsumption: number
  }) => {
    if (!completingTrip) return

    setIsSubmitting(true)

    try {
      const success = await completeTrip(completingTrip.id, endData)
      if (success) {
        toast({
          title: "Viagem finalizada",
          description: "A viagem foi finalizada com sucesso.",
        })
        setShowCompleteForm(false)
        setCompletingTrip(null)
      } else {
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao finalizar a viagem. Tente novamente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteTrip(id)
      if (success) {
        toast({
          title: "Viagem excluída",
          description: "A viagem foi removida do sistema.",
        })
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível excluir a viagem. Tente novamente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleViewDetails = (trip: Trip) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tripId", trip.id)
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleCancel = () => {
    setShowForm(false)
    setShowCompleteForm(false)
    setCompletingTrip(null)
    if (tripIdParam) {
      const params = new URLSearchParams(searchParams.toString())
      params.delete("tripId")
      router.push(`${pathname}?${params.toString()}`)
    }
  }

  const handleDownloadPDF = () => {
    generateTripsReport(trips)
  }

  const handleGenerateSingleReport = (trip: Trip) => {
    generateSingleTripReport(trip)
  }

  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      const matchesSearch =
        trip.truckPlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.startLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (trip.endLocation && trip.endLocation.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesStatus = statusFilter === "all" || trip.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [trips, searchTerm, statusFilter])

  const handleClearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-2">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl uppercase">Viagens</h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base font-medium">
                Monitore e gerencie todas as viagens da sua frota em tempo real.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {!showForm && !showCompleteForm && !showDetails && (
                <>
                  <Button 
                    onClick={handleDownloadPDF} 
                    variant="outline" 
                    size="sm" 
                    className="rounded-2xl border-border/40 hover:bg-primary/5 hover:text-primary transition-all h-10 px-5 font-bold shadow-sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Viagens em PDF
                  </Button>
                  <Button
                    onClick={() => setShowForm(true)}
                    size="sm"
                    className="rounded-2xl bg-primary hover:bg-primary/90 transition-all h-10 px-5 font-bold shadow-lg shadow-primary/20"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Viagem
                  </Button>
                </>
              )}
            </div>
          </div>

          {!showForm && !showCompleteForm && !showDetails && (
            <SearchFilter
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              placeholder="Pesquisar por placa, motorista ou local..."
              filters={[
                {
                  label: "Status",
                  value: statusFilter,
                  options: [
                    { label: "Em Andamento", value: "in_progress" },
                    { label: "Finalizada", value: "completed" },
                  ],
                  onChange: setStatusFilter,
                },
              ]}
              onClearFilters={handleClearFilters}
            />
          )}

          {showForm ? (
            <TripForm onSubmit={handleSubmit} onCancel={handleCancel} isLoading={isSubmitting} />
          ) : showCompleteForm && completingTrip ? (
            <CompleteTrip
              trip={completingTrip}
              onSubmit={handleCompleteSubmit}
              onCancel={handleCancel}
              isLoading={isSubmitting}
            />
          ) : showDetails && selectedTrip ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  ← Voltar
                </Button>
              </div>
              <TripDetails trip={selectedTrip} />
            </div>
          ) : (
            <TripList
              trips={filteredTrips}
              onComplete={handleComplete}
              onDelete={handleDelete}
              onViewDetails={handleViewDetails}
              onGenerateReport={handleGenerateSingleReport}
              isLoading={isLoading}
            />
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
