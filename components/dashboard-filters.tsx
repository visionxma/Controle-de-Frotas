"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Filter } from "lucide-react"
import { useState } from "react"

interface DashboardFiltersProps {
  onPeriodChange: (period: string) => void
  onTruckFilter: (truckId: string | null) => void
  onDriverFilter: (driverId: string | null) => void
  trucks: Array<{ id: string; plate: string }>
  drivers: Array<{ id: string; name: string }>
  selectedPeriod: string
}

export function DashboardFilters({
  onPeriodChange,
  onTruckFilter,
  onDriverFilter,
  trucks,
  drivers,
  selectedPeriod,
}: DashboardFiltersProps) {
  const [selectedTruck, setSelectedTruck] = useState<string | null>(null)
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null)

  const periods = [
    { value: "7d", label: "Últimos 7 dias" },
    { value: "30d", label: "Últimos 30 dias" },
    { value: "3m", label: "Últimos 3 meses" },
    { value: "6m", label: "Últimos 6 meses" },
    { value: "1y", label: "Último ano" },
    { value: "all", label: "Todo período" },
  ]

  const handleTruckChange = (value: string) => {
    const truckId = value === "all" ? null : value
    setSelectedTruck(truckId)
    onTruckFilter(truckId)
  }

  const handleDriverChange = (value: string) => {
    const driverId = value === "all" ? null : value
    setSelectedDriver(driverId)
    onDriverFilter(driverId)
  }

  const clearFilters = () => {
    setSelectedTruck(null)
    setSelectedDriver(null)
    onTruckFilter(null)
    onDriverFilter(null)
    onPeriodChange("30d")
  }

  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium hidden sm:inline">Filtros:</span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedPeriod} onValueChange={onPeriodChange}>
                <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periods.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

            <Select value={selectedTruck || "all"} onValueChange={handleTruckChange}>
              <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Todos os caminhões" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os caminhões</SelectItem>
              {trucks.map((truck) => (
                <SelectItem key={truck.id} value={truck.id}>
                  {truck.plate}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

            <Select value={selectedDriver || "all"} onValueChange={handleDriverChange}>
              <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Todos os motoristas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os motoristas</SelectItem>
              {drivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.id}>
                  {driver.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

            <Button variant="outline" size="sm" onClick={clearFilters} className="w-full sm:w-auto">
            Limpar filtros
          </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
