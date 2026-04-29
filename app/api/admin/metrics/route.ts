import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin"
import { SUPER_ADMIN_EMAIL } from "@/lib/admin-config"
import { getMonthlyTotal } from "@/lib/stripe"

export const dynamic = "force-dynamic"

function toMillis(value: any): number {
  if (!value) return 0
  if (typeof value.toMillis === "function") return value.toMillis()
  if (value instanceof Date) return value.getTime()
  const parsed = new Date(value).getTime()
  return Number.isFinite(parsed) ? parsed : 0
}

export async function GET(request: NextRequest) {
  // Verificação de super-admin via Firebase ID token
  const authHeader = request.headers.get("authorization") || ""
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""

  if (!idToken) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  let decoded
  try {
    decoded = await getAdminAuth().verifyIdToken(idToken)
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 })
  }

  if ((decoded.email || "").toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json({ error: "Acesso restrito ao super-admin" }, { status: 403 })
  }

  const db = getAdminDb()

  const [
    usersSnap,
    trucksSnap,
    driversSnap,
    tripsSnap,
    transactionsSnap,
    collaboratorsSnap,
    machinerySnap,
    rentalsSnap,
    suppliersSnap,
    fixedExpensesSnap,
  ] = await Promise.all([
    db.collection("users").get(),
    db.collection("trucks").get(),
    db.collection("drivers").get(),
    db.collection("trips").get(),
    db.collection("transactions").get(),
    db.collection("collaborators").get(),
    db.collection("machinery").get(),
    db.collection("rentals").get(),
    db.collection("suppliers").get(),
    db.collection("fixedExpenses").get(),
  ])

  const users = usersSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
  const trucks = trucksSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
  const drivers = driversSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
  const trips = tripsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
  const transactions = transactionsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
  const collaborators = collaboratorsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
  const machinery = machinerySnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
  const rentals = rentalsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
  const suppliers = suppliersSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
  const fixedExpenses = fixedExpensesSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))

  const realUsers = users.filter((u) => !u.isSuperAdmin)
  const activeCollaborators = collaborators.filter((c) => !c.deleted)

  const activeUsers = realUsers.filter((u) => u.subscription_status === "active")
  const inactiveUsers = realUsers.filter(
    (u) => u.subscription_status && u.subscription_status !== "active",
  )
  const noSubUsers = realUsers.filter((u) => !u.subscription_status)
  const onboardedUsers = realUsers.filter((u) => u.onboarding_completed)

  const monthlyRecurringRevenue = activeUsers.reduce(
    (sum, u) => sum + getMonthlyTotal(Number(u.max_trucks) || 0),
    0,
  )

  const totalIncome = transactions
    .filter((t) => t.type === "receita")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  const totalExpenses = transactions
    .filter((t) => t.type === "despesa")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

  const tripsActive = trips.filter((t) => t.status === "in_progress").length
  const tripsCompleted = trips.filter((t) => t.status === "completed").length
  const tripsCanceled = trips.filter((t) => t.status === "canceled").length
  const tripsKm = trips
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + Math.max(0, (Number(t.endKm) || 0) - (Number(t.startKm) || 0)), 0)

  const trucksByStatus = {
    active: trucks.filter((t) => t.status === "active").length,
    maintenance: trucks.filter((t) => t.status === "maintenance").length,
    inactive: trucks.filter((t) => t.status === "inactive").length,
    inRoute: trucks.filter((t) => t.status === "in_route").length,
  }

  const driversByStatus = {
    active: drivers.filter((d) => d.status === "active").length,
    inactive: drivers.filter((d) => d.status === "inactive").length,
    suspended: drivers.filter((d) => d.status === "suspended").length,
    inRoute: drivers.filter((d) => d.status === "in_route").length,
    withApp: drivers.filter((d) => d.hasAppAccess).length,
  }

  const planBreakdown = {
    frotas: realUsers.filter((u) => u.plan_type === "frotas").length,
    basic: realUsers.filter((u) => u.plan_type === "basic").length,
    custom: realUsers.filter((u) => u.plan_type === "custom").length,
    none: realUsers.filter((u) => !u.plan_type).length,
  }

  const now = Date.now()
  const last7d = now - 7 * 24 * 60 * 60 * 1000
  const last30d = now - 30 * 24 * 60 * 60 * 1000

  const usersGrowth = {
    last7d: realUsers.filter((u) => toMillis(u.createdAt) > last7d).length,
    last30d: realUsers.filter((u) => toMillis(u.createdAt) > last30d).length,
  }

  // Top admins por número de caminhões cadastrados
  const trucksByAdmin = new Map<string, number>()
  trucks.forEach((t) => {
    const key = t.adminId || t.userId
    if (key) trucksByAdmin.set(key, (trucksByAdmin.get(key) || 0) + 1)
  })
  const driversByAdmin = new Map<string, number>()
  drivers.forEach((d) => {
    const key = d.adminId || d.userId
    if (key) driversByAdmin.set(key, (driversByAdmin.get(key) || 0) + 1)
  })

  const topAdmins = realUsers
    .map((u) => ({
      id: u.id,
      name: u.name || "—",
      email: u.email || "—",
      company: u.company || "—",
      truckCount: trucksByAdmin.get(u.id) || 0,
      driverCount: driversByAdmin.get(u.id) || 0,
      subscriptionStatus: u.subscription_status || "none",
      planType: u.plan_type || "none",
      maxTrucks: u.max_trucks || 0,
    }))
    .sort((a, b) => b.truckCount - a.truckCount || b.driverCount - a.driverCount)
    .slice(0, 10)

  const recentUsers = [...realUsers]
    .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
    .slice(0, 10)
    .map((u) => ({
      id: u.id,
      name: u.name || "—",
      email: u.email || "—",
      company: u.company || "—",
      subscriptionStatus: u.subscription_status || "none",
      planType: u.plan_type || "none",
      maxTrucks: u.max_trucks || 0,
      createdAt: toMillis(u.createdAt) ? new Date(toMillis(u.createdAt)).toISOString() : null,
    }))

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    overview: {
      totalUsers: realUsers.length,
      activeSubscriptions: activeUsers.length,
      inactiveSubscriptions: inactiveUsers.length,
      noSubscription: noSubUsers.length,
      onboardedUsers: onboardedUsers.length,
      totalCollaborators: activeCollaborators.length,
      totalTrucks: trucks.length,
      totalDrivers: drivers.length,
      totalTrips: trips.length,
      totalTransactions: transactions.length,
      totalMachinery: machinery.length,
      totalRentals: rentals.length,
      totalSuppliers: suppliers.length,
      totalFixedExpenses: fixedExpenses.length,
    },
    revenue: {
      monthlyRecurringRevenue,
      tenantsTotalIncome: totalIncome,
      tenantsTotalExpenses: totalExpenses,
      tenantsNetProfit: totalIncome - totalExpenses,
    },
    users: {
      breakdown: {
        active: activeUsers.length,
        inactive: inactiveUsers.length,
        none: noSubUsers.length,
      },
      planBreakdown,
      growth: usersGrowth,
    },
    trucks: trucksByStatus,
    drivers: driversByStatus,
    trips: {
      active: tripsActive,
      completed: tripsCompleted,
      canceled: tripsCanceled,
      totalKm: tripsKm,
    },
    topAdmins,
    recentUsers,
  })
}
