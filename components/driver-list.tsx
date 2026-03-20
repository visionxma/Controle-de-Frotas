"use client"

import { useState, useMemo } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Phone, Mail } from "lucide-react"
import type { Driver } from "@/hooks/use-drivers"
import { PermissionGate } from "@/components/permission-gate"
import { DriverDetailsModal } from "./driver-details-modal"
import { RegisteredBy } from "./registered-by"
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/constants"
import { useTrips } from "@/hooks/use-trips"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Navigation } from "lucide-react"
import { isPast } from "date-fns"
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

interface DriverListProps {
  drivers: Driver[]
  onEdit: (driver: Driver) => void
  onDelete: (id: string) => void
  isLoading?: boolean
}

export function DriverList({ drivers, onEdit, onDelete, isLoading }: DriverListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const driverIdParam = searchParams.get("driverId")

  const [deleteId, setDeleteId] = useState<string | null>(null)

  const selectedDriver = useMemo(() => {
    if (!driverIdParam || !drivers) return null
    return drivers.find(d => d.id === driverIdParam) || null
  }, [driverIdParam, drivers])

  const handleOpenDetails = (driver: Driver) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("driverId", driver.id)
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleCloseDetails = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("driverId")
    router.push(`${pathname}?${params.toString()}`)
  }
  const { trips } = useTrips()

  const handleDelete = () => {
    if (deleteId) {
      onDelete(deleteId)
      setDeleteId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const isCNHExpired = (expiryDate: string) => {
    return isPast(new Date(expiryDate))
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Carregando motoristas...</p>
      </div>
    )
  }

  if (drivers.length === 0) {
    return (
      <Card className="rounded-[2.5rem] border-dashed border-2 border-border/40 bg-muted/5">
        <CardContent className="text-center py-12">
          <div className="h-12 w-12 text-muted-foreground mx-auto mb-4"></div>
          <h3 className="text-lg font-bold uppercase mb-2">Nenhum motorista cadastrado</h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">Adicione seu primeiro motorista para começar a gerenciar sua equipe.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="responsive-grid gap-4">
        {drivers.map((driver) => (
          <Card 
            key={driver.id} 
            className="rounded-3xl border-border/40 shadow-sm hover:shadow-md transition-all overflow-hidden bg-card/50 backdrop-blur-sm cursor-pointer hover:border-primary/30"
            onClick={() => handleOpenDetails(driver)}
          >
            <CardHeader className="pb-3 px-6 pt-6">
              <div className="flex items-start justify-between">
                <CardTitle className="text-xl font-bold tracking-tight uppercase leading-tight">{driver.name}</CardTitle>
                <div className="flex flex-col gap-2 items-end">
                  <Badge variant={STATUS_COLORS[driver.status]} className="rounded-full px-3 font-bold uppercase text-[10px]">
                    {STATUS_LABELS[driver.status]}
                  </Badge>
                  {(() => {
                    const activeTrip = trips.find(t => t.driverId === driver.id && t.status === "in_progress")
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
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Caminhão</span>
                                        <span className="font-semibold">{activeTrip.truckPlate}</span>
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
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block text-nowrap">CPF</span>
                    <span className="font-semibold">{driver.cpf}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block text-nowrap">CNH ({driver.cnhCategory})</span>
                    <span className="font-semibold">{driver.cnh}</span>
                  </div>
                </div>
                
                <div className={`flex justify-between items-center p-3 rounded-2xl ${isCNHExpired(driver.cnhExpiry) ? "bg-red-50 text-red-700" : "bg-primary/5"}`}>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Vencimento CNH</span>
                    <span className="font-bold">{formatDate(driver.cnhExpiry)}</span>
                  </div>
                  {isCNHExpired(driver.cnhExpiry) && (
                    <Badge variant="destructive" className="animate-pulse rounded-full text-[9px] uppercase font-black">Vencida</Badge>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    <Phone className="h-4 w-4" />
                    <span className="font-medium">{driver.phone}</span>
                  </div>
                  {driver.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="text-xs font-medium truncate">{driver.email}</span>
                    </div>
                  )}
                </div>
              </div> {/* Closes space-y-3 div */}

              <div className="mt-6 pt-4 border-t border-border/10 space-y-4">
                <div className="flex items-center justify-end gap-2">
                  <PermissionGate permission="canUpdate">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(driver)
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
                        setDeleteId(driver.id)
                      }}
                      className="rounded-2xl text-muted-foreground hover:text-red-500 hover:bg-red-50 font-bold h-9"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </PermissionGate>
                </div>

                <div className="flex justify-start pt-2 opacity-60">
                  <RegisteredBy userName={driver.createdBy} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DriverDetailsModal 
        driver={selectedDriver}
        isOpen={!!selectedDriver}
        onClose={handleCloseDetails}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black uppercase tracking-tight text-red-600">Confirmar exclusão de motorista</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/80 font-medium">
              Ao excluir este motorista, todos os registros históricos de viagens e documentos associados a ele serão perdidos. <span className="font-bold text-red-600">Esta ação é irreversível e os dados não poderão ser recuperados.</span>
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

