"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Truck, User, Trash2, CheckCircle, DollarSign, Weight, Fuel } from "lucide-react"
import type { Trip } from "@/hooks/use-trips"

interface TripListProps {
  trips: Trip[]
  onComplete: (trip: Trip) => void
  onDelete: (id: string) => void
  onViewDetails?: (trip: Trip) => void
  isLoading: boolean
}

export function TripList({ trips, onComplete, onDelete, onViewDetails, isLoading }: TripListProps) {
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
      <Card>
        <CardContent className="p-8 sm:p-12 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-semibold mb-2">Nenhuma viagem encontrada</h3>
          <p className="text-muted-foreground text-sm">Comece adicionando uma nova viagem à sua frota.</p>
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
        return <Badge variant="secondary">Em Andamento</Badge>
      case "completed":
        return <Badge variant="default">Finalizada</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {trips.map((trip) => (
        <Card key={trip.id}>
          <CardContent className="responsive-card-padding">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-3 sm:gap-0">
              <div className="flex items-center gap-2">
                {getStatusBadge(trip.status)}
                <span className="text-xs sm:text-sm text-muted-foreground">{formatDateTime(trip.startDate, trip.startTime)}</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                {onViewDetails && (
                  <Button size="sm" variant="outline" onClick={() => onViewDetails(trip)} className="h-8 text-xs">
                    Ver Detalhes
                  </Button>
                )}
                {trip.status === "in_progress" && (
                  <Button size="sm" onClick={() => onComplete(trip)} className="h-8 text-xs">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Finalizar
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(trip.id)}
                  className="h-8 text-xs text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium leading-tight">{trip.truckPlate}</p>
                  <p className="text-xs text-muted-foreground leading-tight">Caminhão</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium leading-tight">{trip.driverName}</p>
                  <p className="text-xs text-muted-foreground leading-tight">Motorista</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium leading-tight">{trip.startLocation}</p>
                  <p className="text-xs text-muted-foreground leading-tight">Origem</p>
                </div>
              </div>

              {trip.endLocation && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium leading-tight">{trip.endLocation}</p>
                    <p className="text-xs text-muted-foreground leading-tight">Destino</p>
                  </div>
                </div>
              )}
            </div>

            {(trip.weightTons || trip.freightValue || trip.netProfit !== undefined || trip.fuelLiters || trip.fuelConsumption) && (
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {trip.weightTons && (
                    <div className="flex items-center gap-2">
                      <Weight className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium leading-tight">{trip.weightTons} t</p>
                        <p className="text-xs text-muted-foreground leading-tight">Peso</p>
                      </div>
                    </div>
                  )}

                  {trip.freightValue && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-sm font-medium leading-tight">R$ {trip.freightValue.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground leading-tight">Valor do Frete</p>
                      </div>
                    </div>
                  )}

                  {trip.totalExpenses !== undefined && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="text-sm font-medium leading-tight">R$ {trip.totalExpenses.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground leading-tight">Despesas</p>
                      </div>
                    </div>
                  )}

                  {trip.netProfit !== undefined && (
                    <div className="flex items-center gap-2">
                      <DollarSign className={`h-4 w-4 ${trip.netProfit >= 0 ? "text-green-600" : "text-red-600"}`} />
                      <div>
                        <p className={`text-sm font-medium leading-tight ${trip.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                          R$ {trip.netProfit.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground leading-tight">Lucro Líquido</p>
                      </div>
                    </div>
                  )}

                  {trip.fuelLiters && (
                    <div className="flex items-center gap-2">
                      <Fuel className="h-4 w-4 text-orange-500" />
                      <div>
                        <p className="text-sm font-medium leading-tight">{trip.fuelLiters.toLocaleString()} L</p>
                        <p className="text-xs text-muted-foreground leading-tight">Combustível</p>
                      </div>
                    </div>
                  )}

                  {trip.fuelConsumption && (
                    <div className="flex items-center gap-2">
                      <Fuel className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="text-sm font-medium leading-tight">{trip.fuelConsumption.toFixed(3)} L/km</p>
                        <p className="text-xs text-muted-foreground leading-tight">Consumo Médio</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">KM Inicial:</span>
                  <p className="font-medium leading-tight">{trip.startKm.toLocaleString()}</p>
                </div>
                {trip.endKm && (
                  <>
                    <div>
                      <span className="text-muted-foreground">KM Final:</span>
                      <p className="font-medium leading-tight">{trip.endKm.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">KM Percorridos:</span>
                      <p className="font-medium text-primary leading-tight">{(trip.endKm - trip.startKm).toLocaleString()}</p>
                    </div>
                  </>
                )}
                {trip.endDate && trip.endTime && (
                  <div>
                    <span className="text-muted-foreground">Finalizada em:</span>
                    <p className="font-medium leading-tight">{formatDateTime(trip.endDate, trip.endTime)}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
