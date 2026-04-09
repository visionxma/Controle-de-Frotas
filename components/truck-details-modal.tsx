"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Truck,
  MapPin,
  Calendar,
  Activity,
  Fuel,
  CheckCircle,
  Clock,
  Navigation,
  ArrowLeft,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from "lucide-react"
import type { Truck as TruckType } from "@/hooks/use-trucks"
import type { Trip } from "@/hooks/use-trips"
import { useTrips } from "@/hooks/use-trips"
import { useTransactions } from "@/hooks/use-transactions"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { TripDetails } from "@/components/trip-details"

interface TruckDetailsModalProps {
  truck: TruckType | null
  isOpen: boolean
  onClose: () => void
}

export function TruckDetailsModal({ truck, isOpen, onClose }: TruckDetailsModalProps) {
  const { trips } = useTrips()
  const { transactions } = useTransactions()

  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)

  if (!truck) return null

  // Filter trips for this truck
  const truckTrips = trips.filter(trip => trip.truckId === truck.id)

  // Filter transactions for this truck
  const truckTransactions = transactions.filter(t => t.truckId === truck.id)
  const truckExpenses = truckTransactions.filter(t => t.type === "despesa")
  const truckIncomes = truckTransactions.filter(t => t.type === "receita")

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  
  // Calculate some stats
  const totalKm = truckTrips.reduce((acc, trip) => {
    if (trip.endKm && trip.startKm) {
      return acc + (trip.endKm - trip.startKm)
    }
    return acc
  }, 0)

  const completedTrips = truckTrips.filter(t => t.status === "completed").length
  const inProgressTrips = truckTrips.filter(t => t.status === "in_progress").length

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
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold uppercase leading-none text-foreground tracking-tight">
                {truck.plate}
              </h2>
              <div className="flex items-center gap-3">
                <p className="text-[10px] font-medium text-muted-foreground uppercase opacity-80">
                  {truck.brand} {truck.model}
                </p>
                <div className="w-1 h-1 rounded-full bg-border/40"></div>
                <p className="text-[10px] font-bold text-primary uppercase">
                  Módulo {truck.year}
                </p>
              </div>
            </div>
          </div>

          <Badge className="rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border-primary/20">
            {truck.status === 'active' ? 'Operacional' : truck.status === 'maintenance' ? 'Em Manutenção' : 'Indisponível'}
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
                    <span className="text-[10px] sm:text-xs font-bold uppercase text-muted-foreground tracking-tight">Km Totais</span>
                  </div>
                  <span className="text-2xl font-bold tracking-tighter leading-none">{truck.mileage.toLocaleString('pt-BR')}</span>
                </CardContent>
              </Card>

              <Card className="border-green-500/10 bg-green-500/5 shadow-none group border py-6 px-8 flex items-center">
                <CardContent className="p-0 flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-500 text-white rounded-sm shadow-lg shadow-green-500/10">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold uppercase text-muted-foreground tracking-tight">Viagens</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600 tracking-tighter leading-none">{completedTrips}</span>
                </CardContent>
              </Card>

              <Card className="border-blue-500/10 bg-blue-500/5 shadow-none group border py-6 px-8 flex items-center">
                <CardContent className="p-0 flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500 text-white rounded-sm shadow-lg shadow-blue-500/10">
                      <Fuel className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold uppercase text-muted-foreground tracking-tight">Combustível</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600 tracking-tighter leading-none">{(truck.totalFuelLiters || 0).toLocaleString()}L</span>
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
              </div>

              <Tabs defaultValue="trips" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3 h-11">
                  <TabsTrigger value="trips" className="font-bold uppercase text-[10px] tracking-widest">
                    Viagens ({truckTrips.length})
                  </TabsTrigger>
                  <TabsTrigger value="expenses" className="font-bold uppercase text-[10px] tracking-widest">
                    Despesas ({truckExpenses.length})
                  </TabsTrigger>
                  <TabsTrigger value="incomes" className="font-bold uppercase text-[10px] tracking-widest">
                    Receitas ({truckIncomes.length})
                  </TabsTrigger>
                </TabsList>

                {/* Viagens */}
                <TabsContent value="trips" className="mt-6">
                  {truckTrips.length === 0 ? (
                    <div className="text-center py-20 bg-muted/5 rounded-[2.5rem] border-2 border-dashed border-border/20">
                      <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Nenhuma viagem registrada</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                      {truckTrips.map((trip) => (
                    <Card 
                      key={trip.id} 
                      className="border-border/40 hover:border-primary/20 transition-all overflow-hidden bg-white shadow-sm dark:bg-black/40 group flex cursor-pointer"
                      onClick={() => setSelectedTrip(trip)}
                    >
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
                            <div className="text-right">
                               <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block">Condutor</span>
                               <span className="text-[10px] font-bold text-foreground/80">{trip.driverName}</span>
                            </div>
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
                                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block">Data</span>
                                <span className="text-xs font-bold text-foreground/80">{formatDate(trip.startDate)}</span>
                              </div>
                              <div className="text-right space-y-0.5">
                                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block">Trajeto</span>
                                <span className="text-xs font-black text-primary">
                                  {trip.endKm ? `${(trip.endKm - trip.startKm).toLocaleString()} km` : "---"}
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
                </TabsContent>

                {/* Despesas */}
                <TabsContent value="expenses" className="mt-6">
                  {truckExpenses.length === 0 ? (
                    <div className="text-center py-20 bg-muted/5 rounded-[2.5rem] border-2 border-dashed border-border/20">
                      <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Nenhuma despesa registrada</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                      {truckExpenses.map((tx) => (
                        <Card
                          key={tx.id}
                          className="border-border/40 hover:border-red-500/30 transition-all overflow-hidden bg-white shadow-sm dark:bg-black/40 flex"
                        >
                          <div className="w-1 flex-shrink-0 bg-red-500" />
                          <CardContent className="py-4 px-5 w-full">
                            <div className="flex flex-col h-full gap-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <TrendingDown className="h-4 w-4 text-red-500" />
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                                    Despesa
                                  </span>
                                </div>
                                <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-widest border-border/40">
                                  {tx.category}
                                </Badge>
                              </div>

                              <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Descrição</span>
                                <span className="text-base font-black uppercase tracking-tighter leading-tight line-clamp-2">{tx.description}</span>
                              </div>

                              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/10">
                                <div className="space-y-0.5">
                                  <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block">Data</span>
                                  <span className="text-xs font-bold text-foreground/80">{formatDate(tx.date)}</span>
                                </div>
                                <div className="text-right space-y-0.5">
                                  <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block">Valor</span>
                                  <span className="text-xs font-black text-red-500">- {formatCurrency(tx.amount)}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Receitas */}
                <TabsContent value="incomes" className="mt-6">
                  {truckIncomes.length === 0 ? (
                    <div className="text-center py-20 bg-muted/5 rounded-[2.5rem] border-2 border-dashed border-border/20">
                      <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Nenhuma receita registrada</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                      {truckIncomes.map((tx) => (
                        <Card
                          key={tx.id}
                          className="border-border/40 hover:border-green-500/30 transition-all overflow-hidden bg-white shadow-sm dark:bg-black/40 flex"
                        >
                          <div className="w-1 flex-shrink-0 bg-green-500" />
                          <CardContent className="py-4 px-5 w-full">
                            <div className="flex flex-col h-full gap-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4 text-green-500" />
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                                    Receita
                                  </span>
                                </div>
                                <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-widest border-border/40">
                                  {tx.category}
                                </Badge>
                              </div>

                              <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Descrição</span>
                                <span className="text-base font-black uppercase tracking-tighter leading-tight line-clamp-2">{tx.description}</span>
                              </div>

                              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/10">
                                <div className="space-y-0.5">
                                  <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block">Data</span>
                                  <span className="text-xs font-bold text-foreground/80">{formatDate(tx.date)}</span>
                                </div>
                                <div className="text-right space-y-0.5">
                                  <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block">Valor</span>
                                  <span className="text-xs font-black text-green-600">+ {formatCurrency(tx.amount)}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <div className="pb-10"></div>
          </div>
        </div>
      </DialogContent>

      {/* Nested Trip Details Dialog */}
      <Dialog open={!!selectedTrip} onOpenChange={() => setSelectedTrip(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background rounded-sm border-none shadow-2xl">
          <div className="p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
              <h2 className="text-xl font-black uppercase tracking-tight">Detalhes da Operação</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedTrip(null)} className="font-bold text-xs uppercase underline decoration-primary decoration-2 underline-offset-2">Fechar</Button>
            </div>
            {selectedTrip && <TripDetails trip={selectedTrip} />}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
