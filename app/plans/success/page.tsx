"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { CheckCircle2, Loader2, Truck, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

type Status = "verifying" | "activating" | "active" | "error"

export default function PaymentSuccessPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")

  const [status, setStatus] = useState<Status>("verifying")
  const [errorMsg, setErrorMsg] = useState("")
  const verified = useRef(false)

  // 1) Assim que a página carrega, verifica o pagamento diretamente no Stripe
  //    e ativa a assinatura — não depende de webhook chegar a tempo.
  useEffect(() => {
    if (!sessionId || verified.current) return
    verified.current = true

    async function activate() {
      try {
        const res = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`)
        const data = await res.json()

        if (!res.ok) {
          setErrorMsg(data.error ?? "Erro ao verificar pagamento.")
          setStatus("error")
          return
        }

        if (!data.activated) {
          // Pagamento ainda pendente (ex: boleto aguardando compensação)
          setStatus("activating")
          return
        }

        // Assinatura ativada no Firestore — aguarda o onSnapshot do auth-context
        setStatus("activating")
      } catch {
        setErrorMsg("Não foi possível confirmar o pagamento. Tente novamente.")
        setStatus("error")
      }
    }

    activate()
  }, [sessionId])

  // 2) Ativação confirmada (pagamento real) OU grace do boleto ativo →
  //    redireciona para o dashboard.
  useEffect(() => {
    if (isLoading || !user) return
    const hasBoletoGrace =
      !!user.pending_boleto_until && user.pending_boleto_until.getTime() > Date.now()
    if (user.subscription_status === "active" || hasBoletoGrace) {
      router.replace("/dashboard")
    }
  }, [user, isLoading, router])

  // 3) Sem session_id na URL — vai direto para o dashboard se já tem acesso
  useEffect(() => {
    if (sessionId || isLoading || !user) return
    const hasBoletoGrace =
      !!user.pending_boleto_until && user.pending_boleto_until.getTime() > Date.now()
    if (user.subscription_status === "active" || hasBoletoGrace) {
      router.replace("/dashboard")
    } else {
      router.replace("/plans")
    }
  }, [sessionId, isLoading, user, router])

  // --- UI ---

  if (status === "error") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <XCircle className="h-16 w-16 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">Algo deu errado</h1>
            <p className="text-muted-foreground">{errorMsg}</p>
          </div>
          <Button onClick={() => router.push("/plans")} className="w-full">
            Voltar aos planos
          </Button>
        </div>
      </div>
    )
  }

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
            {status === "verifying"
              ? "Verificando seu pagamento no Stripe..."
              : "Ativando sua assinatura..."}
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>
              {status === "verifying"
                ? "Confirmando pagamento..."
                : "Liberando acesso ao painel..."}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Você será redirecionado automaticamente em instantes.
          </p>
        </div>

        {/* Botão manual após 20s caso onSnapshot demore */}
        <ManualRedirectButton onRedirect={() => router.push("/dashboard")} />
      </div>
    </div>
  )
}

function ManualRedirectButton({ onRedirect }: { onRedirect: () => void }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 20_000)
    return () => clearTimeout(t)
  }, [])

  if (!show) return null

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Está demorando mais que o esperado.
      </p>
      <Button onClick={onRedirect} variant="outline" className="w-full">
        Ir para o painel
      </Button>
    </div>
  )
}
