"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  User, 
  MapPin, 
  Calendar, 
  Activity, 
  Truck, 
  CheckCircle,
  Clock,
  Navigation,
  ArrowLeft,
  Briefcase,
  Flag
} from "lucide-react"
import type { Driver as DriverType } from "@/hooks/use-drivers"
import { useTrips } from "@/hooks/use-trips"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface DriverDetailsModalProps {
  driver: DriverType | null
  isOpen: boolean
  onClose: () => void
}

export function DriverDetailsModal({ driver, isOpen, onClose }: DriverDetailsModalProps) {
  const { trips } = useTrips()
  
  if (!driver) return null

  // Filter trips for this driver
  const driverTrips = trips.filter(trip => trip.driverId === driver.id)
  
  // Calculate some stats
  const totalKm = driverTrips.reduce((acc, trip) => {
    if (trip.endKm && trip.startKm) {
      return acc + (trip.endKm - trip.startKm)
    }
    return acc
  }, 0)

  const completedTrips = driverTrips.filter(t => t.status === "completed").length
  const uniqueTrucks = new Set(driverTrips.map(t => t.truckPlate)).size

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        showCloseButton={false} 
        className="fixed inset-0 !z-[100] flex flex-col !w-screen !h-screen !max-w-none sm:!max-w-none m-0 p-0 border-none bg-background animate-in slide-in-from-bottom duration-500 rounded-none shadow-none !transform-none !top-0 !left-0 !translate-x-0 !translate-y-0"
      >
        {/* Fixed Header */}
        <div className="sticky top-0 z-[110] w-full bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-border/40 p-5 px-6 md:px-10 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button 
                variant="ghost" 
                onClick={onClose} 
                className="group flex items-center gap-2 rounded-2xl hover:bg-primary/5 transition-all px-4 h-12"
              >
                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                <span className="font-bold uppercase tracking-widest text-xs">Voltar</span>
              </Button>
              
              <div className="h-10 w-[1px] bg-border/40 hidden sm:block"></div>

            <div className="flex flex-col gap-1">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold uppercase leading-none text-foreground truncate max-w-[500px] tracking-tight">
                {driver.name}
              </h2>
              <div className="flex items-center gap-3">
                <p className="text-[10px] font-medium text-muted-foreground uppercase opacity-80">
                  CPF: {driver.cpf}
                </p>
                <div className="w-1 h-1 rounded-full bg-border/40"></div>
                <p className="text-[10px] font-bold text-primary uppercase">
                  CNH {driver.cnhCategory}: {driver.cnh}
                </p>
              </div>
            </div>
          </div>
          <Badge className="rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border-primary/20">
             {driver.status === 'active' ? 'Ativo' : driver.status === 'inactive' ? 'Inativo' : 'Suspenso'}
          </Badge>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 md:p-8 lg:p-10 scroll-smooth">
          <div className="w-full space-y-8">
            
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-7xl">
              <Card className="border-primary/10 bg-primary/5 shadow-none group border py-6 px-8 flex items-center">
                <CardContent className="p-0 flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary text-primary-foreground rounded-sm shadow-lg shadow-primary/10">
                      <Navigation className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold uppercase text-muted-foreground tracking-tight">Km Rodados</span>
                  </div>
                  <span className="text-2xl font-bold tracking-tighter leading-none">{totalKm.toLocaleString('pt-BR')}</span>
                </CardContent>
              </Card>

              <Card className="border-green-500/10 bg-green-500/5 shadow-none group border py-6 px-8 flex items-center">
                <CardContent className="p-0 flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-500 text-white rounded-sm shadow-lg shadow-green-500/10">
                      <Flag className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold uppercase text-muted-foreground tracking-tight">Missões</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600 tracking-tighter leading-none">{completedTrips}</span>
                </CardContent>
              </Card>

              <Card className="border-blue-500/10 bg-blue-500/5 shadow-none group border py-6 px-8 flex items-center">
                <CardContent className="p-0 flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500 text-white rounded-sm shadow-lg shadow-blue-500/10">
                      <Truck className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold uppercase text-muted-foreground tracking-tight">Máquinas</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600 tracking-tighter leading-none">{uniqueTrucks}</span>
                </CardContent>
              </Card>
            </div>

            {/* History Section */}
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-6 border-b-2 border-primary/10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary text-primary-foreground rounded-sm shadow-lg shadow-primary/20">
                    <Activity className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold uppercase text-foreground tracking-tight">
                    Diário de Operações
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="rounded-full font-bold uppercase px-5 py-1.5 bg-muted/20 text-[10px] border-border/40">
                    {driverTrips.length} registros ativos
                  </Badge>
                </div>
              </div>

              {driverTrips.length === 0 ? (
                <div className="text-center py-20 bg-muted/5 rounded-[2.5rem] border-2 border-dashed border-border/20">
                  <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Nenhuma operação registrada</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {driverTrips.map((trip) => (
                    <Card key={trip.id} className="border-border/40 hover:border-primary/20 transition-all overflow-hidden bg-white shadow-sm dark:bg-black/40 group flex">
                      <div className={`w-1 flex-shrink-0 ${trip.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'}`} />
                      <CardContent className="py-4 px-5 w-full">
                         <div className="flex flex-col h-full gap-5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {trip.status === 'completed' ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <Clock className="h-4 w-4 text-amber-500" />
                              )}
                              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                                {trip.status === 'completed' ? 'Finalizada' : 'Em Curso'}
                              </span>
                            </div>
                            <Badge variant="outline" className="font-bold text-[10px] uppercase tracking-tighter bg-muted/10 border-border/10 px-2 h-6">
                              {trip.truckPlate}
                            </Badge>
                          </div>

                          <div className="space-y-4">
                            <div className="flex flex-col gap-4">
                              <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                  <div className="h-1 w-1 rounded-full bg-primary" /> Origem
                                </span>
                                <span className="text-xl font-black uppercase tracking-tighter truncate leading-tight">{trip.startLocation}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                  <div className="h-1 w-1 rounded-full bg-border" /> Destino
                                </span>
                                <span className="text-xl font-black uppercase tracking-tighter truncate leading-tight opacity-80">{trip.endLocation || "A definir"}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/10">
                              <div className="space-y-0.5">
                                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block">Data de Início</span>
                                <span className="text-xs font-bold text-foreground/80">{formatDate(trip.startDate)}</span>
                              </div>
                              <div className="text-right space-y-0.5">
                                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block">Trajeto Percorrido</span>
                                <span className="text-xs font-black text-primary">
                                  {trip.endKm ? `${(trip.endKm - trip.startKm).toLocaleString()} km` : "Em trânsito"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            
            <div className="pb-10"></div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
