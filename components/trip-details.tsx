"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
} from "lucide-react"
import type { Trip, TripProgressEntry } from "@/hooks/use-trips"
import { useTrips } from "@/hooks/use-trips"
import { useTransactions } from "@/hooks/use-transactions"
import { TripPhotoGallery } from "@/components/trip-photo-gallery"
import { TripExpenseModal } from "@/components/trip-expense-modal"
import { usePdfReports } from "@/hooks/use-pdf-reports"
import { toast } from "sonner"

interface TripDetailsProps {
  trip: Trip
}

export function TripDetails({ trip }: TripDetailsProps) {
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

  const tripExpenses = transactions.filter(
    (t) => t.tripId === trip.id && t.type === "despesa",
  )
  const totalExpenses = tripExpenses.reduce((sum, t) => sum + t.amount, 0)

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta despesa?")) return
    const success = await deleteTransaction(id)
    if (success) {
      toast.success("Despesa removida")
    } else {
      toast.error("Erro ao remover despesa")
    }
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
                  onClick={() => generateSingleTripReport(trip)}
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
                  <Input
                    id="progress-city"
                    type="text"
                    placeholder="Ex: São Paulo"
                    value={progressCity}
                    onChange={(e) => setProgressCity(e.target.value)}
                    disabled={isSavingProgress}
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
                          onClick={() => handleDeleteExpense(expense.id)}
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
    </div>
  )
}
