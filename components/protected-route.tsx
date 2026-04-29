"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticating } = useAuth()
  const router = useRouter()

  // Acesso durante grace de 5 dias do boleto: pending_boleto_until no futuro
  // libera o sistema mesmo com subscription_status === "incomplete".
  const hasBoletoGrace =
    !!user?.pending_boleto_until && user.pending_boleto_until.getTime() > Date.now()
  const canAccess = user?.subscription_status === "active" || hasBoletoGrace
  const isSuperAdmin = user?.isSuperAdmin === true

  useEffect(() => {
    if (isLoading || isAuthenticating) return

    if (!user) {
      router.push("/login")
      return
    }

    if (user.role !== "admin") {
      router.push("/login")
      return
    }

    // Super-admin não tem assinatura — redireciona para o painel global
    if (isSuperAdmin) {
      router.push("/admin")
      return
    }

    if (!canAccess) {
      router.push("/plans")
    }
  }, [user, isLoading, isAuthenticating, router, canAccess, isSuperAdmin])

  if (isLoading || isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">{isAuthenticating ? "Autenticando..." : "Carregando..."}</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== "admin" || isSuperAdmin || !canAccess) {
    return null
  }

  return <>{children}</>
}
