"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Truck, Users } from "lucide-react"
import { useTrips } from "@/hooks/use-trips"
import { useTrucks } from "@/hooks/use-trucks"
import { useDrivers } from "@/hooks/use-drivers"
import { cn } from "@/lib/utils"

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
    <div>
      <div className="mb-6 space-y-1">
        <h3 className="text-lg font-bold tracking-tight">Viagens Recentes</h3>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Últimas viagens registradas</p>
      </div>
      {filteredTrips.length === 0 ? (
        <div className="text-center py-12 bg-muted/5 rounded-3xl border border-dashed border-border/60">
          <p className="text-muted-foreground text-sm font-medium">Nenhuma viagem registrada ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTrips.map((trip) => (
            <div key={trip.id} className="group flex items-center justify-between p-4 bg-background border border-border/40 rounded-2xl hover:border-primary/20 transition-all duration-300 hover:shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/5 text-primary rounded-xl group-hover:bg-primary/10 transition-colors">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-sm tracking-tight text-foreground/90">
                    {trip.startLocation} → {trip.endLocation || "Em andamento"}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground/70 font-semibold tracking-wide">
                    <div className="flex items-center gap-1"><Truck className="h-3 w-3" /> {getTruckPlate(trip.truckId)}</div>
                    <div className="flex items-center gap-1"><Users className="h-3 w-3" /> {getDriverName(trip.driverId)}</div>
                    <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(trip.startDate).toLocaleDateString("pt-BR")}</div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge className={cn("text-[9px] font-black px-2 py-[2px] rounded-sm border-none shadow-none uppercase tracking-wider", 
                  trip.status === "in_progress" ? "bg-amber-500/10 text-amber-600" : "bg-green-500/10 text-green-600"
                )}>
                  {getStatusText(trip.status)}
                </Badge>
                {trip.status === "completed" && (
                  <p className="text-[11px] font-bold text-muted-foreground/50 tracking-tighter">{(trip.endKm || 0) - (trip.startKm || 0)} KM</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
