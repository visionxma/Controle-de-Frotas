"use client"

import { useMemo } from "react"
import type { Truck } from "@/hooks/use-trucks"

export type MaintenanceType = "tire" | "oil" | "revision"
export type MaintenanceStatus = "ok" | "warning" | "overdue"

export interface MaintenanceAlert {
  truckId: string
  truckPlate: string
  truckLabel: string
  type: MaintenanceType
  typeLabel: string
  intervalKm: number
  lastServiceKm: number
  currentKm: number
  kmDriven: number // KM rodados desde a última manutenção
  kmRemaining: number // KM até atingir o intervalo (negativo = atrasado)
  progress: number // 0-100+ (% do intervalo já consumido)
  status: MaintenanceStatus
}

const TYPE_LABELS: Record<MaintenanceType, string> = {
  tire: "Pneu",
  oil: "Óleo",
  revision: "Revisão",
}

// Limite a partir do qual exibimos aviso amarelo (ex: 80% do intervalo)
const WARNING_THRESHOLD = 0.8

function buildAlert(
  truck: Truck,
  type: MaintenanceType,
  intervalKm: number | undefined,
  lastServiceKm: number | undefined,
): MaintenanceAlert | null {
  if (!intervalKm || intervalKm <= 0) return null

  const currentKm = truck.mileage || 0
  const lastKm = lastServiceKm || 0
  const kmDriven = Math.max(0, currentKm - lastKm)
  const kmRemaining = intervalKm - kmDriven
  const progress = (kmDriven / intervalKm) * 100

  let status: MaintenanceStatus = "ok"
  if (kmDriven >= intervalKm) status = "overdue"
  else if (kmDriven >= intervalKm * WARNING_THRESHOLD) status = "warning"

  return {
    truckId: truck.id,
    truckPlate: truck.plate,
    truckLabel: `${truck.brand} ${truck.model}`.trim(),
    type,
    typeLabel: TYPE_LABELS[type],
    intervalKm,
    lastServiceKm: lastKm,
    currentKm,
    kmDriven,
    kmRemaining,
    progress,
    status,
  }
}

export function getTruckAlerts(truck: Truck): MaintenanceAlert[] {
  const alerts: MaintenanceAlert[] = []
  const tire = buildAlert(truck, "tire", truck.tireAlertKm, truck.lastTireCheckKm)
  const oil = buildAlert(truck, "oil", truck.oilAlertKm, truck.lastOilChangeKm)
  const revision = buildAlert(truck, "revision", truck.revisionAlertKm, truck.lastRevisionKm)
  if (tire) alerts.push(tire)
  if (oil) alerts.push(oil)
  if (revision) alerts.push(revision)
  return alerts
}

export function useMaintenanceAlerts(trucks: Truck[]) {
  return useMemo(() => {
    const allAlerts: MaintenanceAlert[] = []
    for (const truck of trucks) {
      allAlerts.push(...getTruckAlerts(truck))
    }

    // Pendências = avisos amarelos + atrasados
    const pending = allAlerts.filter((a) => a.status !== "ok")
    const overdue = allAlerts.filter((a) => a.status === "overdue")
    const warnings = allAlerts.filter((a) => a.status === "warning")

    // Ordena: atrasados primeiro (mais negativo primeiro), depois warnings (maior progresso)
    pending.sort((a, b) => {
      if (a.status === "overdue" && b.status !== "overdue") return -1
      if (b.status === "overdue" && a.status !== "overdue") return 1
      return b.progress - a.progress
    })

    return {
      allAlerts,
      pending,
      overdue,
      warnings,
      hasPending: pending.length > 0,
    }
  }, [trucks])
}
