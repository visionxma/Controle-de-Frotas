"use client"

import { useAuth } from "@/contexts/auth-context"

export function usePermissions() {
  const { user } = useAuth()

  const hasPermission = (permission: "canCreate" | "canRead" | "canUpdate" | "canDelete"): boolean => {
    if (!user) return false
    return user.permissions[permission]
  }

  const hasRole = (role: "admin" | "collaborator"): boolean => {
    if (!user) return false
    return user.role === role
  }

  const isAdmin = (): boolean => {
    return hasRole("admin")
  }

  const isCollaborator = (): boolean => {
    return hasRole("collaborator")
  }

  const canManageTeam = (): boolean => {
    return isAdmin()
  }

  const canAccessSettings = (): boolean => {
    return isAdmin()
  }

  const canViewReports = (): boolean => {
    return hasPermission("canRead")
  }

  const canCreateRecords = (): boolean => {
    return hasPermission("canCreate")
  }

  const canEditRecords = (): boolean => {
    return hasPermission("canUpdate")
  }

  const canDeleteRecords = (): boolean => {
    return hasPermission("canDelete")
  }

  return {
    user,
    hasPermission,
    hasRole,
    isAdmin,
    isCollaborator,
    canManageTeam,
    canAccessSettings,
    canViewReports,
    canCreateRecords,
    canEditRecords,
    canDeleteRecords,
  }
}
