"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Truck, CheckCircle2, Loader2, LogOut, Minus, Plus, ArrowLeft, Star, TrendingDown } from "lucide-react"
import { toast } from "sonner"
import { PRICE_TIERS, getPricePerTruck, getMonthlyTotal } from "@/lib/stripe"

const MIN_TRUCKS = 1

function PlansPageContent() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isChanging = searchParams.get("change") === "true"

  const [truckCount, setTruckCount] = useState(1)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "not_found" | "error">("idle")
  const [syncError, setSyncError] = useState("")

  // Inicializa o contador com o valor atual do usuário
  useEffect(() => {
    if (user?.max_trucks) {
      setTruckCount(Math.max(MIN_TRUCKS, user.max_trucks))
    }
  }, [user?.max_trucks])

  // Se já tem assinatura ativa e NÃO está trocando, vai para o dashboard
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

  // Fallback: verifica assinatura no Stripe
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

  const pricePerTruck = getPricePerTruck(truckCount)
  const monthlyTotal = getMonthlyTotal(truckCount)
  const isSameAsCurrentPlan = isChanging && user?.max_trucks === truckCount

  const handleSubscribe = async () => {
    if (!user) return

    setIsProcessing(true)

    try {
      // Se está trocando de plano (já tem assinatura ativa), usa update-subscription
      if (isChanging && user.subscription_status === "active") {
        const response = await fetch("/api/stripe/update-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, truckCount }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Erro ao atualizar plano")
        }

        toast.success("Plano atualizado com sucesso!")
        router.push("/dashboard")
        return
      }

      // Novo assinante: cria checkout session
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          truckCount,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Erro ao criar sessão de pagamento")
      }

      setIsRedirecting(true)
      window.location.href = data.url
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Tente novamente."
      toast.error(`Não foi possível processar. ${msg}`)
      setIsProcessing(false)
    }
  }

  const handleLogout = () => {
    logout()
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
    <div className="min-h-screen bg-background/50">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <img src="/frox.svg" alt="FroX" className="h-7 w-auto" />
            </div>
            {isChanging && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
                className="rounded-2xl hover:bg-primary/5 hover:text-primary font-bold transition-all px-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Sistema
              </Button>
            )}
          </div>
          <div className="flex items-center gap-6">
            {user && (
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-xs font-bold text-foreground leading-tight uppercase tracking-wider">{user.name}</span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{user.company}</span>
              </div>
            )}
            {!isChanging && (
              <Button variant="ghost" size="sm" onClick={handleLogout} className="rounded-2xl text-muted-foreground hover:text-red-500 font-bold">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-3xl mx-auto px-6 py-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        {/* Banners de sincronização */}
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
            <span>Nenhuma assinatura ativa encontrada. Configure seu plano abaixo para continuar.</span>
            <Button variant="ghost" size="sm" onClick={handleRetrySync} className="shrink-0">
              Verificar novamente
            </Button>
          </div>
        )}

        {/* Banner de troca */}
        {isChanging && user?.max_trucks && (
          <div className="mb-8 rounded-lg border bg-muted/50 px-4 py-3 text-sm text-muted-foreground flex items-center gap-3">
            <Star className="h-4 w-4 shrink-0 text-primary" />
            <span>
              Você tem atualmente <strong>{user.max_trucks} caminhões</strong> no seu plano.
              Ajuste a quantidade abaixo.
            </span>
          </div>
        )}

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3">
            {isChanging ? "Ajustar plano" : "Plano Frotas"}
          </h1>
          <p className="text-muted-foreground text-lg">
            {isChanging
              ? "Ajuste a quantidade de caminhões. A mudança é imediata."
              : "Pague por caminhão. Quanto maior a frota, menor o preço por unidade."}
          </p>
        </div>

        {/* Card único do plano */}
        <Card className="relative border-2 border-primary shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Plano Frotas</CardTitle>
              <Badge variant="outline" className="flex items-center gap-1">
                <TrendingDown className="h-3 w-3" />
                Desconto por volume
              </Badge>
            </div>
            <CardDescription>Tudo incluso. O preço por caminhão diminui conforme sua frota cresce.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Seletor de caminhões */}
            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <p className="text-sm font-medium text-center">Quantos caminhões você possui?</p>
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setTruckCount((c) => Math.max(MIN_TRUCKS, c - 1))}
                  disabled={truckCount <= MIN_TRUCKS}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-4xl font-bold w-20 text-center">{truckCount}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setTruckCount((c) => c + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                {truckCount} {truckCount === 1 ? "caminhão" : "caminhões"} × R${pricePerTruck},00 por caminhão
              </p>
            </div>

            {/* Preço total */}
            <div className="text-center">
              <span className="text-5xl font-bold">R${monthlyTotal}</span>
              <span className="text-muted-foreground text-lg">/mês</span>
              {pricePerTruck < 120 && (
                <p className="text-sm text-green-600 font-medium mt-1">
                  Economia de R${(120 - pricePerTruck) * truckCount}/mês vs. preço cheio
                </p>
              )}
            </div>

            {/* Tabela de faixas */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Faixa</th>
                    <th className="px-4 py-2 text-right font-medium text-muted-foreground">Preço/caminhão</th>
                  </tr>
                </thead>
                <tbody>
                  {PRICE_TIERS.map((tier, i) => {
                    const isActive = truckCount >= tier.min && truckCount <= tier.max
                    return (
                      <tr key={i} className={isActive ? "bg-primary/10 font-bold" : ""}>
                        <td className="px-4 py-2 border-t">
                          {tier.max === Infinity ? `${tier.min}+ caminhões` : `${tier.min} a ${tier.max} caminhões`}
                          {isActive && <Badge className="ml-2 text-[8px] py-0 px-1.5">Sua faixa</Badge>}
                        </td>
                        <td className="px-4 py-2 border-t text-right">R${tier.pricePerTruck},00</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Features */}
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                Cadastro e controle de caminhões
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
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                App mobile para motoristas
              </li>
            </ul>

            {/* Botão */}
            <Button
              className="w-full h-12 text-base"
              onClick={handleSubscribe}
              disabled={isProcessing || isSameAsCurrentPlan}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : isSameAsCurrentPlan ? (
                "Plano atual"
              ) : isChanging ? (
                `Atualizar para ${truckCount} caminhões — R$${monthlyTotal}/mês`
              ) : (
                `Assinar por R$${monthlyTotal}/mês`
              )}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-8">
          {isChanging
            ? "A mudança é aplicada imediatamente. O valor é ajustado proporcionalmente."
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
