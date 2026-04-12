"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Route, Warehouse, Package, Percent, MapPin } from "lucide-react"
import { useTransactions, type Transaction } from "@/hooks/use-transactions"
import { useTrucks } from "@/hooks/use-trucks"
import { useDrivers } from "@/hooks/use-drivers"
import { useTrips } from "@/hooks/use-trips"
import { useRentals } from "@/hooks/use-rentals"
import { useSuppliers } from "@/hooks/use-suppliers"
import { cn } from "@/lib/utils"

export function RecentTransactions() {
  const { transactions } = useTransactions()
  const { trucks } = useTrucks()
  const { drivers } = useDrivers()
  const { trips } = useTrips()
  const { rentals } = useRentals()
  const { suppliers } = useSuppliers()

  const recentTransactions = transactions.slice(0, 5)

  const getTruckName = (truckId?: string) => {
    if (!truckId) return null
    const truck = trucks.find((t) => t.id === truckId)
    return truck ? `${truck.plate}` : null
  }

  const getDriverName = (driverId?: string) => {
    if (!driverId) return null
    const driver = drivers.find((d) => d.id === driverId)
    return driver?.name || null
  }

  const getOriginLabel = (transaction: Transaction) => {
    if (transaction.tripId) {
      const trip = trips.find((t) => t.id === transaction.tripId)
      if (trip) return `Viagem: ${trip.startLocation} → ${trip.endLocation || "Em rota"}`
      return "Viagem (removida)"
    }
    if (transaction.rentalId) {
      const rental = rentals.find((r) => r.id === transaction.rentalId)
      if (rental) return `Locação: ${rental.machinerySerial}`
      return "Locação (removida)"
    }
    if (transaction.supplierId) {
      const supplier = suppliers.find((s) => s.id === transaction.supplierId)
      if (supplier) return `Fornecedor: ${supplier.name}`
      return "Fornecedor (removido)"
    }
    if (transaction.isCommission) return "Comissão automática"
    return "Lançamento manual"
  }

  return (
    <div className="p-6">
      <div className="mb-6 space-y-1">
        <h3 className="text-lg font-bold tracking-tight">Transações Recentes</h3>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Últimas movimentações financeiras</p>
      </div>
      {recentTransactions.length === 0 ? (
        <div className="text-center py-12 bg-muted/5 rounded-3xl border border-dashed border-border/60">
          <p className="text-muted-foreground text-sm font-medium">Nenhuma transação registrada ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentTransactions.map((transaction) => (
            <div key={transaction.id} className="group flex items-center justify-between p-4 bg-background border border-border/40 rounded-2xl hover:border-primary/20 transition-all duration-300 hover:shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl transition-colors ${
                  transaction.type === "receita" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                }`}>
                  {transaction.type === "receita" ? (
                    <TrendingUp className="h-5 w-5" />
                  ) : (
                    <TrendingDown className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-sm tracking-tight text-foreground/90">{transaction.description}</p>
                  <p className="text-[11px] text-muted-foreground/70 font-semibold tracking-wide mt-0.5">
                    {getTruckName(transaction.truckId) || getDriverName(transaction.driverId) || "GERAL"} •{" "}
                    {new Date(transaction.date).toLocaleDateString("pt-BR")}
                  </p>
                  <p className="text-[10px] text-muted-foreground/50 font-medium mt-0.5">
                    {getOriginLabel(transaction)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-extrabold text-base tracking-tight ${transaction.type === "receita" ? "text-green-600" : "text-red-600"}`}>
                  {transaction.type === "receita" ? "+" : "-"} R${" "}
                  {transaction.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <Badge className={cn("text-[9px] font-black px-2 py-[2px] rounded-sm border-none shadow-none uppercase mt-1 tracking-wider", 
                  transaction.type === "receita" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                )}>
                  {transaction.type}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
