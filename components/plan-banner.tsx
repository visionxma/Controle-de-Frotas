"use client"

import { useAuth } from "@/contexts/auth-context"
import { useTrucks } from "@/hooks/use-trucks"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Truck, Sparkles, ShieldCheck, Zap, RefreshCw } from "lucide-react"
import Link from "next/link"

export function PlanBanner() {
  const { user } = useAuth()
  const { trucks } = useTrucks()

  if (!user || user.subscription_status !== "active") return null

  const isCustom = user.plan_type === "custom"
  const maxTrucks = user.max_trucks ?? 2
  const usedTrucks = trucks.length
  const remaining = maxTrucks - usedTrucks
  const usagePercent = Math.min(100, Math.round((usedTrucks / maxTrucks) * 100))

  if (isCustom) {
    return (
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground shadow-lg">
        {/* Decoração de fundo */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 right-32 h-32 w-32 rounded-full bg-white/5" />
          <div className="absolute bottom-0 left-1/3 h-20 w-20 rounded-full bg-white/5" />
        </div>

        <div className="relative flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          {/* Esquerda: identificação do plano */}
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold leading-tight">Plano Personalizado</span>
                <Badge className="bg-white/20 text-primary-foreground hover:bg-white/30 border-0 text-xs">
                  Ativo
                </Badge>
              </div>
              <p className="text-sm text-primary-foreground/75 mt-0.5">
                R${maxTrucks * 20}/mês · R$20 por caminhão
              </p>
            </div>
          </div>

          {/* Centro: barra de uso */}
          <div className="flex-1 sm:max-w-xs">
            <div className="flex items-center justify-between text-xs text-primary-foreground/80 mb-1.5">
              <span className="flex items-center gap-1">
                <Truck className="h-3 w-3" />
                Caminhões em uso
              </span>
              <span className="font-semibold">
                {usedTrucks}/{maxTrucks}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <p className="text-xs text-primary-foreground/70 mt-1.5">
              {remaining > 0
                ? `${remaining} vaga${remaining !== 1 ? "s" : ""} disponível${remaining !== 1 ? "is" : ""}`
                : "Capacidade máxima atingida"}
            </p>
          </div>

          {/* Direita: destaque do limite + botão trocar */}
          <div className="flex items-center gap-3 sm:text-right">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <span className="text-2xl font-black leading-none">{maxTrucks}</span>
            </div>
            <div className="text-sm">
              <p className="font-semibold leading-tight">caminhões</p>
              <p className="text-primary-foreground/70 text-xs">contratados</p>
            </div>
            <Button
              asChild
              size="sm"
              variant="secondary"
              className="ml-2 bg-white/20 hover:bg-white/30 text-primary-foreground border-0 shrink-0"
            >
              <Link href="/plans?change=true">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Trocar plano
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Plano Básico
  return (
    <div className="relative overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-primary/5" />
        <div className="absolute -bottom-4 left-1/4 h-20 w-20 rounded-full bg-primary/5" />
      </div>

      <div className="relative flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        {/* Esquerda: identificação do plano */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold leading-tight">Plano Básico</span>
              <Badge variant="secondary" className="text-xs">Ativo</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              R$39/mês · até 2 caminhões
            </p>
          </div>
        </div>

        {/* Centro: barra de uso */}
        <div className="flex-1 sm:max-w-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span className="flex items-center gap-1">
              <Truck className="h-3 w-3" />
              Caminhões em uso
            </span>
            <span className="font-semibold text-foreground">
              {usedTrucks}/{maxTrucks}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {remaining > 0
              ? `${remaining} vaga${remaining !== 1 ? "s" : ""} disponível${remaining !== 1 ? "is" : ""}`
              : "Capacidade máxima atingida"}
          </p>
        </div>

        {/* Direita */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div className="text-sm">
            <p className="font-semibold leading-tight">Tudo incluso</p>
            <p className="text-muted-foreground text-xs">viagens, fotos, financeiro</p>
          </div>
          <Button asChild size="sm" variant="outline" className="ml-2 shrink-0">
            <Link href="/plans?change=true">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Trocar plano
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
