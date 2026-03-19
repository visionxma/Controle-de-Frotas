"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Truck, CheckCircle2, Loader2, LogOut, Minus, Plus, ArrowLeft, Star } from "lucide-react"
import { toast } from "sonner"

const CUSTOM_PRICE_PER_TRUCK = 20
const BASIC_PRICE = 39
const BASIC_MAX_TRUCKS = 2
const CUSTOM_MIN_TRUCKS = 3

function PlansPageContent() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isChanging = searchParams.get("change") === "true"

  const [customTruckCount, setCustomTruckCount] = useState(CUSTOM_MIN_TRUCKS)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState<"basic" | "custom" | null>(null)
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "not_found" | "error">("idle")
  const [syncError, setSyncError] = useState("")

  // Inicializa o contador de caminhões com o valor atual do usuário
  useEffect(() => {
    if (user?.plan_type === "custom" && user.max_trucks) {
      setCustomTruckCount(Math.max(CUSTOM_MIN_TRUCKS, user.max_trucks))
    }
  }, [user?.plan_type, user?.max_trucks])

  // Se já tem assinatura ativa e NÃO está trocando de plano, vai para o dashboard
  useEffect(() => {
    if (!isLoading && user?.subscription_status === "active" && !isChanging) {
      router.replace("/dashboard")
    }
  }, [user, isLoading, router, isChanging])

  // Se não está autenticado, vai para login
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login")
    }
  }, [user, isLoading, router])

  // Fallback: verifica assinatura no Stripe (apenas quando não está em modo troca)
  useEffect(() => {
    if (isLoading || !user || user.subscription_status === "active" || isChanging) return

    setSyncStatus("syncing")

    fetch(`/api/stripe/sync-subscription?userId=${user.id}&email=${encodeURIComponent(user.email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.activated) {
          toast.success("Assinatura encontrada! Redirecionando...")
        } else if (data.error) {
          setSyncError(data.error)
          setSyncStatus("error")
        } else {
          setSyncStatus("not_found")
        }
      })
      .catch((err) => {
        setSyncError(err?.message ?? "Falha ao verificar pagamento")
        setSyncStatus("error")
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, user?.id, isChanging])

  const handleRetrySync = () => {
    if (!user) return
    setSyncStatus("syncing")
    setSyncError("")
    fetch(`/api/stripe/sync-subscription?userId=${user.id}&email=${encodeURIComponent(user.email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.activated) {
          toast.success("Assinatura encontrada! Redirecionando...")
        } else if (data.error) {
          setSyncError(data.error)
          setSyncStatus("error")
        } else {
          setSyncStatus("not_found")
        }
      })
      .catch((err) => {
        setSyncError(err?.message ?? "Falha ao verificar pagamento")
        setSyncStatus("error")
      })
  }

  const customTotal = customTruckCount * CUSTOM_PRICE_PER_TRUCK

  const handleSelectPlan = async (planType: "basic" | "custom") => {
    if (!user) return

    setLoadingPlan(planType)

    try {
      // Se está trocando de plano (já tem assinatura ativa), usa update-subscription
      if (isChanging && user.subscription_status === "active") {
        const body: Record<string, unknown> = { userId: user.id, planType }
        if (planType === "custom") body.truckCount = customTruckCount

        const response = await fetch("/api/stripe/update-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Erro ao atualizar plano")
        }

        toast.success("Plano atualizado com sucesso!")
        router.push("/dashboard")
        return
      }

      // Novo assinante: cria checkout session no Stripe
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
      const msg = error instanceof Error ? error.message : "Tente novamente."
      toast.error(isChanging ? `Não foi possível atualizar o plano. ${msg}` : "Não foi possível redirecionar para o pagamento. Tente novamente.")
      setLoadingPlan(null)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const isCurrentPlan = (planType: "basic" | "custom") => {
    if (!isChanging) return false
    return user?.plan_type === planType
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
        <div className="flex items-center gap-3">
          {isChanging && (
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="mr-1">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">FroX</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user.name} — {user.company}
            </span>
          )}
          {!isChanging && (
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Banner de sincronização (apenas quando não está em modo troca) */}
        {!isChanging && syncStatus === "syncing" && (
          <div className="mb-8 flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            Verificando se você já possui um pagamento aprovado...
          </div>
        )}

        {!isChanging && syncStatus === "error" && (
          <div className="mb-8 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
            <p className="font-medium text-destructive mb-1">Erro ao verificar pagamento</p>
            <p className="text-muted-foreground mb-2">{syncError}</p>
            <Button variant="outline" size="sm" onClick={handleRetrySync}>
              Tentar novamente
            </Button>
          </div>
        )}

        {!isChanging && syncStatus === "not_found" && (
          <div className="mb-8 rounded-lg border bg-muted/50 px-4 py-3 text-sm text-muted-foreground flex items-center justify-between gap-4">
            <span>Nenhuma assinatura ativa encontrada. Escolha um plano abaixo para continuar.</span>
            <Button variant="ghost" size="sm" onClick={handleRetrySync} className="shrink-0">
              Verificar novamente
            </Button>
          </div>
        )}

        {/* Banner de troca de plano */}
        {isChanging && user?.plan_type && (
          <div className="mb-8 rounded-lg border bg-muted/50 px-4 py-3 text-sm text-muted-foreground flex items-center gap-3">
            <Star className="h-4 w-4 shrink-0 text-primary" />
            <span>
              Você está no <strong>{user.plan_type === "basic" ? "Plano Básico" : "Plano Personalizado"}</strong>.
              Escolha abaixo o novo plano desejado.
            </span>
          </div>
        )}

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3">
            {isChanging ? "Trocar de plano" : "Escolha seu plano"}
          </h1>
          <p className="text-muted-foreground text-lg">
            {isChanging
              ? "Selecione o novo plano para a sua frota. A mudança é imediata."
              : "Selecione o plano ideal para a sua frota. Cancele a qualquer momento."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plano Básico */}
          <Card className={`relative border-2 transition-colors ${isCurrentPlan("basic") ? "border-primary bg-primary/5" : "hover:border-primary"}`}>
            {isCurrentPlan("basic") && (
              <div className="absolute -top-3 left-6">
                <Badge className="px-3 py-1 bg-primary text-primary-foreground">Plano atual</Badge>
              </div>
            )}
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
                variant={isCurrentPlan("basic") ? "outline" : "default"}
                onClick={() => handleSelectPlan("basic")}
                disabled={loadingPlan !== null || isCurrentPlan("basic")}
              >
                {loadingPlan === "basic" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : isCurrentPlan("basic") ? (
                  "Plano atual"
                ) : isChanging ? (
                  "Trocar para Plano Básico"
                ) : (
                  "Assinar Plano Básico"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Plano Personalizado */}
          <Card className={`relative border-2 transition-colors ${isCurrentPlan("custom") ? "border-primary bg-primary/5" : "border-primary shadow-lg"}`}>
            {isCurrentPlan("custom") ? (
              <div className="absolute -top-3 left-6">
                <Badge className="px-3 py-1 bg-primary text-primary-foreground">Plano atual</Badge>
              </div>
            ) : (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="px-3 py-1">Mais popular</Badge>
              </div>
            )}
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
                variant={isCurrentPlan("custom") && customTruckCount === user?.max_trucks ? "outline" : "default"}
                onClick={() => handleSelectPlan("custom")}
                disabled={
                  loadingPlan !== null ||
                  (isCurrentPlan("custom") && customTruckCount === user?.max_trucks)
                }
              >
                {loadingPlan === "custom" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : isCurrentPlan("custom") && customTruckCount === user?.max_trucks ? (
                  "Plano atual"
                ) : isChanging ? (
                  `Trocar para ${customTruckCount} caminhões — R$${customTotal}/mês`
                ) : (
                  `Assinar por R$${customTotal}/mês`
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          {isChanging
            ? "A mudança de plano é aplicada imediatamente. O valor é ajustado proporcionalmente."
            : "Pagamento seguro processado pelo Stripe. Cancele a qualquer momento pelo suporte."}
        </p>
      </div>
    </div>
  )
}

export default function PlansPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <PlansPageContent />
    </Suspense>
  )
}
