"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Truck, User, MapPin, Calendar, Clock, Package, Fuel } from "lucide-react"
import type { Trip } from "@/hooks/use-trips"
import { useTrips } from "@/hooks/use-trips"
import { TripPhotoGallery } from "@/components/trip-photo-gallery"

interface TripDetailsProps {
  trip: Trip
}

export function TripDetails({ trip }: TripDetailsProps) {
  const { calculateTripDuration } = useTrips()
  const kmTraveled = trip.endKm ? trip.endKm - trip.startKm : 0
  const duration = calculateTripDuration(trip.startDate, trip.startTime, trip.endDate, trip.endTime)

  const fuelConsumed = trip.fuelConsumption && kmTraveled > 0 ? kmTraveled / trip.fuelConsumption : 0

  const remainingFuel = trip.refuelingLiters && fuelConsumed > 0 ? Math.max(0, trip.refuelingLiters - fuelConsumed) : 0

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
            <Badge variant={trip.status === "completed" ? "default" : "secondary"}>
              {trip.status === "completed" ? "Finalizada" : "Em Andamento"}
            </Badge>
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

          {trip.status === "completed" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-blue-50 rounded-md">
                <div className="text-sm font-medium text-blue-800">Quilômetros percorridos</div>
                <div className="text-lg font-semibold text-blue-900">{kmTraveled.toLocaleString()} km</div>
              </div>
              <div className="p-3 bg-green-50 rounded-md">
                <div className="text-sm font-medium text-green-800 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Duração em horas
                </div>
                <div className="text-lg font-semibold text-green-900">{duration.hours}h</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-md">
                <div className="text-sm font-medium text-purple-800 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Duração em dias
                </div>
                <div className="text-lg font-semibold text-purple-900">{duration.days}d</div>
              </div>
              {trip.fuelConsumption && (
                <div className="p-3 bg-emerald-50 rounded-md">
                  <div className="text-sm font-medium text-emerald-800">Consumo Médio</div>
                  <div className="text-lg font-semibold text-emerald-900">{trip.fuelConsumption.toFixed(2)} km/L</div>
                </div>
              )}
              {trip.refuelingLiters && (
                <div className="p-3 bg-orange-50 rounded-md">
                  <div className="text-sm font-medium text-orange-800 flex items-center gap-1">
                    <Fuel className="h-3 w-3" />
                    Abastecimento Total
                  </div>
                  <div className="text-lg font-semibold text-orange-900">{trip.refuelingLiters.toFixed(2)} L</div>
                </div>
              )}
              {fuelConsumed > 0 && (
                <div className="p-3 bg-red-50 rounded-md">
                  <div className="text-sm font-medium text-red-800 flex items-center gap-1">
                    <Fuel className="h-3 w-3" />
                    Combustível Consumido
                  </div>
                  <div className="text-lg font-semibold text-red-900">{fuelConsumed.toFixed(2)} L</div>
                </div>
              )}
              {remainingFuel > 0 && (
                <div className="p-3 bg-cyan-50 rounded-md">
                  <div className="text-sm font-medium text-cyan-800 flex items-center gap-1">
                    <Fuel className="h-3 w-3" />
                    Combustível Restante
                  </div>
                  <div className="text-lg font-semibold text-cyan-900">{remainingFuel.toFixed(2)} L</div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <TripPhotoGallery tripId={trip.id} photos={trip.photos || []} canEdit={true} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Informações da Viagem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              Para gerenciar despesas e receitas relacionadas a esta viagem, utilize o módulo{" "}
              <strong>Financeiro</strong> e associe as transações a esta viagem.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
