"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Truck, CheckCircle2, Loader2, LogOut, Minus, Plus } from "lucide-react"
import { toast } from "sonner"

const CUSTOM_PRICE_PER_TRUCK = 20
const BASIC_PRICE = 39
const BASIC_MAX_TRUCKS = 2
const CUSTOM_MIN_TRUCKS = 3

export default function PlansPage() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()

  const [customTruckCount, setCustomTruckCount] = useState(CUSTOM_MIN_TRUCKS)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState<"basic" | "custom" | null>(null)

  // Se já tem assinatura ativa, vai para o dashboard
  useEffect(() => {
    if (!isLoading && user?.subscription_status === "active") {
      router.replace("/dashboard")
    }
  }, [user, isLoading, router])

  // Se não está autenticado, vai para login
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login")
    }
  }, [user, isLoading, router])

  const customTotal = customTruckCount * CUSTOM_PRICE_PER_TRUCK

  const handleSelectPlan = async (planType: "basic" | "custom") => {
    if (!user) return

    setLoadingPlan(planType)

    try {
      const body: Record<string, unknown> = {
        userId: user.id,
        userEmail: user.email,
        planType,
      }

      if (planType === "custom") {
        body.truckCount = customTruckCount
      }

      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Erro ao criar sessão de pagamento")
      }

      setIsRedirecting(true)
      window.location.href = data.url
    } catch (error) {
      toast.error("Não foi possível redirecionar para o pagamento. Tente novamente.")
      setLoadingPlan(null)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isRedirecting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Redirecionando para o pagamento...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">Gestão de Frotas</span>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user.name} — {user.company}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3">Escolha seu plano</h1>
          <p className="text-muted-foreground text-lg">
            Selecione o plano ideal para a sua frota. Cancele a qualquer momento.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plano Básico */}
          <Card className="relative border-2 hover:border-primary transition-colors">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Plano Básico</CardTitle>
                <Badge variant="secondary">Até 2 caminhões</Badge>
              </div>
              <CardDescription>Ideal para pequenas frotas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <span className="text-4xl font-bold">R${BASIC_PRICE}</span>
                <span className="text-muted-foreground">/mês</span>
              </div>

              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  Até {BASIC_MAX_TRUCKS} caminhões cadastrados
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  Controle de viagens e motoristas
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  Financeiro e relatórios em PDF
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  Envio de fotos das viagens
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  Acesso para equipe (colaboradores)
                </li>
              </ul>

              <Button
                className="w-full"
                onClick={() => handleSelectPlan("basic")}
                disabled={loadingPlan !== null}
              >
                {loadingPlan === "basic" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Assinar Plano Básico"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Plano Personalizado */}
          <Card className="relative border-2 border-primary shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="px-3 py-1">Mais popular</Badge>
            </div>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Plano Personalizado</CardTitle>
                <Badge variant="outline">R$20/caminhão</Badge>
              </div>
              <CardDescription>Escala conforme sua frota cresce</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Seletor de caminhões */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-center">Quantos caminhões você possui?</p>
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCustomTruckCount((c) => Math.max(CUSTOM_MIN_TRUCKS, c - 1))}
                    disabled={customTruckCount <= CUSTOM_MIN_TRUCKS}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-3xl font-bold w-16 text-center">{customTruckCount}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCustomTruckCount((c) => c + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  {customTruckCount} caminhão(ões) × R${CUSTOM_PRICE_PER_TRUCK},00
                </p>
              </div>

              <div className="text-center">
                <span className="text-4xl font-bold">R${customTotal}</span>
                <span className="text-muted-foreground">/mês</span>
              </div>

              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  <strong>{customTruckCount} caminhões</strong>&nbsp;cadastrados
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  Controle de viagens e motoristas
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  Financeiro e relatórios em PDF
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  Envio de fotos das viagens
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  Acesso para equipe (colaboradores)
                </li>
              </ul>

              <Button
                className="w-full"
                onClick={() => handleSelectPlan("custom")}
                disabled={loadingPlan !== null}
              >
                {loadingPlan === "custom" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  `Assinar por R$${customTotal}/mês`
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Pagamento seguro processado pelo Stripe. Cancele a qualquer momento pelo suporte.
        </p>
      </div>
    </div>
  )
}
