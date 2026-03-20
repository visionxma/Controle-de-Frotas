"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Truck, ExternalLink, Loader2 } from "lucide-react"
import Link from "next/link"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [company, setCompany] = useState("")
  const [error, setError] = useState("")
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)

  const { register, isAuthenticating } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!acceptedTerms || !acceptedPrivacy) {
      setError("Você deve aceitar os Termos de Uso e a Política de Privacidade para continuar")
      return
    }

    if (isAuthenticating) return

    console.log("[v0] RegisterPage - iniciando registro")
    const success = await register(name, email, password, company)

    if (success) {
      console.log("[v0] RegisterPage - registro bem-sucedido, redirecionando")
      toast({
        title: "Sucesso!",
        description: "Conta criada com sucesso!",
      })
      router.push("/dashboard")
    } else {
      console.log("[v0] RegisterPage - falha no registro")
      setError("Email já cadastrado ou erro no registro")
      toast({
        title: "Erro",
        description: "Erro ao criar conta",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a0a] relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse delay-700" />
      
      <div className="absolute inset-0 bg-[url('https://www.sofit4.com.br/wp-content/uploads/direcao-defensiva-para-caminhoes-sofit.jpg')] bg-cover bg-center opacity-20 grayscale" />

      <Card className="relative z-10 w-full max-w-md shadow-2xl rounded-[2.5rem] border border-white/10 backdrop-blur-xl bg-white/95 dark:bg-black/80 animate-in fade-in zoom-in-95 duration-700 overflow-hidden my-8">
        <CardHeader className="text-center space-y-6 pt-10 px-8">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/5 rounded-[2rem] shadow-inner">
              <img src="/frox.svg" alt="FroX" className="h-10 w-auto" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-extrabold tracking-tight uppercase">Criar Conta</CardTitle>
            <CardDescription className="text-sm font-medium text-muted-foreground/80">
              Junte-se a nós e transforme a gestão da sua frota
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-10">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">
                Nome Completo
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isAuthenticating}
                required
                className="h-12 bg-background border-border/40 rounded-2xl focus-visible:ring-primary/20 shadow-sm transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">
                Nome da Empresa
              </Label>
              <Input
                id="company"
                type="text"
                placeholder="Ex: Transportes FroX Ltda"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                disabled={isAuthenticating}
                required
                className="h-12 bg-background border-border/40 rounded-2xl focus-visible:ring-primary/20 shadow-sm transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">
                E-mail de acesso
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isAuthenticating}
                required
                className="h-12 bg-background border-border/40 rounded-2xl focus-visible:ring-primary/20 shadow-sm transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">
                Crie uma Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="No mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isAuthenticating}
                required
                minLength={6}
                className="h-12 bg-background border-border/40 rounded-2xl focus-visible:ring-primary/20 shadow-sm transition-all"
              />
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-start space-x-3 p-3 bg-muted/30 rounded-2xl border border-transparent hover:border-primary/20 transition-all">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                  disabled={isAuthenticating}
                  className="mt-0.5 rounded-md"
                />
                <label htmlFor="terms" className="text-xs font-medium leading-tight text-muted-foreground/80">
                  Li e aceito os{" "}
                  <a
                    href="https://drive.google.com/file/d/1YUlgWRwq0x32AvsL8uBvIEsccboNfcVe/view?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-bold hover:underline inline-flex items-center gap-1"
                  >
                    Termos de Uso
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </label>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-muted/30 rounded-2xl border border-transparent hover:border-primary/20 transition-all">
                <Checkbox
                  id="privacy"
                  checked={acceptedPrivacy}
                  onCheckedChange={(checked) => setAcceptedPrivacy(checked as boolean)}
                  disabled={isAuthenticating}
                  className="mt-0.5 rounded-md"
                />
                <label htmlFor="privacy" className="text-xs font-medium leading-tight text-muted-foreground/80">
                  Aceito a{" "}
                  <a
                    href="https://drive.google.com/file/d/19lg6tVrXG1wiBC0-fyPoINJzkqTuQjdA/view?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-bold hover:underline inline-flex items-center gap-1"
                  >
                    Política de Privacidade
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </label>
              </div>
            </div>

            {error && (
              <p className="text-destructive text-xs font-bold text-center bg-destructive/10 p-3 rounded-xl border border-destructive/20 animate-in fade-in slide-in-from-top-2">
                {error}
              </p>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] mt-4" 
              disabled={isAuthenticating || !acceptedTerms || !acceptedPrivacy}
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando Conta...
                </>
              ) : (
                "Finalizar Cadastro"
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border/40 text-center text-sm">
            <p className="text-muted-foreground/70 font-medium">
              Já tem uma conta?{" "}
              <Link
                href="/login"
                className={`text-primary font-bold hover:underline transition-all ${isAuthenticating ? "pointer-events-none opacity-50" : ""}`}
              >
                Faça login
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
