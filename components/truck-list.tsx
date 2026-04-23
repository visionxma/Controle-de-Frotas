"use client"

import { useState, useMemo } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2 } from "lucide-react"
import type { Truck } from "@/hooks/use-trucks"
import { PermissionGate } from "@/components/permission-gate"
import { TruckDetailsModal } from "./truck-details-modal"
import { RegisteredBy } from "./registered-by"
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/constants"
import { useTrips } from "@/hooks/use-trips"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Navigation } from "lucide-react"
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

interface TruckListProps {
  trucks: Truck[]
  onEdit: (truck: Truck) => void
  onDelete: (id: string) => void
  isLoading?: boolean
}

export function TruckList({ trucks, onEdit, onDelete, isLoading }: TruckListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const truckIdParam = searchParams.get("truckId")

  const [deleteId, setDeleteId] = useState<string | null>(null)

  const selectedTruck = useMemo(() => {
    if (!truckIdParam || !trucks) return null
    return trucks.find(t => t.id === truckIdParam) || null
  }, [truckIdParam, trucks])

  const handleOpenDetails = (truck: Truck) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("truckId", truck.id)
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleCloseDetails = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("truckId")
    router.push(`${pathname}?${params.toString()}`)
  }
  const { trips } = useTrips()

  const handleDelete = () => {
    if (deleteId) {
      onDelete(deleteId)
      setDeleteId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Carregando caminhões...</p>
      </div>
    )
  }

  if (trucks.length === 0) {
    return (
      <Card className="rounded-[2.5rem] border-dashed border-2 border-border/40 bg-muted/5">
        <CardContent className="text-center py-12">
          <div className="h-12 w-12 text-muted-foreground mx-auto mb-4"></div>
          <h3 className="text-lg font-bold uppercase mb-2">Nenhum caminhão cadastrado</h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">Adicione seu primeiro caminhão para começar a gerenciar sua frota.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="responsive-grid gap-4">
        {trucks.map((truck) => (
          <Card 
            key={truck.id} 
            className="rounded-3xl border-border/40 shadow-sm hover:shadow-md transition-all overflow-hidden bg-card/50 backdrop-blur-sm cursor-pointer hover:border-primary/30"
            onClick={() => handleOpenDetails(truck)}
          >
            <CardHeader className="pb-3 px-6 pt-6">
              <div className="flex items-start justify-between">
                <CardTitle className="text-xl font-bold tracking-tight uppercase">{truck.plate}</CardTitle>
                <div className="flex flex-col gap-2 items-end">
                  <Badge variant={STATUS_COLORS[truck.status]} className="rounded-full px-3 font-bold uppercase text-[10px]">
                    {STATUS_LABELS[truck.status]}
                  </Badge>
                  {(() => {
                    const activeTrip = trips.find(t => t.truckId === truck.id && t.status === "in_progress")
                    if (activeTrip) {
                      return (
                        <HoverCard>
                          <HoverCardTrigger>
                            <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 shadow-none border-none rounded-sm px-2 py-[2px] font-black uppercase text-[9px] tracking-wider cursor-help">
                              Em Rota
                            </Badge>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80 p-4 border-amber-500/20 bg-background/95 backdrop-blur-md shadow-xl rounded-xl z-50 pointer-events-auto cursor-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="space-y-3">
                              <h4 className="text-xs font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">
                                <Navigation className="h-4 w-4" />
                                Detalhes da Rota
                              </h4>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div className="space-y-1">
                                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Motorista</span>
                                      <span className="font-semibold">{activeTrip.driverName}</span>
                                  </div>
                                  <div className="space-y-1">
                                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Origem</span>
                                      <span className="font-semibold line-clamp-1">{activeTrip.startLocation}</span>
                                  </div>
                                  <div className="space-y-1 col-span-2">
                                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Início</span>
                                      <span className="font-semibold">{new Date(`${activeTrip.startDate}T${activeTrip.startTime}`).toLocaleString("pt-BR")}</span>
                                  </div>
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      )
                    }
                    return (
                      <Badge variant="outline" className="border-border/40 text-muted-foreground shadow-none rounded-sm px-2 py-[2px] font-black uppercase text-[9px] tracking-wider">
                        Na Garagem
                      </Badge>
                    )
                  })()}
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2 pb-3 border-b border-border/10">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Marca</span>
                    <span className="font-semibold">{truck.brand}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Modelo</span>
                    <span className="font-semibold">{truck.model}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center bg-primary/5 p-3 rounded-2xl">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Quilometragem</span>
                    <span className="font-bold text-primary">{truck.mileage.toLocaleString("pt-BR")} KM</span>
                  </div>
                  {truck.year && (
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Ano</span>
                      <span className="font-semibold">{truck.year}</span>
                    </div>
                  )}
                </div>
              </div> {/* Closing the space-y-3 div here */}

              <div className="mt-6 pt-4 border-t border-border/10 space-y-4">
                <div className="flex items-center justify-end gap-2">
                  <PermissionGate permission="canUpdate">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(truck)
                      }} 
                      className="flex-1 sm:flex-none px-6 rounded-2xl border-border/40 font-bold hover:bg-primary/5 hover:text-primary h-9"
                    >
                      Editar
                    </Button>
                  </PermissionGate>
                  <PermissionGate permission="canDelete">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteId(truck.id)
                      }}
                      className="rounded-2xl text-muted-foreground hover:text-red-500 hover:bg-red-50 font-bold h-9"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </PermissionGate>
                </div>

                <div className="flex justify-start pt-2 opacity-60">
                  <RegisteredBy userName={truck.createdBy} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <TruckDetailsModal 
        truck={selectedTruck} 
        isOpen={!!selectedTruck} 
        onClose={handleCloseDetails} 
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black uppercase tracking-tight text-red-600">Tem certeza que deseja excluir este caminhão?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-foreground/80 font-medium space-y-2">
                <p><span className="font-bold text-red-600">Esta ação é permanente e não pode ser desfeita.</span> Os dados do caminhão serão removidos e não poderão ser recuperados.</p>
                <p className="text-sm"><strong>O que muda:</strong></p>
                <ul className="text-sm list-disc pl-5 space-y-1">
                  <li>A contagem de caminhões no dashboard e no seu plano será reduzida.</li>
                  <li>Viagens, abastecimentos, despesas fixas e transações já registradas com este caminhão <strong>não serão apagadas</strong>, mas perderão o vínculo — não aparecerão mais ao filtrar por caminhão e podem ficar sem identificação.</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground font-black uppercase tracking-widest text-xs h-10 px-6">
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

