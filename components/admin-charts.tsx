"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface AdminChartsProps {
  metrics: {
    revenue: {
      monthlyRecurringRevenue: number
      tenantsTotalIncome: number
      tenantsTotalExpenses: number
      tenantsNetProfit: number
    }
    users: {
      breakdown: { active: number; inactive: number; none: number }
      planBreakdown: { frotas: number; basic: number; custom: number; none: number }
    }
    trucks: { active: number; maintenance: number; inactive: number; inRoute: number }
    drivers: {
      active: number
      inactive: number
      suspended: number
      inRoute: number
      withApp: number
    }
    trips: { active: number; completed: number; canceled: number; totalKm: number }
    topAdmins: Array<{
      id: string
      name: string
      company: string
      truckCount: number
      driverCount: number
    }>
  }
}

const SUBSCRIPTION_COLORS = ["#10b981", "#f59e0b", "#94a3b8"]
const PLAN_COLORS = ["#3b82f6", "#f59e0b", "#d946ef", "#94a3b8"]
const TRUCK_COLORS = ["#3b82f6", "#f59e0b", "#94a3b8", "#8b5cf6"]
const DRIVER_COLORS = ["#10b981", "#94a3b8", "#ef4444", "#8b5cf6"]
const TRIP_COLORS = ["#f97316", "#10b981", "#ef4444"]

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })

const formatNumber = (value: number) => value.toLocaleString("pt-BR")

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <Card className="rounded-[2rem] border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-extrabold tracking-tight">{title}</CardTitle>
        {subtitle && (
          <p className="text-xs text-muted-foreground font-medium">{subtitle}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">{children}</div>
      </CardContent>
    </Card>
  )
}

function CenteredEmpty({ label }: { label: string }) {
  return (
    <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground font-medium">
      {label}
    </div>
  )
}

export function AdminCharts({ metrics }: AdminChartsProps) {
  const subscriptionData = [
    { name: "Ativas", value: metrics.users.breakdown.active },
    { name: "Inativas", value: metrics.users.breakdown.inactive },
    { name: "Sem plano", value: metrics.users.breakdown.none },
  ].filter((d) => d.value > 0)

  const planData = [
    { name: "Frotas", value: metrics.users.planBreakdown.frotas },
    { name: "Basic", value: metrics.users.planBreakdown.basic },
    { name: "Custom", value: metrics.users.planBreakdown.custom },
    { name: "Sem plano", value: metrics.users.planBreakdown.none },
  ].filter((d) => d.value > 0)

  const truckData = [
    { name: "Ativos", value: metrics.trucks.active, color: TRUCK_COLORS[0] },
    { name: "Em rota", value: metrics.trucks.inRoute, color: TRUCK_COLORS[3] },
    { name: "Manutenção", value: metrics.trucks.maintenance, color: TRUCK_COLORS[1] },
    { name: "Inativos", value: metrics.trucks.inactive, color: TRUCK_COLORS[2] },
  ]

  const driverData = [
    { name: "Ativos", value: metrics.drivers.active, color: DRIVER_COLORS[0] },
    { name: "Em rota", value: metrics.drivers.inRoute, color: DRIVER_COLORS[3] },
    { name: "Inativos", value: metrics.drivers.inactive, color: DRIVER_COLORS[1] },
    { name: "Suspensos", value: metrics.drivers.suspended, color: DRIVER_COLORS[2] },
  ]

  const tripData = [
    { name: "Em rota", value: metrics.trips.active },
    { name: "Concluídas", value: metrics.trips.completed },
    { name: "Canceladas", value: metrics.trips.canceled },
  ].filter((d) => d.value > 0)

  const financeData = [
    { name: "Receitas", value: metrics.revenue.tenantsTotalIncome, color: "#10b981" },
    { name: "Despesas", value: metrics.revenue.tenantsTotalExpenses, color: "#ef4444" },
    {
      name: "Lucro",
      value: metrics.revenue.tenantsNetProfit,
      color: metrics.revenue.tenantsNetProfit >= 0 ? "#3b82f6" : "#f59e0b",
    },
  ]

  const topAdminsData = metrics.topAdmins
    .slice(0, 10)
    .map((a) => ({
      name: (a.company || a.name || "—").length > 20
        ? (a.company || a.name).slice(0, 18) + "…"
        : a.company || a.name || "—",
      caminhões: a.truckCount,
      motoristas: a.driverCount,
    }))

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-extrabold tracking-tight">Gráficos</h2>
        <p className="text-xs text-muted-foreground font-medium">
          Visão geral das métricas globais
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Receita vs Despesas vs Lucro */}
        <ChartCard
          title="Financeiro dos clientes"
          subtitle="Soma agregada de receitas, despesas e lucro líquido"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={financeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatCurrency(Number(v))}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "1rem",
                  fontSize: 12,
                }}
                formatter={(v) => formatCurrency(Number(v))}
              />
              <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                {financeData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top 10 empresas */}
        <ChartCard
          title="Top 10 empresas"
          subtitle="Por número de caminhões e motoristas"
        >
          {topAdminsData.length === 0 ? (
            <CenteredEmpty label="Sem empresas cadastradas." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topAdminsData}
                layout="vertical"
                margin={{ top: 5, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "1rem",
                    fontSize: 12,
                  }}
                  formatter={(v) => formatNumber(Number(v))}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="caminhões" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                <Bar dataKey="motoristas" fill="#a855f7" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Donut: Assinaturas */}
        <ChartCard
          title="Status das assinaturas"
          subtitle="Empresas por situação de pagamento"
        >
          {subscriptionData.length === 0 ? (
            <CenteredEmpty label="Sem dados." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "1rem",
                    fontSize: 12,
                  }}
                  formatter={(v) => formatNumber(Number(v))}
                />
                <Pie
                  data={subscriptionData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={3}
                  stroke="hsl(var(--card))"
                  strokeWidth={2}
                >
                  {subscriptionData.map((_, i) => (
                    <Cell key={i} fill={SUBSCRIPTION_COLORS[i % SUBSCRIPTION_COLORS.length]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Donut: Planos */}
        <ChartCard
          title="Distribuição de planos"
          subtitle="Tipo de plano por empresa"
        >
          {planData.length === 0 ? (
            <CenteredEmpty label="Sem dados." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "1rem",
                    fontSize: 12,
                  }}
                  formatter={(v) => formatNumber(Number(v))}
                />
                <Pie
                  data={planData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={3}
                  stroke="hsl(var(--card))"
                  strokeWidth={2}
                >
                  {planData.map((_, i) => (
                    <Cell key={i} fill={PLAN_COLORS[i % PLAN_COLORS.length]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Bar: Caminhões */}
        <ChartCard title="Frota por status" subtitle="Caminhões cadastrados">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={truckData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "1rem",
                  fontSize: 12,
                }}
                formatter={(v) => formatNumber(Number(v))}
              />
              <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                {truckData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Bar: Motoristas */}
        <ChartCard title="Motoristas por status" subtitle="Cadastrados em todas as empresas">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={driverData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "1rem",
                  fontSize: 12,
                }}
                formatter={(v) => formatNumber(Number(v))}
              />
              <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                {driverData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Donut: Viagens */}
        <ChartCard
          title="Viagens por status"
          subtitle={`${formatNumber(metrics.trips.totalKm)} km rodados em viagens concluídas`}
        >
          {tripData.length === 0 ? (
            <CenteredEmpty label="Sem viagens registradas." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "1rem",
                    fontSize: 12,
                  }}
                  formatter={(v) => formatNumber(Number(v))}
                />
                <Pie
                  data={tripData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={3}
                  stroke="hsl(var(--card))"
                  strokeWidth={2}
                >
                  {tripData.map((_, i) => (
                    <Cell key={i} fill={TRIP_COLORS[i % TRIP_COLORS.length]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* MRR card destacado */}
        <ChartCard
          title="Receita Recorrente Mensal (MRR)"
          subtitle="Soma das assinaturas Stripe ativas"
        >
          <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
            <div className="p-6 rounded-[2rem] bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 w-full max-w-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 mb-2">
                MRR atual
              </p>
              <p className="text-4xl font-extrabold tracking-tight text-primary">
                {formatCurrency(metrics.revenue.monthlyRecurringRevenue)}
              </p>
              <p className="text-xs text-muted-foreground font-medium mt-2">
                {metrics.users.breakdown.active} assinaturas ativas
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
              <div className="p-3 rounded-2xl bg-card border border-border/40">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                  Anual proj.
                </p>
                <p className="text-base font-extrabold tracking-tight">
                  {formatCurrency(metrics.revenue.monthlyRecurringRevenue * 12)}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-card border border-border/40">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                  Ticket médio
                </p>
                <p className="text-base font-extrabold tracking-tight">
                  {metrics.users.breakdown.active > 0
                    ? formatCurrency(
                        metrics.revenue.monthlyRecurringRevenue / metrics.users.breakdown.active,
                      )
                    : formatCurrency(0)}
                </p>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>
    </section>
  )
}
