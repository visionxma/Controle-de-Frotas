"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Truck,
  User,
  MapPin,
  Calendar,
  Clock,
  Package,
  Fuel,
  FileText,
  Navigation,
  Save,
  Loader2,
  MessageSquare,
  Activity,
  TrendingDown,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  DollarSign,
} from "lucide-react"
import type { Trip, TripProgressEntry, TripRefuelingEntry, TripFreightEntry } from "@/hooks/use-trips"
import { useTrips } from "@/hooks/use-trips"
import { useTransactions } from "@/hooks/use-transactions"
import { TripPhotoGallery } from "@/components/trip-photo-gallery"
import { TripExpenseModal } from "@/components/trip-expense-modal"
import { CityAutocomplete } from "@/components/city-autocomplete"
import { CurrencyInput } from "@/components/currency-input"
import { usePdfReports } from "@/hooks/use-pdf-reports"
import { toast } from "sonner"

interface TripDetailsProps {
  trip: Trip
  onComplete?: (trip: Trip) => void
}

export function TripDetails({ trip, onComplete }: TripDetailsProps) {
  const { calculateTripDuration, updateTrip } = useTrips()
  const { transactions, deleteTransaction } = useTransactions()
  const { generateSingleTripReport } = usePdfReports()
  const kmTraveled = trip.endKm ? trip.endKm - trip.startKm : 0
  const duration = calculateTripDuration(trip.startDate, trip.startTime, trip.endDate, trip.endTime)

  const fuelConsumed = trip.fuelConsumption && kmTraveled > 0 ? kmTraveled / trip.fuelConsumption : 0
  const remainingFuel = trip.refuelingLiters && fuelConsumed > 0 ? Math.max(0, trip.refuelingLiters - fuelConsumed) : 0

  // Progress form state
  const [progressKm, setProgressKm] = useState(String(trip.currentKm || trip.startKm))
  const [progressCity, setProgressCity] = useState(trip.currentCity || "")
  const [isSavingProgress, setIsSavingProgress] = useState(false)

  // Observations state
  const [observations, setObservations] = useState(trip.observations || "")
  const [isSavingObs, setIsSavingObs] = useState(false)

  // Expense modal state
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showAllExpenses, setShowAllExpenses] = useState(false)

  // Refueling form state
  const [refuelLiters, setRefuelLiters] = useState("")
  const [refuelStation, setRefuelStation] = useState("")
  const [isSavingRefuel, setIsSavingRefuel] = useState(false)

  // Freight entries form state
  const [newFreightValue, setNewFreightValue] = useState<number>(0)
  const [newFreightDescription, setNewFreightDescription] = useState("")
  const [newFreightOrigin, setNewFreightOrigin] = useState("")
  const [newFreightDestination, setNewFreightDestination] = useState("")
  const [isSavingFreight, setIsSavingFreight] = useState(false)
  const [deleteFreightId, setDeleteFreightId] = useState<string | null>(null)

  // Confirmação de exclusão
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null)
  const [deleteRefuelId, setDeleteRefuelId] = useState<string | null>(null)

  const refuelingEntries = trip.refuelingEntries || []
  const totalRefueled = refuelingEntries.reduce((sum, r) => sum + (r.liters || 0), 0)

  const freightEntries = trip.freightEntries || []
  const totalFreight = freightEntries.reduce((sum, f) => sum + (f.value || 0), 0)
  // Valor legado (viagens antigas cadastradas antes dos múltiplos fretes)
  const legacyFreightValue = (!freightEntries.length && trip.freightValue) ? trip.freightValue : 0
  const displayedFreightTotal = totalFreight + legacyFreightValue

  const tripExpenses = transactions.filter(
    (t) => t.tripId === trip.id && t.type === "despesa",
  )
  const totalExpenses = tripExpenses.reduce((sum, t) => sum + t.amount, 0)

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  const confirmDeleteExpense = async () => {
    if (!deleteExpenseId) return
    const success = await deleteTransaction(deleteExpenseId)
    if (success) {
      toast.success("Despesa removida")
    } else {
      toast.error("Erro ao remover despesa")
    }
    setDeleteExpenseId(null)
  }

  const lastEntry = trip.progressEntries?.length
    ? trip.progressEntries[trip.progressEntries.length - 1]
    : null

  const handleSaveProgress = async () => {
    const km = Number(progressKm)
    if (!km || km < trip.startKm) {
      toast.error("KM deve ser maior que o KM inicial da viagem")
      return
    }
    if (!progressCity.trim()) {
      toast.error("Informe a cidade atual")
      return
    }

    setIsSavingProgress(true)
    try {
      const newEntry: TripProgressEntry = {
        km,
        city: progressCity.trim(),
        timestamp: new Date().toISOString(),
      }

      const existingEntries = trip.progressEntries || []

      const success = await updateTrip(trip.id, {
        progressEntries: [...existingEntries, newEntry],
        currentKm: km,
        currentCity: progressCity.trim(),
      } as any)

      if (success) {
        toast.success("Progresso salvo com sucesso!")
      } else {
        toast.error("Erro ao salvar progresso")
      }
    } catch {
      toast.error("Erro ao salvar progresso")
    } finally {
      setIsSavingProgress(false)
    }
  }

  const handleAddRefuel = async () => {
    const liters = Number(refuelLiters)
    if (!liters || liters <= 0) {
      toast.error("Informe a quantidade de litros")
      return
    }

    setIsSavingRefuel(true)
    try {
      const newEntry: TripRefuelingEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        liters,
        station: refuelStation.trim() || undefined,
        timestamp: new Date().toISOString(),
      }

      const success = await updateTrip(trip.id, {
        refuelingEntries: [...refuelingEntries, newEntry],
      } as any)

      if (success) {
        toast.success("Abastecimento registrado!")
        setRefuelLiters("")
        setRefuelStation("")
      } else {
        toast.error("Erro ao registrar abastecimento")
      }
    } catch {
      toast.error("Erro ao registrar abastecimento")
    } finally {
      setIsSavingRefuel(false)
    }
  }

  const confirmDeleteRefuel = async () => {
    if (!deleteRefuelId) return
    const success = await updateTrip(trip.id, {
      refuelingEntries: refuelingEntries.filter((r) => r.id !== deleteRefuelId),
    } as any)
    if (success) {
      toast.success("Abastecimento removido")
    } else {
      toast.error("Erro ao remover abastecimento")
    }
    setDeleteRefuelId(null)
  }

  const handleAddFreight = async () => {
    if (!newFreightValue || newFreightValue <= 0) {
      toast.error("Informe um valor de frete maior que zero")
      return
    }

    setIsSavingFreight(true)
    try {
      const newEntry: TripFreightEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        value: newFreightValue,
        description: newFreightDescription.trim() || undefined,
        origin: newFreightOrigin.trim() || undefined,
        destination: newFreightDestination.trim() || undefined,
        timestamp: new Date().toISOString(),
      }

      // Migra valor legado para a lista no primeiro registro
      const baseEntries: TripFreightEntry[] = freightEntries.length
        ? freightEntries
        : legacyFreightValue > 0
          ? [{
              id: `legacy-${Date.now()}`,
              value: legacyFreightValue,
              description: trip.cargoDescription || undefined,
              origin: trip.startLocation || undefined,
              destination: trip.endLocation || undefined,
              timestamp: new Date(`${trip.startDate}T${trip.startTime || "00:00"}`).toISOString(),
            }]
          : []

      const updatedEntries = [...baseEntries, newEntry]
      const updatedTotal = updatedEntries.reduce((sum, f) => sum + (f.value || 0), 0)

      const success = await updateTrip(trip.id, {
        freightEntries: updatedEntries,
        freightValue: updatedTotal,
      } as any)

      if (success) {
        toast.success("Frete adicionado!")
        setNewFreightValue(0)
        setNewFreightDescription("")
        setNewFreightOrigin("")
        setNewFreightDestination("")
      } else {
        toast.error("Erro ao adicionar frete")
      }
    } catch {
      toast.error("Erro ao adicionar frete")
    } finally {
      setIsSavingFreight(false)
    }
  }

  const confirmDeleteFreight = async () => {
    if (!deleteFreightId) return
    const updatedEntries = freightEntries.filter((f) => f.id !== deleteFreightId)
    const updatedTotal = updatedEntries.reduce((sum, f) => sum + (f.value || 0), 0)
    const success = await updateTrip(trip.id, {
      freightEntries: updatedEntries,
      freightValue: updatedTotal > 0 ? updatedTotal : undefined,
    } as any)
    if (success) {
      toast.success("Frete removido")
    } else {
      toast.error("Erro ao remover frete")
    }
    setDeleteFreightId(null)
  }

  const handleSaveObservations = async () => {
    setIsSavingObs(true)
    try {
      const success = await updateTrip(trip.id, { observations: observations.trim() } as any)
      if (success) {
        toast.success("Observações salvas!")
      } else {
        toast.error("Erro ao salvar observações")
      }
    } catch {
      toast.error("Erro ao salvar observações")
    } finally {
      setIsSavingObs(false)
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("pt-BR")
    } catch {
      return dateStr
    }
  }

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    } catch {
      return ""
    }
  }

  return (
    <div className="space-y-6">
      {/* Informações básicas da viagem */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Viagem #{trip.id.slice(-6)}
            </CardTitle>
            <div className="flex items-center gap-3">
              <Badge variant={trip.status === "completed" ? "default" : "secondary"}>
                {trip.status === "completed" ? "Finalizada" : "Em Andamento"}
              </Badge>
              {trip.status === "completed" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => generateSingleTripReport(trip, transactions)}
                  className="h-8 px-3 rounded-xl border-border/40 font-bold text-xs hover:bg-green-500/5 hover:text-green-600 hover:border-green-500/30 transition-all"
                >
                  <FileText className="h-3.5 w-3.5 mr-1.5" />
                  Gerar PDF
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-gray-500" />
              <span>{trip.truckPlate}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span>{trip.driverName}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span>{trip.startLocation}</span>
              {trip.endLocation && <span> → {trip.endLocation}</span>}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span>
                {trip.startDate} {trip.startTime}
              </span>
              {trip.endDate && (
                <span>
                  {" "}
                  → {trip.endDate} {trip.endTime}
                </span>
              )}
            </div>
          </div>

          {trip.cargoDescription && (
            <div className="pt-4 border-t">
              <div className="flex items-start gap-2">
                <Package className="h-4 w-4 text-gray-500 mt-1" />
                <div>
                  <p className="text-sm font-medium mb-1">Descrição da Carga</p>
                  <p className="text-sm text-muted-foreground">{trip.cargoDescription}</p>
                </div>
              </div>
            </div>
          )}

          {/* Estatísticas — viagem em andamento mostra KM parcial */}
          {trip.status === "in_progress" && (trip.currentKm || trip.startKm) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md">
                <div className="text-sm font-medium text-blue-800 dark:text-blue-300">KM Inicial</div>
                <div className="text-lg font-semibold text-blue-900 dark:text-blue-200">{trip.startKm.toLocaleString()} km</div>
              </div>
              {trip.currentKm && trip.currentKm > trip.startKm && (
                <>
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-md">
                    <div className="text-sm font-medium text-green-800 dark:text-green-300">KM Atual</div>
                    <div className="text-lg font-semibold text-green-900 dark:text-green-200">{trip.currentKm.toLocaleString()} km</div>
                  </div>
                  <div className="p-3 bg-primary/5 rounded-md">
                    <div className="text-sm font-medium text-primary">Percorrido</div>
                    <div className="text-lg font-semibold text-primary">{(trip.currentKm - trip.startKm).toLocaleString()} km</div>
                  </div>
                </>
              )}
            </div>
          )}

          {trip.status === "completed" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md">
                <div className="text-sm font-medium text-blue-800 dark:text-blue-300">Quilômetros percorridos</div>
                <div className="text-lg font-semibold text-blue-900 dark:text-blue-200">{kmTraveled.toLocaleString()} km</div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-md">
                <div className="text-sm font-medium text-green-800 dark:text-green-300 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Duração em horas
                </div>
                <div className="text-lg font-semibold text-green-900 dark:text-green-200">{duration.hours}h</div>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-md">
                <div className="text-sm font-medium text-purple-800 dark:text-purple-300 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Duração em dias
                </div>
                <div className="text-lg font-semibold text-purple-900 dark:text-purple-200">{duration.days}d</div>
              </div>
              {trip.fuelConsumption && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-md">
                  <div className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Consumo Médio</div>
                  <div className="text-lg font-semibold text-emerald-900 dark:text-emerald-200">{trip.fuelConsumption.toFixed(2)} km/L</div>
                </div>
              )}
              {trip.refuelingLiters && (
                <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-md">
                  <div className="text-sm font-medium text-orange-800 dark:text-orange-300 flex items-center gap-1">
                    <Fuel className="h-3 w-3" />
                    Abastecimento Total
                  </div>
                  <div className="text-lg font-semibold text-orange-900 dark:text-orange-200">{trip.refuelingLiters.toFixed(2)} L</div>
                </div>
              )}
              {fuelConsumed > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-md">
                  <div className="text-sm font-medium text-red-800 dark:text-red-300 flex items-center gap-1">
                    <Fuel className="h-3 w-3" />
                    Combustível Consumido
                  </div>
                  <div className="text-lg font-semibold text-red-900 dark:text-red-200">{fuelConsumed.toFixed(2)} L</div>
                </div>
              )}
              {remainingFuel > 0 && (
                <div className="p-3 bg-cyan-50 dark:bg-cyan-950/30 rounded-md">
                  <div className="text-sm font-medium text-cyan-800 dark:text-cyan-300 flex items-center gap-1">
                    <Fuel className="h-3 w-3" />
                    Combustível Restante
                  </div>
                  <div className="text-lg font-semibold text-cyan-900 dark:text-cyan-200">{remainingFuel.toFixed(2)} L</div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progresso da Viagem — apenas em andamento */}
      {trip.status === "in_progress" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Progresso da Viagem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Último registro */}
            {lastEntry && (
              <div className="p-4 bg-muted/50 rounded-lg border border-border/40">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Último Registro Informado</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{lastEntry.city}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Navigation className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{lastEntry.km.toLocaleString()} km</span>
                  </div>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {formatDate(lastEntry.timestamp)} {formatTime(lastEntry.timestamp)}
                  </span>
                </div>
              </div>
            )}

            {/* Histórico de registros */}
            {trip.progressEntries && trip.progressEntries.length > 1 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Histórico de Registros</p>
                <div className="max-h-40 overflow-y-auto space-y-1.5">
                  {[...trip.progressEntries].reverse().map((entry, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-1.5 px-3 rounded bg-muted/30">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span>{entry.city}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="font-medium">{entry.km.toLocaleString()} km</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(entry.timestamp)} {formatTime(entry.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Formulário de novo registro */}
            <div className="p-4 border rounded-lg space-y-4">
              <p className="text-sm font-semibold">Atualizar com Novo Registro</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="progress-km" className="text-xs font-bold text-muted-foreground uppercase">
                    KM Atual
                  </Label>
                  <Input
                    id="progress-km"
                    type="number"
                    value={progressKm}
                    onChange={(e) => setProgressKm(e.target.value)}
                    disabled={isSavingProgress}
                    min={trip.startKm}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="progress-city" className="text-xs font-bold text-muted-foreground uppercase">
                    Cidade Atual
                  </Label>
                  <CityAutocomplete
                    value={progressCity}
                    onChange={setProgressCity}
                    placeholder="Ex: São Paulo"
                  />
                </div>
              </div>
              <Button onClick={handleSaveProgress} disabled={isSavingProgress} className="w-full sm:w-auto">
                {isSavingProgress ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Progresso
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fretes da Viagem — apenas em andamento */}
      {trip.status === "in_progress" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Fretes da Viagem
              </CardTitle>
              {(freightEntries.length > 0 || legacyFreightValue > 0) && (
                <Badge variant="outline" className="font-bold">
                  {freightEntries.length + (legacyFreightValue > 0 ? 1 : 0)}{" "}
                  {freightEntries.length + (legacyFreightValue > 0 ? 1 : 0) === 1 ? "frete" : "fretes"}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(freightEntries.length > 0 || legacyFreightValue > 0) && (
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-500/20 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-widest">
                    Total de Fretes
                  </p>
                  <p className="text-2xl font-black text-green-700 dark:text-green-300 mt-1">
                    {formatCurrency(displayedFreightTotal)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-green-700/70 dark:text-green-300/70 uppercase tracking-widest">
                    Registros
                  </p>
                  <p className="text-2xl font-black text-green-700 dark:text-green-300 mt-1">
                    {freightEntries.length + (legacyFreightValue > 0 ? 1 : 0)}
                  </p>
                </div>
              </div>
            )}

            {/* Frete legado (viagens antigas que tinham um único valor) */}
            {legacyFreightValue > 0 && freightEntries.length === 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/30">
                <div className="flex items-center gap-3 min-w-0">
                  <DollarSign className="h-4 w-4 text-green-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {formatCurrency(legacyFreightValue)}
                      {trip.cargoDescription && (
                        <span className="text-muted-foreground font-normal">
                          {" "}— {trip.cargoDescription}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Frete inicial da viagem
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de fretes cadastrados */}
            {freightEntries.length > 0 && (
              <div className="space-y-2">
                {freightEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/30"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <DollarSign className="h-4 w-4 text-green-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">
                          {formatCurrency(entry.value)}
                          {entry.description && (
                            <span className="text-muted-foreground font-normal">
                              {" "}— {entry.description}
                            </span>
                          )}
                        </p>
                        {(entry.origin || entry.destination) && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" />
                            {entry.origin || "—"}
                            {entry.destination && <> → {entry.destination}</>}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatDate(entry.timestamp)} {formatTime(entry.timestamp)}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeleteFreightId(entry.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-red-500"
                      title="Remover frete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Formulário para adicionar novo frete */}
            <div className="p-4 border rounded-lg space-y-4">
              <p className="text-sm font-semibold">Adicionar Novo Frete</p>
              <div className="space-y-2">
                <Label htmlFor="new-freight-value" className="text-xs font-bold text-muted-foreground uppercase">
                  Valor do Frete *
                </Label>
                <CurrencyInput
                  id="new-freight-value"
                  value={newFreightValue}
                  onChange={setNewFreightValue}
                  placeholder="Ex: 3.500,00"
                  disabled={isSavingFreight}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-freight-origin" className="text-xs font-bold text-muted-foreground uppercase">
                    Origem
                  </Label>
                  <CityAutocomplete
                    value={newFreightOrigin}
                    onChange={setNewFreightOrigin}
                    placeholder="Ex: São Paulo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-freight-destination" className="text-xs font-bold text-muted-foreground uppercase">
                    Destino
                  </Label>
                  <CityAutocomplete
                    value={newFreightDestination}
                    onChange={setNewFreightDestination}
                    placeholder="Ex: Curitiba"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-freight-description" className="text-xs font-bold text-muted-foreground uppercase">
                  Descrição da Carga
                </Label>
                <Input
                  id="new-freight-description"
                  type="text"
                  placeholder="Ex: 20t de soja"
                  value={newFreightDescription}
                  onChange={(e) => setNewFreightDescription(e.target.value)}
                  disabled={isSavingFreight}
                />
              </div>
              <Button
                onClick={handleAddFreight}
                disabled={isSavingFreight || newFreightValue <= 0}
                className="w-full sm:w-auto"
              >
                {isSavingFreight ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Frete
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Despesas da Viagem — apenas em andamento */}
      {trip.status === "in_progress" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                Despesas da Viagem
              </CardTitle>
              <Button
                size="sm"
                onClick={() => setShowExpenseModal(true)}
                className="rounded-xl h-9 px-4 font-bold"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Nova Despesa
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {tripExpenses.length > 0 ? (
              <>
                <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-500/20 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-red-700 dark:text-red-300 uppercase tracking-widest">
                      Total de Despesas
                    </p>
                    <p className="text-2xl font-black text-red-700 dark:text-red-300 mt-1">
                      {formatCurrency(totalExpenses)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-red-700/70 dark:text-red-300/70 uppercase tracking-widest">
                      Registros
                    </p>
                    <p className="text-2xl font-black text-red-700 dark:text-red-300 mt-1">
                      {tripExpenses.length}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {(showAllExpenses ? tripExpenses : tripExpenses.slice(0, 3)).map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
                            {expense.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(expense.date)}
                          </span>
                        </div>
                        <p className="text-sm font-semibold truncate">{expense.description}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-base font-black text-red-600 dark:text-red-400">
                          − {formatCurrency(expense.amount)}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteExpenseId(expense.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-red-500"
                          title="Excluir despesa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {tripExpenses.length > 3 && (
                  <Button
                    variant="ghost"
                    onClick={() => setShowAllExpenses((v) => !v)}
                    className="w-full font-bold text-xs uppercase tracking-widest text-muted-foreground hover:bg-primary hover:text-white focus-visible:bg-primary focus-visible:text-white active:bg-primary active:text-white"
                  >
                    {showAllExpenses ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1.5" />
                        Mostrar Menos
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1.5" />
                        Mostrar Mais ({tripExpenses.length - 3})
                      </>
                    )}
                  </Button>
                )}
              </>
            ) : (
              <div className="text-center py-8 border border-dashed rounded-lg">
                <TrendingDown className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma despesa registrada para esta viagem.
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Clique em &quot;Nova Despesa&quot; para adicionar.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Abastecimentos da Viagem — apenas em andamento */}
      {trip.status === "in_progress" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Fuel className="h-5 w-5 text-blue-500" />
                Abastecimentos da Viagem
              </CardTitle>
              {totalRefueled > 0 && (
                <Badge variant="outline" className="font-bold">
                  Total: {totalRefueled.toFixed(2)} L
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {refuelingEntries.length > 0 && (
              <div className="space-y-2">
                {refuelingEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/30"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Fuel className="h-4 w-4 text-blue-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">
                          {entry.liters.toFixed(2)} L
                          {entry.station && (
                            <span className="text-muted-foreground font-normal">
                              {" "}
                              — {entry.station}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(entry.timestamp)} {formatTime(entry.timestamp)}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeleteRefuelId(entry.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-red-500"
                      title="Remover abastecimento"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 border rounded-lg space-y-4">
              <p className="text-sm font-semibold">Registrar Novo Abastecimento</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="refuel-liters" className="text-xs font-bold text-muted-foreground uppercase">
                    Litros *
                  </Label>
                  <Input
                    id="refuel-liters"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 120"
                    value={refuelLiters}
                    onChange={(e) => setRefuelLiters(e.target.value)}
                    disabled={isSavingRefuel}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refuel-station" className="text-xs font-bold text-muted-foreground uppercase">
                    Posto / Cidade
                  </Label>
                  <Input
                    id="refuel-station"
                    type="text"
                    placeholder="Ex: Posto Shell - Curitiba"
                    value={refuelStation}
                    onChange={(e) => setRefuelStation(e.target.value)}
                    disabled={isSavingRefuel}
                  />
                </div>
              </div>
              <Button onClick={handleAddRefuel} disabled={isSavingRefuel} className="w-full sm:w-auto">
                {isSavingRefuel ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Abastecimento
                  </>
                )}
              </Button>
            </div>

            {totalRefueled > 0 && (
              <p className="text-xs text-muted-foreground">
                Ao finalizar a viagem, o total de{" "}
                <strong>{totalRefueled.toFixed(2)} L</strong> será preenchido automaticamente.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <TripExpenseModal
        trip={trip}
        open={showExpenseModal}
        onOpenChange={setShowExpenseModal}
      />

      {/* Fotos */}
      <TripPhotoGallery tripId={trip.id} photos={trip.photos || []} canEdit={true} />

      {/* Observações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Observações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Escrever observação sobre a viagem..."
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            className="min-h-[100px] resize-none"
            disabled={isSavingObs}
          />
          <Button
            variant="outline"
            onClick={handleSaveObservations}
            disabled={isSavingObs || observations === (trip.observations || "")}
            className="w-full sm:w-auto"
          >
            {isSavingObs ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Observações
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Info adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Informações Adicionais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">ID da Viagem</span>
            <span className="text-sm font-bold">{trip.id.slice(-8)}</span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-muted/30 rounded-md">
            <p className="text-sm text-muted-foreground">
              As despesas registradas aqui são salvas no módulo <strong>Financeiro</strong> e
              vinculadas automaticamente a esta viagem.
            </p>
          </div>
        </CardContent>
      </Card>

      {trip.status === "in_progress" && onComplete && (
        <div className="flex justify-end pt-2">
          <Button
            size="lg"
            onClick={() => onComplete(trip)}
            className="rounded-2xl bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/20 h-12 px-6"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Finalizar Viagem
          </Button>
        </div>
      )}

      <AlertDialog open={!!deleteExpenseId} onOpenChange={(open) => !open && setDeleteExpenseId(null)}>
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black uppercase tracking-tight text-red-600">Tem certeza que deseja excluir esta despesa?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-foreground/80 font-medium space-y-2">
                <p><span className="font-bold text-red-600">Esta ação é permanente e não pode ser desfeita.</span> A despesa será removida e não poderá ser recuperada.</p>
                <p className="text-sm"><strong>O que muda:</strong></p>
                <ul className="text-sm list-disc pl-5 space-y-1">
                  <li>O custo total desta viagem será recalculado.</li>
                  <li>As despesas e o lucro do período no dashboard também serão atualizados.</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteExpense} className="bg-destructive text-destructive-foreground font-black uppercase tracking-widest text-xs h-10 px-6">
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteRefuelId} onOpenChange={(open) => !open && setDeleteRefuelId(null)}>
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black uppercase tracking-tight text-red-600">Tem certeza que deseja excluir este abastecimento?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-foreground/80 font-medium space-y-2">
                <p><span className="font-bold text-red-600">Esta ação é permanente e não pode ser desfeita.</span> O registro do abastecimento será removido e não poderá ser recuperado.</p>
                <p className="text-sm"><strong>O que muda:</strong></p>
                <ul className="text-sm list-disc pl-5 space-y-1">
                  <li>O total de litros abastecidos nesta viagem será reduzido, afetando o cálculo de consumo (km/L).</li>
                  <li>O total de litros já contabilizado no caminhão <strong>não é revertido automaticamente</strong>.</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteRefuel} className="bg-destructive text-destructive-foreground font-black uppercase tracking-widest text-xs h-10 px-6">
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteFreightId} onOpenChange={(open) => !open && setDeleteFreightId(null)}>
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black uppercase tracking-tight text-red-600">Tem certeza que deseja excluir este frete?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-foreground/80 font-medium space-y-2">
                <p><span className="font-bold text-red-600">Esta ação é permanente e não pode ser desfeita.</span> O registro do frete será removido da viagem.</p>
                <p className="text-sm"><strong>O que muda:</strong></p>
                <ul className="text-sm list-disc pl-5 space-y-1">
                  <li>O total de receitas desta viagem será recalculado.</li>
                  <li>O lucro da viagem e o dashboard financeiro serão atualizados.</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteFreight} className="bg-destructive text-destructive-foreground font-black uppercase tracking-widest text-xs h-10 px-6">
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
