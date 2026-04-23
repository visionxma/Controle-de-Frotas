"use client"

import { useAuth } from "@/contexts/auth-context"
import { useTrucks } from "@/hooks/use-trucks"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Sparkles, Zap, RefreshCw, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { getPricePerTruck } from "@/lib/stripe"

export function PlanBanner() {
  const { user } = useAuth()
  const { trucks } = useTrucks()

  if (!user) return null

  // Grace period do boleto: exibe aviso com data limite e CTA para pagar.
  const graceUntil = user.pending_boleto_until
  const hasBoletoGrace =
    !!graceUntil && graceUntil.getTime() > Date.now() && user.subscription_status !== "active"

  if (hasBoletoGrace && graceUntil) {
    const daysLeft = Math.max(0, Math.ceil((graceUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    const dateLabel = graceUntil.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })

    return (
      <div className="relative overflow-hidden rounded-sm bg-amber-500/10 border border-amber-500/30 text-amber-100 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-amber-500/20 border border-amber-500/30">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black uppercase tracking-tight text-amber-300">Aguardando pagamento do boleto</span>
              <span className="text-[11px] text-amber-200/80 font-medium">
                Acesso liberado até <strong>{dateLabel}</strong> ({daysLeft} {daysLeft === 1 ? "dia" : "dias"} restantes). Após essa data, o sistema será bloqueado até a confirmação.
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (user.subscription_status !== "active") return null

  const usedTrucks = trucks.length
  const maxTrucks = Math.max(user.max_trucks || usedTrucks, usedTrucks)
  const usagePercent = maxTrucks > 0 ? Math.min(100, Math.round((usedTrucks / maxTrucks) * 100)) : 0
  const pricePerTruck = getPricePerTruck(maxTrucks)

  return (
    <div className="relative overflow-hidden rounded-sm bg-[#0a0a0a] text-white border border-white/10 shadow-xl">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl opacity-50" />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-2.5">
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-primary/15 border border-primary/20 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black uppercase tracking-tight italic">Plano Frotas</span>
            <Badge className="bg-white/10 text-white font-bold border-none text-[7px] h-3.5 uppercase tracking-widest px-1">Ativo</Badge>
            <span className="text-[10px] text-white/30 font-bold hidden md:inline">
              R${pricePerTruck}/caminhão
            </span>
          </div>
        </div>

        <div className="flex-1 flex items-center gap-4 max-w-sm">
          <div className="flex-1">
            <div className="h-[2px] w-full bg-white/5 overflow-hidden">
              <div
                className={cn("h-full transition-all duration-700", usagePercent >= 100 ? "bg-primary" : "bg-white/40")}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Ocupação</span>
            <span className={cn("text-xs font-black tracking-tighter", usagePercent >= 100 ? "text-primary" : "text-white")}>
              {usedTrucks}/{maxTrucks || "..."}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6 shrink-0">
          <div className="hidden lg:flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Tudo incluso</span>
          </div>
          <Link href="/plans?change=true">
            <Button size="sm" className="h-7 px-4 rounded-sm bg-primary border-none hover:bg-primary/90 text-white font-bold text-[9px] uppercase tracking-widest transition-all shadow-lg shadow-primary/20">
              <RefreshCw className="h-3 w-3 mr-1.5" />
              Ajustar
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
