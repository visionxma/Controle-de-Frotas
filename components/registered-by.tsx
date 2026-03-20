"use client"

import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

interface RegisteredByProps {
  className?: string
  userName?: string
}

export function RegisteredBy({ className, userName }: RegisteredByProps) {
  const { user } = useAuth()
  const nameToDisplay = userName || user?.name || "Usuário"
  const initial = nameToDisplay.charAt(0).toUpperCase()

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0">
        <span className="text-[10px] font-black text-zinc-900 dark:text-zinc-100">{initial}</span>
      </div>
      <p className="text-[11px] text-muted-foreground font-medium">
        Registrado por <span className="font-bold text-foreground">{nameToDisplay}</span>
      </p>
    </div>
  )
}
