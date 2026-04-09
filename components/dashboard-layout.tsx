"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Truck, Users, DollarSign, BarChart3, LogOut, Menu, X, MapPin, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useTrucks } from "@/hooks/use-trucks"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const { trucks } = useTrucks()

  const maxTrucks = user?.max_trucks || 2
  const truckCount = trucks.length
  const isFull = truckCount >= maxTrucks
  const progress = Math.min(100, (truckCount / maxTrucks) * 100)

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-sidebar transform transition-all duration-300 ease-in-out lg:translate-x-0 outline-none border-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          isMinimized ? "w-20" : "w-72 sm:w-64"
        )}
      >
        <div className="flex h-full flex-col bg-sidebar shadow-2xl border-none">
          {/* Logo Section */}
          <div className={cn("flex h-16 sm:h-20 items-center border-b border-sidebar-border/30", isMinimized ? "justify-center px-0" : "justify-between px-6")}>
            <div className={cn("flex items-center gap-3", isMinimized ? "justify-center" : "")}>
              <div className="p-1.5 rounded-sm bg-primary/10 border border-primary/20 backdrop-blur-sm">
                <img src="/frox.svg" alt="FroX" className="h-7 w-auto" />
              </div>
              {!isMinimized && (
                  <span className="text-sm font-bold text-white leading-none text-nowrap">
                    Controle de Frotas
                  </span>
              )}
            </div>
            {!isMinimized && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white transition-all rounded-lg"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-8 overflow-y-auto space-y-8 scrollbar-hide">
            {/* Group 1: Gerenciamento */}
            <div className="space-y-4">
              {!isMinimized && (
                  <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                    Gerenciamento
                  </p>
              )}
              <div className="space-y-1">
                {[
                  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
                  { name: "Viagens", href: "/trips", icon: MapPin },
                  { name: "Financeiro", href: "/finance", icon: DollarSign },
                ].map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "group relative flex items-center rounded-xl text-sm font-medium transition-all duration-300",
                        isMinimized ? "justify-center h-12 w-12 mx-auto px-0" : "gap-3 px-3 py-2.5",
                        isActive
                          ? "bg-primary/15 text-primary shadow-[0_0_20px_rgba(239,68,68,0.1)] border-l-2 border-primary"
                          : "text-sidebar-foreground/60 hover:text-white hover:bg-white/5"
                      )}
                      title={isMinimized ? item.name : undefined}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className={cn(
                        "transition-transform duration-300 group-hover:scale-110",
                        isMinimized ? "h-6 w-6" : "h-5 w-5",
                        isActive ? "text-primary" : "text-sidebar-foreground/40 group-hover:text-white"
                      )} />
                      {!isMinimized && (
                          <span className="transition-all duration-300">
                            {item.name}
                          </span>
                      )}
                      {isActive && !isMinimized && (
                        <div className="absolute right-3 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Group 2: Cadastros */}
            <div className="space-y-4">
              {!isMinimized && (
                  <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                    Cadastros
                  </p>
              )}
              <div className="space-y-1">
                {[
                  { name: "Caminhões", href: "/trucks", icon: Truck },
                  { name: "Motoristas", href: "/drivers", icon: Users },
                ].map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "group relative flex items-center rounded-xl text-sm font-medium transition-all duration-300",
                        isMinimized ? "justify-center h-12 w-12 mx-auto px-0" : "gap-3 px-3 py-2.5",
                        isActive
                          ? "bg-primary/15 text-primary shadow-[0_0_20px_rgba(239,68,68,0.1)] border-l-2 border-primary"
                          : "text-sidebar-foreground/60 hover:text-white hover:bg-white/5"
                      )}
                      title={isMinimized ? item.name : undefined}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className={cn(
                        "transition-transform duration-300 group-hover:scale-110",
                        isMinimized ? "h-6 w-6" : "h-5 w-5",
                        isActive ? "text-primary" : "text-sidebar-foreground/40 group-hover:text-white"
                      )} />
                      {!isMinimized && (
                          <span className="transition-all duration-300">
                            {item.name}
                          </span>
                      )}
                      {isActive && !isMinimized && (
                        <div className="absolute right-3 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Group 3: Sistema */}
            <div className="space-y-4 pt-4 border-t border-sidebar-border/20">
              <div className="space-y-1">
                {[
                  { name: "Configurações", href: "/settings", icon: Settings },
                ].map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "group relative flex items-center rounded-xl text-sm font-medium transition-all duration-300",
                        isMinimized ? "justify-center h-12 w-12 mx-auto px-0" : "gap-3 px-3 py-2.5",
                        isActive
                          ? "bg-primary/15 text-primary shadow-[0_0_20px_rgba(239,68,68,0.1)] border-l-2 border-primary"
                          : "text-sidebar-foreground/60 hover:text-white hover:bg-white/5"
                      )}
                      title={isMinimized ? item.name : undefined}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className={cn(
                        "transition-transform duration-300 group-hover:scale-110",
                        isMinimized ? "h-6 w-6" : "h-5 w-5",
                        isActive ? "text-primary" : "text-sidebar-foreground/40 group-hover:text-white"
                      )} />
                      {!isMinimized && (
                          <span className="transition-all duration-300">
                            {item.name}
                          </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          </nav>

          {/* Plan Summary Card */}
          {!isMinimized && (
              <div className="px-4 mb-2">
                <div className="bg-white/5 rounded-sm p-4 border border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em]">Plano Atual</span>
                      <span className="text-xs font-black text-white italic tracking-tight underline decoration-primary decoration-2 underline-offset-2">Plano Frotas</span>
                    </div>
                    <Badge className="bg-green-500/10 text-green-500 border-none text-[8px] h-4 font-black uppercase">Ativo</Badge>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-white/50 font-medium">Caminhões em uso</span>
                      <span className={cn("font-black", isFull ? "text-primary" : "text-white")}>
                        {truckCount}/{maxTrucks}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full transition-all duration-500", isFull ? "bg-primary" : "bg-white/40")}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    {isFull && (
                      <p className="text-[9px] text-primary/80 font-bold uppercase tracking-tighter animate-pulse">
                        Capacidade máxima atingida
                      </p>
                    )}
                  </div>

                  <Link href="/plans">
                    <Button variant="default" size="sm" className="w-full text-[10px] font-black uppercase tracking-tighter h-8 bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 border-none transition-all">
                      Trocar Plano
                    </Button>
                  </Link>
                </div>
              </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className={cn("min-h-screen relative flex flex-col transition-all duration-300", isMinimized ? "lg:pl-20" : "lg:pl-64")}>
        {/* Background Layering - Dashboard Specific */}
        <div className="fixed inset-0 bg-background/80 -z-20" />

        {/* Top bar */}
        <div className="sticky top-0 z-30 flex h-14 sm:h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-md px-4 sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
            <span className="sr-only">Abrir menu</span>
          </Button>
          <Button variant="ghost" size="icon" className="hidden lg:flex" onClick={() => setIsMinimized(!isMinimized)}>
            <Menu className="h-6 w-6" />
            <span className="sr-only">Minimizar menu</span>
          </Button>
          <div className="flex-1" />

          {/* User Profile in Header */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-xs font-black uppercase tracking-tight text-foreground/90 leading-none">
                {user?.name || "Usuário"}
              </p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                {user?.company || "FroX Controle"}
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-10 w-10 p-0 rounded-sm bg-primary text-white font-black text-lg shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center cursor-pointer"
                >
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56 mt-1 border-border shadow-2xl rounded-sm p-1">
                <DropdownMenuLabel className="font-black text-[10px] uppercase tracking-wider text-muted-foreground pb-2">{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 h-10 text-xs font-bold px-3 text-red-600 hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700 transition-colors uppercase rounded-sm cursor-pointer mt-1"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4 text-red-600" />
                  Sair da Conta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Dynamic Page Content */}
        <main className="flex-1 relative z-10">
          <div className="p-4 sm:p-6 lg:p-10">{children}</div>
        </main>
      </div>
    </div>
  )
}
