"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"

interface PermissionGateProps {
  children: React.ReactNode
  permission: "canCreate" | "canRead" | "canUpdate" | "canDelete"
  fallback?: React.ReactNode
  requireRole?: "admin" | "collaborator"
}

export function PermissionGate({ children, permission, fallback = null, requireRole }: PermissionGateProps) {
  const { user } = useAuth()

  if (!user) {
    return <>{fallback}</>
  }

  // Check role requirement if specified
  if (requireRole && user.role !== requireRole) {
    return <>{fallback}</>
  }

  // Check permission
  if (!user.permissions[permission]) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
