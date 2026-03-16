"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Truck } from "lucide-react"
import { useTrips } from "@/hooks/use-trips"
import { useTrucks } from "@/hooks/use-trucks"
import { useDrivers } from "@/hooks/use-drivers"

interface TripsOverviewProps {
  truckFilter: string | null
  driverFilter: string | null
}

export function TripsOverview({ truckFilter, driverFilter }: TripsOverviewProps) {
  const { trips } = useTrips()
  const { trucks } = useTrucks()
  const { drivers } = useDrivers()

  const filteredTrips = trips
    .filter((trip) => {
      if (truckFilter && trip.truckId !== truckFilter) return false
      if (driverFilter && trip.driverId !== driverFilter) return false
      return true
    })
    .slice(0, 5)

  const getTruckPlate = (truckId: string) => {
    const truck = trucks.find((t) => t.id === truckId)
    return truck?.plate || "N/A"
  }

  const getDriverName = (driverId: string) => {
    const driver = drivers.find((d) => d.id === driverId)
    return driver?.name || "N/A"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "in_progress":
        return "Em andamento"
      case "completed":
        return "Concluída"
      default:
        return status
    }
  }

  return (
    <Card>
      <CardHeader className="p-3 sm:p-4 lg:p-6">
        <CardTitle className="text-base sm:text-lg">Viagens Recentes</CardTitle>
        <CardDescription className="text-sm">Últimas viagens registradas</CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
        {filteredTrips.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">Nenhuma viagem registrada ainda.</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredTrips.map((trip) => (
              <div key={trip.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-3 sm:gap-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm leading-tight">
                      {trip.startLocation} → {trip.endLocation || "Em andamento"}
                    </p>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs text-muted-foreground leading-tight">
                      <Truck className="h-3 w-3" />
                      <span>{getTruckPlate(trip.truckId)}</span>
                      <span>•</span>
                      <span>{getDriverName(trip.driverId)}</span>
                      <span>•</span>
                      <Clock className="h-3 w-3" />
                      <span>{new Date(trip.startDate).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right sm:text-left">
                  <Badge className={`text-xs mb-1 ${getStatusColor(trip.status)}`}>{getStatusText(trip.status)}</Badge>
                  {trip.status === "completed" && (
                    <p className="text-xs text-muted-foreground">{trip.endKm - trip.startKm} km</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
