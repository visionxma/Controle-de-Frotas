"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface RoleBasedRouteProps {
  children: React.ReactNode
  allowedRoles: ("admin" | "collaborator")[]
  redirectTo?: string
  fallback?: React.ReactNode
}

export function RoleBasedRoute({ children, allowedRoles, redirectTo = "/dashboard", fallback }: RoleBasedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user && !allowedRoles.includes(user.role)) {
      console.log(`[v0] RoleBasedRoute - usuário ${user.role} não tem acesso, redirecionando para ${redirectTo}`)
      router.push(redirectTo)
    }
  }, [user, isLoading, allowedRoles, redirectTo, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
