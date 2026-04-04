"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { useTransactions } from "@/hooks/use-transactions"
import { useFixedExpenses } from "@/hooks/use-fixed-expenses"
import { TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"

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
  const { totalMonthly: fixedMonthly } = useFixedExpenses()

  // Adiciona as despesas fixas mensais a cada mês do gráfico
  const chartData = getFilteredChartData(period, truckFilter, driverFilter, null).map((entry: any) => ({
    ...entry,
    despesa: entry.despesa + fixedMonthly,
  }))

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
  const totals = chartData.reduce((acc: { receita: number; despesa: number }, curr: any) => ({
    receita: acc.receita + curr.receita,
    despesa: acc.despesa + curr.despesa
  }), { receita: 0, despesa: 0 })

  const balance = totals.receita - totals.despesa
  const profitMargin = totals.receita > 0 ? (balance / totals.receita) * 100 : 0

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 space-y-1">
        <h3 className="text-lg font-bold tracking-tight">Receitas vs Despesas</h3>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{getDescription()}</p>
      </div>
      <ChartContainer config={chartConfig}>
        <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
          <BarChart data={chartData}>
            <XAxis 
              dataKey="month" 
              tickLine={false} 
              tickMargin={10} 
              axisLine={false}
              fontSize={11}
              fontWeight={600}
              className="fill-muted-foreground/60"
            />
            <YAxis 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              fontSize={11}
              fontWeight={600}
              className="fill-muted-foreground/60"
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
            <Bar dataKey="receita" fill="#dc2626" radius={[4, 4, 0, 0]} />
            <Bar dataKey="despesa" fill="#374151" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      <div className="mt-auto pt-8 border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-950/40 p-5 rounded-sm border border-white/5 flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-[0.2em]">Total Receita</span>
              <div className="p-1 px-2 rounded-full bg-emerald-500/10 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[9px] font-black uppercase text-emerald-500/80">Entrada</span>
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-2xl font-black tracking-tighter text-white">
                 R$ {totals.receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[9px] text-muted-foreground/40 mt-1 uppercase font-bold tracking-widest">Faturamento Período</p>
            </div>
          </div>

          <div className="bg-zinc-950/40 p-5 rounded-sm border border-white/5 flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-[0.2em]">Total Despesa</span>
              <div className="p-1 px-2 rounded-full bg-red-500/10 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                <span className="text-[9px] font-black uppercase text-red-500/80">Saída</span>
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-2xl font-black tracking-tighter text-white">
                 R$ {totals.despesa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[9px] text-muted-foreground/40 mt-1 uppercase font-bold tracking-widest">Custos Período</p>
            </div>
          </div>

          <div className={cn(
            "p-5 rounded-sm border flex flex-col justify-between min-h-[120px] transition-all relative overflow-hidden",
            balance >= 0 ? "bg-emerald-500/[0.03] border-emerald-500/20" : "bg-red-500/[0.03] border-red-500/20"
          )}>
            <div className="flex items-center justify-between relative z-10">
              <span className={cn(
                "text-[10px] uppercase font-black tracking-[0.2em]",
                balance >= 0 ? "text-emerald-500/60" : "text-red-500/60"
              )}>Saldo Líquido</span>
              <div className={cn(
                "p-1 px-2 rounded-full flex items-center gap-1.5",
                balance >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"
              )}>
                <span className={cn(
                  "text-[10px] font-black italic",
                  balance >= 0 ? "text-emerald-500" : "text-red-500"
                )}>
                  {profitMargin >= 0 ? "+" : ""}{profitMargin.toFixed(1)}%
                </span>
              </div>
            </div>
            
            <div className="mt-4 relative z-10">
              <p className={cn(
                "text-3xl font-black tracking-tighter",
                balance >= 0 ? "text-emerald-500" : "text-red-500"
              )}>
                 R$ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[9px] text-muted-foreground/40 mt-1 uppercase font-bold tracking-widest italic">Margem de Lucratividade</p>
            </div>
            
            {/* Background Accent */}
            <div className={cn(
               "absolute -right-8 -bottom-8 w-24 h-24 rounded-full blur-[40px] opacity-20",
               balance >= 0 ? "bg-emerald-500" : "bg-red-500"
            )} />
          </div>
        </div>
      </div>
    </div>
  )
}
