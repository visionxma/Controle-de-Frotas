"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const [resetEmail, setResetEmail] = useState("")
  const [isResetLoading, setIsResetLoading] = useState(false)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)

  const { login, resetPassword, isAuthenticating, isLoading } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (isAuthenticating) return

    const success = await login(email, password)

    if (success) {
      toast.success("Login realizado com sucesso!")
      router.push("/dashboard")
    } else {
      setError("Credenciais inválidas ou você não tem permissão para acessar esta versão")
      toast.error("Acesso negado. Apenas administradores podem acessar a versão web.")
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetEmail.trim()) {
      toast.error("Digite o email do administrador")
      return
    }

    setIsResetLoading(true)
    const success = await resetPassword(resetEmail)

    if (success) {
      toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.")
      setIsResetDialogOpen(false)
      setResetEmail("")
    } else {
      toast.error("Erro ao enviar email de recuperação. Verifique se o email está correto.")
    }
    setIsResetLoading(false)
  }

  // Se ainda estiver carregando o estado de autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a0a] relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse delay-700" />
      
      <div className="absolute inset-0 bg-[url('https://www.sofit4.com.br/wp-content/uploads/direcao-defensiva-para-caminhoes-sofit.jpg')] bg-cover bg-center opacity-20 grayscale" />

      <Card className="relative z-10 w-full max-w-md shadow-2xl rounded-[2.5rem] border border-white/10 backdrop-blur-xl bg-white/95 dark:bg-black/80 animate-in fade-in zoom-in-95 duration-700 overflow-hidden">
        <CardHeader className="text-center space-y-6 pt-10 px-8">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/5 rounded-[2rem] shadow-inner">
              <img src="/frox.svg" alt="FroX" className="h-10 w-auto" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-extrabold tracking-tight uppercase">Bem-vindo</CardTitle>
            <CardDescription className="text-sm font-medium text-muted-foreground/80">
              Acesse sua conta para gerenciar sua frota
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">
                E-mail de acesso
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="exemplo@frox.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={isAuthenticating}
                required
                className="h-12 bg-background border-border/40 rounded-2xl focus-visible:ring-primary/20 shadow-sm transition-all text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">
                Sua Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={isAuthenticating}
                  required
                  className="h-12 bg-background border-border/40 rounded-2xl focus-visible:ring-primary/20 shadow-sm transition-all pr-12 text-base"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-primary transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isAuthenticating}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-destructive text-xs font-bold text-center bg-destructive/10 p-3 rounded-xl border border-destructive/20 animate-in fade-in slide-in-from-top-2">
                {error}
              </p>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] mt-2" 
              disabled={isAuthenticating || !email || !password}
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                "Entrar no Sistema"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="link" className="text-xs text-muted-foreground hover:text-primary font-medium transition-colors" disabled={isAuthenticating}>
                  Esqueci minha senha
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2.5rem]">
                <DialogHeader>
                  <DialogTitle>Recuperar Senha</DialogTitle>
                  <DialogDescription>Digite seu email para receber um link de recuperação de senha.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleResetPassword} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="resetEmail" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">Para qual email?</Label>
                    <Input
                      id="resetEmail"
                      type="email"
                      placeholder="exemplo@frox.com.br"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      className="h-12 rounded-2xl"
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-2xl font-bold" disabled={isResetLoading || !resetEmail}>
                    {isResetLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Enviar link"
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mt-8 pt-8 border-t border-border/40 text-center text-sm">
            <p className="text-muted-foreground/70 font-medium">
              Não tem uma conta?{" "}
              <Link
                href="/register"
                className={`text-primary font-bold hover:underline transition-all ${isAuthenticating ? "pointer-events-none opacity-50" : ""}`}
              >
                Cadastre-se agora
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
