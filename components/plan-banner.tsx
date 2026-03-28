"use client"

import { useAuth } from "@/contexts/auth-context"
import { useTrucks } from "@/hooks/use-trucks"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Truck, Sparkles, ShieldCheck, Zap, RefreshCw } from "lucide-react"
import Link from "next/link"

export function PlanBanner() {
  const { user } = useAuth()
  const { trucks } = useTrucks()

  if (!user || user.subscription_status !== "active") return null

  const isCustom = user.plan_type === "custom"
  const maxTrucks = user.max_trucks ?? (isCustom ? null : 2)
  const usedTrucks = trucks.length
  const remaining = maxTrucks != null ? maxTrucks - usedTrucks : null
  const usagePercent = maxTrucks ? Math.min(100, Math.round((usedTrucks / maxTrucks) * 100)) : 0

  const content = isCustom ? (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-2.5">
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-primary/15 border border-primary/20 backdrop-blur-sm">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-black uppercase tracking-tight italic">Plano Personalizado</span>
          <Badge className="bg-white/10 text-white font-bold border-none text-[7px] h-3.5 uppercase tracking-widest px-1">Ativo</Badge>
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
            {usedTrucks}/{maxTrucks ?? "..."}
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
            Trocar
          </Button>
        </Link>
      </div>
    </div>
  ) : (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-2.5">
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-primary/15 border border-primary/20 backdrop-blur-sm">
          <ShieldCheck className="h-4 w-4 text-primary" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-black uppercase tracking-tight italic leading-none">Plano Básico</span>
          <Badge className="bg-white/10 text-white font-bold border-none text-[7px] h-3.5 uppercase tracking-widest px-1">Ativo</Badge>
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
            {usedTrucks}/{maxTrucks ?? "..."}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6 shrink-0">
        <div className="hidden lg:flex items-center gap-2 text-primary/80">
          <Zap className="h-3.5 w-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Tudo incluso</span>
        </div>
        <Link href="/plans?change=true">
          <Button size="sm" variant="outline" className="h-7 px-3 rounded-sm bg-white/5 border-white/10 hover:bg-white/10 text-white font-bold text-[9px] uppercase tracking-widest transition-all">
             <RefreshCw className="h-3 w-3 mr-1.5" />
             Trocar
          </Button>
        </Link>
      </div>
    </div>
  )

  return (
    <div className="relative overflow-hidden rounded-sm bg-[#0a0a0a] text-white border border-white/10 shadow-xl">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl opacity-50" />
      </div>
      {content}
    </div>
  )
}
