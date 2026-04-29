"use client"

import { useCallback, useEffect, useState } from "react"
import { SuperAdminRoute } from "@/components/super-admin-route"
import { AdminCharts } from "@/components/admin-charts"
import { useAuth } from "@/contexts/auth-context"
import { auth } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Users,
  Truck,
  UserCircle,
  MapPin,
  Wallet,
  CreditCard,
  TrendingUp,
  Building2,
  Wrench,
  Package,
  ClipboardList,
  Loader2,
  RefreshCw,
  LogOut,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react"

interface AdminMetrics {
  generatedAt: string
  overview: {
    totalUsers: number
    activeSubscriptions: number
    inactiveSubscriptions: number
    noSubscription: number
    onboardedUsers: number
    totalCollaborators: number
    totalTrucks: number
    totalDrivers: number
    totalTrips: number
    totalTransactions: number
    totalMachinery: number
    totalRentals: number
    totalSuppliers: number
    totalFixedExpenses: number
  }
  revenue: {
    monthlyRecurringRevenue: number
    tenantsTotalIncome: number
    tenantsTotalExpenses: number
    tenantsNetProfit: number
  }
  users: {
    breakdown: { active: number; inactive: number; none: number }
    planBreakdown: { frotas: number; basic: number; custom: number; none: number }
    growth: { last7d: number; last30d: number }
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
    email: string
    company: string
    truckCount: number
    driverCount: number
    subscriptionStatus: string
    planType: string
    maxTrucks: number
  }>
  recentUsers: Array<{
    id: string
    name: string
    email: string
    company: string
    subscriptionStatus: string
    planType: string
    maxTrucks: number
    createdAt: string | null
  }>
}

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

const formatNumber = (value: number) => value.toLocaleString("pt-BR")

const formatDate = (iso: string | null) => {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("pt-BR")
  } catch {
    return "—"
  }
}

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  accent = "text-blue-500",
  bg = "bg-blue-500/10",
}: {
  title: string
  value: string | number
  sub?: string
  icon: any
  accent?: string
  bg?: string
}) {
  return (
    <div className="group relative flex flex-col p-5 bg-card border border-border/40 rounded-[2rem] hover:border-primary/30 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
          {title}
        </span>
        <div className={`p-2 rounded-xl ${bg}`}>
          <Icon className={`h-4 w-4 ${accent}`} />
        </div>
      </div>
      <span className="text-2xl font-extrabold tracking-tight">{value}</span>
      {sub && (
        <span className="text-xs text-muted-foreground mt-1 font-medium">{sub}</span>
      )}
    </div>
  )
}

function SubscriptionBadge({ status }: { status: string }) {
  if (status === "active") {
    return (
      <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/15 border-0">
        Ativa
      </Badge>
    )
  }
  if (status === "past_due") {
    return (
      <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/15 border-0">
        Atrasada
      </Badge>
    )
  }
  if (status === "canceled") {
    return (
      <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/15 border-0">
        Cancelada
      </Badge>
    )
  }
  if (status === "incomplete") {
    return (
      <Badge className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/15 border-0">
        Pendente
      </Badge>
    )
  }
  return (
    <Badge className="bg-muted text-muted-foreground hover:bg-muted/80 border-0">
      Sem plano
    </Badge>
  )
}

function AdminPanel() {
  const { user, logout } = useAuth()
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    setError(null)
    try {
      const idToken = await auth?.currentUser?.getIdToken(true)
      if (!idToken) {
        setError("Sessão inválida. Faça login novamente.")
        return
      }
      const res = await fetch("/api/admin/metrics", {
        headers: { Authorization: `Bearer ${idToken}` },
        cache: "no-store",
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Erro ${res.status}`)
      }
      const data = (await res.json()) as AdminMetrics
      setMetrics(data)
    } catch (e: any) {
      setError(e?.message || "Erro ao carregar métricas")
    }
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      await fetchMetrics()
      if (mounted) setLoading(false)
    })()
    return () => {
      mounted = false
    }
  }, [fetchMetrics])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchMetrics()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando métricas globais...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">Painel Super-Admin</h1>
              <p className="text-xs text-muted-foreground font-medium">
                Logado como {user?.email}
                {metrics?.generatedAt && (
                  <>
                    {" "}
                    · Atualizado às{" "}
                    {new Date(metrics.generatedAt).toLocaleTimeString("pt-BR")}
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-2xl h-10 font-bold"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Atualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout()}
              className="rounded-2xl h-10 font-bold"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
        {error && (
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {metrics && (
          <>
            {/* Receita */}
            <section className="space-y-4">
              <h2 className="text-lg font-extrabold tracking-tight">Receita</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="MRR (Stripe)"
                  value={formatCurrency(metrics.revenue.monthlyRecurringRevenue)}
                  sub={`${metrics.users.breakdown.active} assinaturas ativas`}
                  icon={CreditCard}
                  accent="text-green-500"
                  bg="bg-green-500/10"
                />
                <StatCard
                  title="Receita dos Clientes"
                  value={formatCurrency(metrics.revenue.tenantsTotalIncome)}
                  sub="Soma de todas as receitas"
                  icon={TrendingUp}
                  accent="text-blue-500"
                  bg="bg-blue-500/10"
                />
                <StatCard
                  title="Despesas dos Clientes"
                  value={formatCurrency(metrics.revenue.tenantsTotalExpenses)}
                  sub="Soma de todas as despesas"
                  icon={Wallet}
                  accent="text-red-500"
                  bg="bg-red-500/10"
                />
                <StatCard
                  title="Lucro Líquido"
                  value={formatCurrency(metrics.revenue.tenantsNetProfit)}
                  sub="Receitas − despesas"
                  icon={TrendingUp}
                  accent={
                    metrics.revenue.tenantsNetProfit >= 0
                      ? "text-emerald-500"
                      : "text-red-500"
                  }
                  bg={
                    metrics.revenue.tenantsNetProfit >= 0
                      ? "bg-emerald-500/10"
                      : "bg-red-500/10"
                  }
                />
              </div>
            </section>

            {/* Usuários */}
            <section className="space-y-4">
              <h2 className="text-lg font-extrabold tracking-tight">Usuários & Assinaturas</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Total de Empresas"
                  value={formatNumber(metrics.overview.totalUsers)}
                  sub={`${metrics.users.growth.last7d} novos em 7d · ${metrics.users.growth.last30d} em 30d`}
                  icon={Building2}
                  accent="text-purple-500"
                  bg="bg-purple-500/10"
                />
                <StatCard
                  title="Assinaturas Ativas"
                  value={formatNumber(metrics.users.breakdown.active)}
                  sub={`${metrics.users.breakdown.inactive} inativas · ${metrics.users.breakdown.none} sem plano`}
                  icon={CheckCircle2}
                  accent="text-green-500"
                  bg="bg-green-500/10"
                />
                <StatCard
                  title="Onboarding Completo"
                  value={formatNumber(metrics.overview.onboardedUsers)}
                  sub={`${metrics.overview.totalUsers - metrics.overview.onboardedUsers} pendentes`}
                  icon={ClipboardList}
                  accent="text-cyan-500"
                  bg="bg-cyan-500/10"
                />
                <StatCard
                  title="Colaboradores"
                  value={formatNumber(metrics.overview.totalCollaborators)}
                  sub="Contas vinculadas a admins"
                  icon={Users}
                  accent="text-indigo-500"
                  bg="bg-indigo-500/10"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Plano Frotas"
                  value={formatNumber(metrics.users.planBreakdown.frotas)}
                  icon={Truck}
                  accent="text-blue-500"
                  bg="bg-blue-500/10"
                />
                <StatCard
                  title="Plano Basic"
                  value={formatNumber(metrics.users.planBreakdown.basic)}
                  icon={Package}
                  accent="text-amber-500"
                  bg="bg-amber-500/10"
                />
                <StatCard
                  title="Plano Custom"
                  value={formatNumber(metrics.users.planBreakdown.custom)}
                  icon={Package}
                  accent="text-fuchsia-500"
                  bg="bg-fuchsia-500/10"
                />
                <StatCard
                  title="Sem plano"
                  value={formatNumber(metrics.users.planBreakdown.none)}
                  icon={XCircle}
                  accent="text-muted-foreground"
                  bg="bg-muted"
                />
              </div>
            </section>

            {/* Frota */}
            <section className="space-y-4">
              <h2 className="text-lg font-extrabold tracking-tight">Frota & Operação</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Caminhões"
                  value={formatNumber(metrics.overview.totalTrucks)}
                  sub={`${metrics.trucks.active} ativos · ${metrics.trucks.inRoute} em rota · ${metrics.trucks.maintenance} manut.`}
                  icon={Truck}
                  accent="text-blue-500"
                  bg="bg-blue-500/10"
                />
                <StatCard
                  title="Motoristas"
                  value={formatNumber(metrics.overview.totalDrivers)}
                  sub={`${metrics.drivers.active} ativos · ${metrics.drivers.withApp} com app`}
                  icon={UserCircle}
                  accent="text-purple-500"
                  bg="bg-purple-500/10"
                />
                <StatCard
                  title="Viagens"
                  value={formatNumber(metrics.overview.totalTrips)}
                  sub={`${metrics.trips.active} em rota · ${metrics.trips.completed} concluídas`}
                  icon={MapPin}
                  accent="text-orange-500"
                  bg="bg-orange-500/10"
                />
                <StatCard
                  title="KM Rodados"
                  value={formatNumber(metrics.trips.totalKm)}
                  sub="Em viagens concluídas"
                  icon={Activity}
                  accent="text-amber-500"
                  bg="bg-amber-500/10"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Transações"
                  value={formatNumber(metrics.overview.totalTransactions)}
                  sub="Receitas + despesas"
                  icon={Wallet}
                  accent="text-green-500"
                  bg="bg-green-500/10"
                />
                <StatCard
                  title="Maquinário"
                  value={formatNumber(metrics.overview.totalMachinery)}
                  sub={`${metrics.overview.totalRentals} locações`}
                  icon={Wrench}
                  accent="text-yellow-500"
                  bg="bg-yellow-500/10"
                />
                <StatCard
                  title="Fornecedores"
                  value={formatNumber(metrics.overview.totalSuppliers)}
                  sub="Empresas cadastradas"
                  icon={Building2}
                  accent="text-teal-500"
                  bg="bg-teal-500/10"
                />
                <StatCard
                  title="Despesas Fixas"
                  value={formatNumber(metrics.overview.totalFixedExpenses)}
                  sub="Recorrentes mensais"
                  icon={ClipboardList}
                  accent="text-rose-500"
                  bg="bg-rose-500/10"
                />
              </div>
            </section>

            {/* Gráficos */}
            <AdminCharts metrics={metrics} />

            {/* Top admins */}
            <section className="space-y-4">
              <Card className="rounded-[2rem] border-border/40">
                <CardHeader>
                  <CardTitle className="text-base font-extrabold tracking-tight">
                    Top 10 Empresas (por nº de caminhões)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Empresa</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead className="text-right">Caminhões</TableHead>
                          <TableHead className="text-right">Motoristas</TableHead>
                          <TableHead className="text-right">Plano</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {metrics.topAdmins.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center text-sm text-muted-foreground py-8"
                            >
                              Nenhuma empresa ainda.
                            </TableCell>
                          </TableRow>
                        ) : (
                          metrics.topAdmins.map((a) => (
                            <TableRow key={a.id}>
                              <TableCell className="font-bold">
                                {a.company || a.name}
                                <p className="text-xs text-muted-foreground font-medium">
                                  {a.name}
                                </p>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {a.email}
                              </TableCell>
                              <TableCell className="text-right font-bold">
                                {a.truckCount}
                                {a.maxTrucks > 0 && (
                                  <span className="text-xs text-muted-foreground font-medium">
                                    {" "}
                                    /{a.maxTrucks}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-bold">
                                {a.driverCount}
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                {a.planType === "none" ? "—" : a.planType}
                              </TableCell>
                              <TableCell className="text-right">
                                <SubscriptionBadge status={a.subscriptionStatus} />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Recent users */}
            <section className="space-y-4">
              <Card className="rounded-[2rem] border-border/40">
                <CardHeader>
                  <CardTitle className="text-base font-extrabold tracking-tight">
                    Cadastros recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Empresa</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Plano</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Cadastrado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {metrics.recentUsers.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="text-center text-sm text-muted-foreground py-8"
                            >
                              Sem cadastros ainda.
                            </TableCell>
                          </TableRow>
                        ) : (
                          metrics.recentUsers.map((u) => (
                            <TableRow key={u.id}>
                              <TableCell className="font-bold">
                                {u.company || u.name}
                                <p className="text-xs text-muted-foreground font-medium">
                                  {u.name}
                                </p>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {u.email}
                              </TableCell>
                              <TableCell className="text-sm">
                                {u.planType === "none" ? "—" : u.planType}
                                {u.maxTrucks > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    {" "}
                                    ({u.maxTrucks} caminhões)
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <SubscriptionBadge status={u.subscriptionStatus} />
                              </TableCell>
                              <TableCell className="text-right text-sm text-muted-foreground">
                                {formatDate(u.createdAt)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default function AdminPage() {
  return (
    <SuperAdminRoute>
      <AdminPanel />
    </SuperAdminRoute>
  )
}
