"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export default function HomePage() {
  const { user, isLoading, isAuthenticating } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticating) {
      if (user) {
        console.log("[v0] HomePage - usuário autenticado, redirecionando para dashboard")
        router.push("/dashboard")
      } else {
        console.log("[v0] HomePage - usuário não autenticado, redirecionando para login")
        router.push("/login")
      }
    }
  }, [user, isLoading, isAuthenticating, router])

  if (isLoading || isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">
            {isAuthenticating ? "Autenticando..." : "Carregando..."}
          </p>
        </div>
      </div>
    )
  }

  return null
}
