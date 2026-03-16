"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { CheckCircle2, Loader2, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PaymentSuccessPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [secondsWaited, setSecondsWaited] = useState(0)

  // O onSnapshot no auth-context vai detectar quando o webhook ativar a assinatura e
  // atualizar user.subscription_status para "active" automaticamente.
  useEffect(() => {
    if (!isLoading && user?.subscription_status === "active") {
      router.replace("/dashboard")
    }
  }, [user, isLoading, router])

  // Contador de segundos aguardando (para mostrar feedback ao usuário)
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsWaited((s) => s + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Se demorar mais de 30s sem ativar, permite ir para o dashboard manualmente
  const showManualButton = secondsWaited >= 30

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <Truck className="h-16 w-16 text-primary" />
            <CheckCircle2 className="h-7 w-7 text-green-500 absolute -bottom-1 -right-1 bg-background rounded-full" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-2">Pagamento confirmado!</h1>
          <p className="text-muted-foreground">
            Seu pagamento foi aprovado pelo Stripe. Estamos ativando sua assinatura...
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Aguardando confirmação do pagamento...</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Você será redirecionado automaticamente para o painel em instantes.
          </p>
        </div>

        {showManualButton && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Está demorando mais que o esperado. Tente acessar o painel manualmente:
            </p>
            <Button onClick={() => router.push("/dashboard")} variant="outline" className="w-full">
              Ir para o painel
            </Button>
            <p className="text-xs text-muted-foreground">
              Se o acesso for negado, aguarde mais alguns minutos e tente novamente.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
