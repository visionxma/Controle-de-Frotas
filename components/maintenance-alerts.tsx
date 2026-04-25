"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Bell, Wrench, Droplet, CircleDot, ChevronRight } from "lucide-react"
import { useTrucks } from "@/hooks/use-trucks"
import {
  useMaintenanceAlerts,
  type MaintenanceAlert,
  type MaintenanceType,
} from "@/hooks/use-maintenance-alerts"
import { cn } from "@/lib/utils"

const TYPE_ICONS: Record<MaintenanceType, typeof Wrench> = {
  tire: CircleDot,
  oil: Droplet,
  revision: Wrench,
}

function formatKm(value: number) {
  return value.toLocaleString("pt-BR")
}

interface AlertRowProps {
  alert: MaintenanceAlert
  onOpenTruck: (truckId: string) => void
}

function AlertRow({ alert, onOpenTruck }: AlertRowProps) {
  const Icon = TYPE_ICONS[alert.type]
  const isOverdue = alert.status === "overdue"

  const colorClasses = isOverdue
    ? {
        bar: "bg-red-500",
        bg: "bg-red-500/5",
        border: "border-red-500/20",
        iconBg: "bg-red-500/10",
        iconColor: "text-red-600",
        progress: "bg-red-500",
        badge: "bg-red-500 text-white",
        badgeText: "Atrasado",
      }
    : {
        bar: "bg-amber-500",
        bg: "bg-amber-500/5",
        border: "border-amber-500/20",
        iconBg: "bg-amber-500/10",
        iconColor: "text-amber-600",
        progress: "bg-amber-500",
        badge: "bg-amber-500 text-white",
        badgeText: "Próximo",
      }

  const progressClamped = Math.min(100, alert.progress)
  const remainingLabel = isOverdue
    ? `Atrasado em ${formatKm(Math.abs(alert.kmRemaining))} KM`
    : `Faltam ${formatKm(alert.kmRemaining)} KM`

  return (
    <button
      type="button"
      onClick={() => onOpenTruck(alert.truckId)}
      className={cn(
        "group w-full text-left flex items-stretch overflow-hidden rounded-2xl border transition-all hover:shadow-md hover:scale-[1.005]",
        colorClasses.bg,
        colorClasses.border,
      )}
    >
      <div className={cn("w-1 flex-shrink-0", colorClasses.bar)} />
      <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={cn("p-3 rounded-sm flex-shrink-0", colorClasses.iconBg)}>
            <Icon className={cn("h-5 w-5", colorClasses.iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-black uppercase tracking-tight">
                {alert.typeLabel} — {alert.truckPlate}
              </span>
              <Badge className={cn("text-[9px] font-black uppercase tracking-widest h-5 rounded-full px-2", colorClasses.badge)}>
                {colorClasses.badgeText}
              </Badge>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight truncate">
              {alert.truckLabel}
            </p>

            <div className="mt-3 space-y-1.5">
              <div className="h-1.5 w-full bg-foreground/5 rounded-full overflow-hidden">
                <div
                  className={cn("h-full transition-all", colorClasses.progress)}
                  style={{ width: `${progressClamped}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-muted-foreground">
                  {formatKm(alert.kmDriven)} / {formatKm(alert.intervalKm)} KM
                </span>
                <span className={isOverdue ? "text-red-600" : "text-amber-600"}>{remainingLabel}</span>
              </div>
            </div>
          </div>
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform hidden sm:block" />
      </div>
    </button>
  )
}

export function MaintenanceAlerts() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { trucks } = useTrucks()
  const { pending, overdue, warnings } = useMaintenanceAlerts(trucks)

  const handleOpenTruck = (truckId: string) => {
    // Navega para a página de caminhões com o modal aberto na aba Manutenção
    const params = new URLSearchParams()
    params.set("truckId", truckId)
    params.set("tab", "maintenance")
    router.push(`/trucks?${params.toString()}`)
  }

  const hasAnyConfig = trucks.some(
    (t) => (t.tireAlertKm ?? 0) > 0 || (t.oilAlertKm ?? 0) > 0 || (t.revisionAlertKm ?? 0) > 0,
  )

  return (
    <Card className="rounded-[2.5rem] border-border/40 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
      <CardHeader className="responsive-card-padding">
        <CardTitle className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2.5 rounded-sm",
              overdue.length > 0 ? "bg-red-500/10" : warnings.length > 0 ? "bg-amber-500/10" : "bg-primary/10"
            )}>
              <Bell className={cn(
                "h-5 w-5",
                overdue.length > 0 ? "text-red-600" : warnings.length > 0 ? "text-amber-600" : "text-primary"
              )} />
            </div>
            <div>
              <span className="text-base sm:text-lg font-black uppercase tracking-tight">Alertas de Manutenção</span>
              <p className="text-[10px] font-medium text-muted-foreground normal-case">
                Pneu, óleo e revisão por caminhão
              </p>
            </div>
          </div>

          {pending.length > 0 && (
            <div className="flex items-center gap-2">
              {overdue.length > 0 && (
                <Badge className="bg-red-500 text-white text-[10px] font-black uppercase rounded-full px-3 h-6">
                  {overdue.length} Atrasado{overdue.length > 1 ? "s" : ""}
                </Badge>
              )}
              {warnings.length > 0 && (
                <Badge className="bg-amber-500 text-white text-[10px] font-black uppercase rounded-full px-3 h-6">
                  {warnings.length} Próximo{warnings.length > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="responsive-card-padding pt-0">
        {!hasAnyConfig ? (
          <div className="text-center py-10 bg-muted/5 rounded-2xl border-2 border-dashed border-border/20">
            <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-bold text-foreground/80 mb-1">Nenhum alerta configurado</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Configure os intervalos de manutenção (pneu, óleo, revisão) ao editar cada caminhão
              para receber alertas baseados na quilometragem.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/trucks")}
              className="mt-4 rounded-2xl h-9 font-bold text-xs"
            >
              Configurar Caminhões
            </Button>
          </div>
        ) : pending.length === 0 ? (
          <div className="text-center py-10 bg-emerald-500/5 rounded-2xl border-2 border-dashed border-emerald-500/20">
            <div className="p-3 bg-emerald-500/10 rounded-full inline-block mb-3">
              <Wrench className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-1">
              Toda a frota em dia
            </p>
            <p className="text-xs text-muted-foreground">
              Nenhuma manutenção próxima do limite no momento.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((alert) => (
              <AlertRow
                key={`${alert.truckId}-${alert.type}`}
                alert={alert}
                onOpenTruck={handleOpenTruck}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
