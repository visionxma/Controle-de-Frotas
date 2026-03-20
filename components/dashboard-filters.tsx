"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Filter, Users } from "lucide-react"
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
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white/50 dark:bg-black/20 p-4 rounded-3xl border border-border/40 backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-2xl border border-border/60 shadow-sm">
          <Calendar className="h-4 w-4 text-primary" />
          <Select value={selectedPeriod} onValueChange={onPeriodChange}>
            <SelectTrigger className="border-0 bg-transparent p-0 h-auto focus:ring-0 w-[140px] text-xs font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periods.map((period) => (
                <SelectItem key={period.value} value={period.value} className="text-xs">
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-2xl border border-border/60 shadow-sm">
          <Filter className="h-4 w-4 text-muted-foreground/60" />
          <Select value={selectedTruck || "all"} onValueChange={handleTruckChange}>
            <SelectTrigger className="border-0 bg-transparent p-0 h-auto focus:ring-0 w-[150px] text-xs font-semibold">
              <SelectValue placeholder="Caminhões" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Todos os caminhões</SelectItem>
              {trucks.map((truck) => (
                <SelectItem key={truck.id} value={truck.id} className="text-xs">
                  {truck.plate}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-2xl border border-border/60 shadow-sm">
          <Users className="h-4 w-4 text-muted-foreground/60" />
          <Select value={selectedDriver || "all"} onValueChange={handleDriverChange}>
            <SelectTrigger className="border-0 bg-transparent p-0 h-auto focus:ring-0 w-[150px] text-xs font-semibold">
              <SelectValue placeholder="Motoristas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Todos os motoristas</SelectItem>
              {drivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.id} className="text-xs">
                  {driver.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button 
        variant="ghost" 
        size="sm" 
        onClick={clearFilters} 
        className="text-muted-foreground hover:text-primary transition-colors hover:bg-primary/5 rounded-2xl text-xs font-bold"
      >
        Limpar Filtros
      </Button>
    </div>
  )
}
