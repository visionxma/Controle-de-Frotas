"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardFilters } from "@/components/dashboard-filters"
import { EnhancedStatsCards } from "@/components/enhanced-stats-cards"
import { RevenueExpenseChart } from "@/components/revenue-expense-chart"
import { RecentTransactions } from "@/components/recent-transactions"
import { TripsOverview } from "@/components/trips-overview"
import { useTrucks } from "@/hooks/use-trucks"
import { useDrivers } from "@/hooks/use-drivers"
import { Download } from "lucide-react"
import { usePdfReports } from "@/hooks/use-pdf-reports"
import { useTransactions } from "@/hooks/use-transactions"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("30d")
  const [selectedTruck, setSelectedTruck] = useState<string | null>(null)
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null)

  const { trucks } = useTrucks()
  const { drivers } = useDrivers()
  const { transactions } = useTransactions()
  const { generateDashboardReport } = usePdfReports()

  const handleDownloadPDF = () => {
    const stats = {
      totalRevenue: 50000,
      totalExpenses: 30000,
      netProfit: 20000,
      activeTrips: 5,
      completedTrips: 25,
    }

    generateDashboardReport({
      stats,
      transactions: transactions.slice(0, 10),
      trips: [], // You'd pass actual trips data here
    })
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="mobile-spacing">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-balance">Dashboard</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Visão geral completa da sua frota e operações</p>
            </div>
            <Button onClick={handleDownloadPDF} variant="outline" size="sm" className="sm:size-default">
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Baixar PDF</span>
            </Button>
          </div>

          <DashboardFilters
            onPeriodChange={setSelectedPeriod}
            onTruckFilter={setSelectedTruck}
            onDriverFilter={setSelectedDriver}
            trucks={trucks}
            drivers={drivers}
            selectedPeriod={selectedPeriod}
          />

          <EnhancedStatsCards period={selectedPeriod} truckFilter={selectedTruck} driverFilter={selectedDriver} />

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            <RevenueExpenseChart period={selectedPeriod} truckFilter={selectedTruck} driverFilter={selectedDriver} />
            <TripsOverview truckFilter={selectedTruck} driverFilter={selectedDriver} />
          </div>

          <RecentTransactions />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
