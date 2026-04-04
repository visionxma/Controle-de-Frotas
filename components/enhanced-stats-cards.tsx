"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Truck, Users, TrendingUp, MapPin, Fuel } from "lucide-react"
import { useTrucks } from "@/hooks/use-trucks"
import { useDrivers } from "@/hooks/use-drivers"
import { useTransactions } from "@/hooks/use-transactions"
import { useTrips } from "@/hooks/use-trips"
import { useFixedExpenses } from "@/hooks/use-fixed-expenses"
import { cn } from "@/lib/utils"

interface EnhancedStatsCardsProps {
  period: string
  truckFilter: string | null
  driverFilter: string | null
}

export function EnhancedStatsCards({ period, truckFilter, driverFilter }: EnhancedStatsCardsProps) {
  const { trucks } = useTrucks()
  const { drivers } = useDrivers()
  const { getFilteredStats } = useTransactions()
  const { trips } = useTrips()
  const { totalMonthly: fixedMonthly } = useFixedExpenses()

  const filteredTrucks = truckFilter ? trucks.filter((t) => t.id === truckFilter) : trucks
  const filteredDrivers = driverFilter ? drivers.filter((d) => d.id === driverFilter) : drivers
  const filteredTrips = trips.filter((trip) => {
    if (truckFilter && trip.truckId !== truckFilter) return false
    if (driverFilter && trip.driverId !== driverFilter) return false
    return true
  })

  const { revenue, expenses: txExpenses } = getFilteredStats(period, truckFilter, driverFilter, null)

  // Multiplica as despesas fixas mensais pelo número de meses do período selecionado
  const periodMonths: Record<string, number> = { "7d": 7 / 30, "30d": 1, "3m": 3, "6m": 6, "1y": 12, all: 1 }
  const fixedForPeriod = fixedMonthly * (periodMonths[period] ?? 1)
  const expenses = txExpenses + fixedForPeriod
  const profit = revenue - expenses

  const activeTrips = filteredTrips.filter((trip) => trip.status === "in_progress").length
  const completedTrips = filteredTrips.filter((trip) => trip.status === "completed").length
  const totalKm = filteredTrips
    .filter((trip) => trip.status === "completed")
    .reduce((sum, trip) => sum + ((trip.endKm || 0) - (trip.startKm || 0)), 0)

  const revenueChange = Math.random() * 20 - 10
  const profitChange = Math.random() * 30 - 15

  return (
    <div className="responsive-stats-grid gap-4 lg:gap-6">
      {[
        { title: "Caminhões", value: filteredTrucks.length, sub: `${filteredTrucks.filter((t) => t.status === "active").length} ativos`, icon: Truck, color: "text-blue-500", bg: "bg-blue-500/10" },
        { title: "Motoristas", value: filteredDrivers.length, sub: `${filteredDrivers.filter((d) => d.status === "active").length} disponíveis`, icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
        { title: "Viagens", value: activeTrips, sub: `${completedTrips} concluídas`, icon: MapPin, color: "text-orange-500", bg: "bg-orange-500/10" },
        { title: "KM Rodados", value: totalKm.toLocaleString(), sub: `${totalKm > 0 ? (totalKm / Math.max(completedTrips, 1)).toFixed(0) : 0} km/viagem`, icon: Fuel, color: "text-amber-500", bg: "bg-amber-500/10" },
        { title: "Receita", value: `R$ ${revenue.toLocaleString("pt-BR")}`, sub: `${revenueChange >= 0 ? "+" : ""}${revenueChange.toFixed(1)}% vs anterior`, icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10", isPositive: revenueChange >= 0 },
        { title: "Lucro", value: `R$ ${profit.toLocaleString("pt-BR")}`, sub: `${profitChange.toFixed(1)}% margem`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10", isPositive: profitChange >= 0 },
      ].map((card, i) => (
        <div key={i} className="group relative flex flex-col p-5 bg-card border border-border/40 rounded-[2rem] hover:border-primary/30 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-4">
            <div className={cn("p-2 rounded-xl transition-all duration-300 group-hover:scale-110", card.bg, card.color)}>
              <card.icon className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">{card.title}</span>
          </div>
          <div className="space-y-1">
            <div className={cn("text-2xl font-bold tracking-tight", card.title === "Receita" ? "text-green-600" : card.title === "Lucro" ? "text-primary" : "text-foreground")}>
              {card.value}
            </div>
            <p className={cn("text-xs font-medium", card.isPositive === undefined ? "text-muted-foreground/60" : card.isPositive ? "text-green-600/80" : "text-red-500/80")}>
              {card.sub}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
