"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { useTransactions } from "@/hooks/use-transactions"

const chartConfig = {
  receita: {
    label: "Receita",
    color: "#dc2626", // Usando cor vermelha da paleta
  },
  despesa: {
    label: "Despesa",
    color: "#374151", // Usando cor escura da paleta
  },
}

interface RevenueExpenseChartProps {
  period?: string
  truckFilter?: string | null
  driverFilter?: string | null
}

export function RevenueExpenseChart({
  period = "6m",
  truckFilter = null,
  driverFilter = null,
}: RevenueExpenseChartProps) {
  const { getFilteredChartData } = useTransactions()
  const chartData = getFilteredChartData(period, truckFilter, driverFilter)

  const getDescription = () => {
    switch (period) {
      case "7d":
        return "Últimos 7 dias"
      case "30d":
        return "Últimos 30 dias"
      case "3m":
        return "Últimos 3 meses"
      case "6m":
        return "Últimos 6 meses"
      case "1y":
        return "Último ano"
      default:
        return "Todo período"
    }
  }

  return (
    <Card>
      <CardHeader className="p-3 sm:p-4 lg:p-6">
        <CardTitle className="text-base sm:text-lg">Receitas vs Despesas</CardTitle>
        <CardDescription className="text-sm">{getDescription()}</CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
            <BarChart data={chartData}>
              <XAxis 
                dataKey="month" 
                tickLine={false} 
                tickMargin={10} 
                axisLine={false}
                fontSize={12}
                className="sm:text-sm"
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                fontSize={12}
                className="sm:text-sm"
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
              <Bar dataKey="receita" fill="#dc2626" radius={4} />
              <Bar dataKey="despesa" fill="#374151" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
