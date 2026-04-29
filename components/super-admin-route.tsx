"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { isSuperAdminEmail } from "@/lib/admin-config"
import { Loader2 } from "lucide-react"

interface SuperAdminRouteProps {
  children: React.ReactNode
}

export function SuperAdminRoute({ children }: SuperAdminRouteProps) {
  const { user, isLoading, isAuthenticating } = useAuth()
  const router = useRouter()

  const allowed = !!user && (user.isSuperAdmin === true || isSuperAdminEmail(user.email))

  useEffect(() => {
    if (isLoading || isAuthenticating) return
    if (!user) {
      router.push("/login")
      return
    }
    if (!allowed) {
      router.push("/dashboard")
    }
  }, [user, isLoading, isAuthenticating, allowed, router])

  if (isLoading || isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user || !allowed) return null

  return <>{children}</>
}
