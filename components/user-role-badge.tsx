"use client"

import { Badge } from "@/components/ui/badge"
import { Shield, User } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export function UserRoleBadge() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <Badge variant={user.role === "admin" ? "default" : "secondary"} className="flex items-center gap-1">
      {user.role === "admin" ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
      {user.role === "admin" ? "Administrador" : "Colaborador"}
    </Badge>
  )
}
