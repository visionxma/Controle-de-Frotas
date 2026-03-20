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
import { PlanBanner } from "@/components/plan-banner"
import { OnboardingTour } from "@/components/onboarding-tour"

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
      <OnboardingTour />
      <DashboardLayout>
        <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <PlanBanner />

          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-2">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Dashboard</h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base font-medium">
                Bem-vindo de volta! Aqui está o que está acontecendo com sua frota hoje.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleDownloadPDF} 
                variant="outline" 
                size="sm" 
                className="rounded-2xl border-border/40 hover:bg-primary/5 hover:text-primary transition-all h-10 px-5 font-bold shadow-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Relatório Geral
              </Button>
            </div>
          </div>

          {/* Filters Section */}
          <DashboardFilters
            onPeriodChange={setSelectedPeriod}
            onTruckFilter={setSelectedTruck}
            onDriverFilter={setSelectedDriver}
            trucks={trucks}
            drivers={drivers}
            selectedPeriod={selectedPeriod}
          />

          {/* Metrics Section */}
          <EnhancedStatsCards period={selectedPeriod} truckFilter={selectedTruck} driverFilter={selectedDriver} />

          {/* Content Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="bg-card border border-border/40 rounded-[2.5rem] p-6 shadow-sm">
              <RevenueExpenseChart period={selectedPeriod} truckFilter={selectedTruck} driverFilter={selectedDriver} />
            </div>
            <div className="bg-card border border-border/40 rounded-[2.5rem] p-6 shadow-sm">
              <TripsOverview truckFilter={selectedTruck} driverFilter={selectedDriver} />
            </div>
          </div>

          {/* Footer Section */}
          <div className="bg-card border border-border/40 rounded-[2.5rem] p-2 shadow-sm">
            <RecentTransactions />
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
