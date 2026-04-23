"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { MapPin, Truck, User, Trash2, CheckCircle, DollarSign, Weight, Fuel, FileText } from "lucide-react"
import { RegisteredBy } from "./registered-by"
import type { Trip } from "@/hooks/use-trips"

interface TripListProps {
  trips: Trip[]
  onComplete: (trip: Trip) => void
  onDelete: (id: string) => void
  onViewDetails?: (trip: Trip) => void
  onGenerateReport?: (trip: Trip) => void
  isLoading: boolean
}

export function TripList({ trips, onComplete, onDelete, onViewDetails, onGenerateReport, isLoading }: TripListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId)
      setDeleteId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (trips.length === 0) {
    return (
      <Card className="rounded-[2.5rem] border-dashed border-2 border-border/40 bg-muted/5">
        <CardContent className="p-12 sm:p-20 text-center space-y-4">
          <div className="bg-muted/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-2">
            <MapPin className="h-10 w-10 text-muted-foreground/40" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold tracking-tight uppercase">Nenhuma viagem encontrada</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto font-medium">
              Sua frota ainda não registrou nenhuma atividade. Comece adicionando uma nova viagem.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatDateTime = (date: string, time: string) => {
    return new Date(`${date}T${time}`).toLocaleString("pt-BR")
  }

  const getStatusBadge = (status: Trip["status"]) => {
    switch (status) {
      case "in_progress":
        return <Badge variant="secondary" className="rounded-sm px-2 py-[2px] font-black uppercase text-[9px] bg-amber-500/10 text-amber-600 border-none shadow-none tracking-wider">Em Andamento</Badge>
      case "completed":
        return <Badge variant="default" className="rounded-sm px-2 py-[2px] font-black uppercase text-[9px] bg-green-500/10 text-green-600 border-none shadow-none tracking-wider">Finalizada</Badge>
      default:
        return <Badge variant="outline" className="rounded-full px-3 py-1 font-bold uppercase text-[10px]">{status}</Badge>
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {trips.map((trip) => (
        <Card key={trip.id} className="rounded-3xl border-border/40 shadow-sm hover:shadow-md transition-all overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardContent className="px-6 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {getStatusBadge(trip.status)}
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest leading-none mb-1">Início da Viagem</span>
                  <span className="text-xs font-bold text-foreground leading-none">{formatDateTime(trip.startDate, trip.startTime)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onViewDetails && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewDetails(trip)}
                    className="h-9 px-4 rounded-2xl border-border/40 font-bold text-xs hover:bg-primary/5 hover:text-primary transition-all"
                  >
                    Detalhes
                  </Button>
                )}
                {trip.status === "completed" && onGenerateReport && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onGenerateReport(trip)}
                    className="h-9 px-4 rounded-2xl border-border/40 font-bold text-xs hover:bg-green-500/5 hover:text-green-600 hover:border-green-500/30 transition-all"
                  >
                    <FileText className="h-4 w-4 mr-1.5" />
                    PDF
                  </Button>
                )}
                {trip.status === "in_progress" && (
                  <Button 
                    size="sm" 
                    onClick={() => onComplete(trip)} 
                    className="h-9 px-4 rounded-2xl bg-primary hover:bg-primary/90 font-bold text-xs shadow-md shadow-primary/20"
                  >
                    <CheckCircle className="h-4 w-4 mr-1.5" />
                    Finalizar
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleteId(trip.id)}
                  className="h-9 w-9 rounded-2xl p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center gap-3 bg-muted/20 p-3 rounded-2xl">
                <Truck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider leading-none mb-1">Caminhão</p>
                  <p className="text-sm font-bold leading-none">{trip.truckPlate}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-muted/20 p-3 rounded-2xl">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider leading-none mb-1">Motorista</p>
                  <p className="text-sm font-bold leading-none">{trip.driverName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-muted/20 p-3 rounded-2xl">
                <MapPin className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider leading-none mb-1">Origem</p>
                  <p className="text-sm font-bold leading-none truncate max-w-[150px]">{trip.startLocation}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-primary/5 p-3 rounded-2xl border border-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider leading-none mb-1">Destino</p>
                  <p className="text-sm font-bold leading-none truncate max-w-[150px]">{trip.endLocation || "A definir"}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-border/10">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">KM Inicial</span>
                <p className="text-sm font-bold">{trip.startKm.toLocaleString()} KM</p>
              </div>
              {trip.endKm && (
                <>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">KM Final</span>
                    <p className="text-sm font-bold">{trip.endKm.toLocaleString()} KM</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">KM Rodados</span>
                    <p className="text-sm font-black text-primary">{(trip.endKm - trip.startKm).toLocaleString()} KM</p>
                  </div>
                </>
              )}
              {trip.endDate && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Finalizada em</span>
                  <p className="text-xs font-bold">{formatDateTime(trip.endDate, trip.endTime || "00:00")}</p>
                </div>
              )}
              <div className="flex items-center justify-start">
                <RegisteredBy userName={trip.createdBy} className="opacity-80" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black uppercase tracking-tight text-red-600">Tem certeza que deseja excluir esta viagem?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-foreground/80 font-medium space-y-2">
                <p><span className="font-bold text-red-600">Esta ação é permanente e não pode ser desfeita.</span> A viagem e tudo o que está vinculado a ela serão apagados em cascata.</p>
                <p className="text-sm"><strong>O que será apagado:</strong></p>
                <ul className="text-sm list-disc pl-5 space-y-1">
                  <li>Todos os <strong>fretes, abastecimentos e fotos</strong> registrados nesta viagem.</li>
                  <li>Todas as <strong>despesas e receitas</strong> vinculadas à viagem — elas deixam de aparecer no Financeiro e os totais do Dashboard (receita, despesa, lucro) são recalculados imediatamente.</li>
                  <li>As fotos hospedadas no servidor também são removidas.</li>
                </ul>
                <p className="text-sm"><strong>O que NÃO muda:</strong></p>
                <ul className="text-sm list-disc pl-5 space-y-1">
                  <li>O odômetro e o total de litros já contabilizados no caminhão <strong>não são revertidos</strong> — representam leituras físicas e continuam como estão.</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground font-black uppercase tracking-widest text-xs h-10 px-6">
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
