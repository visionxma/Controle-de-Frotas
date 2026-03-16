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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-600/80 via-red-700/70 to-black/60 p-4">
      <Card className="w-full max-w-md shadow-xl rounded-2xl border border-border/40 backdrop-blur-sm bg-background/95 animate-in fade-in-50 slide-in-from-bottom-5">
        <CardHeader className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="p-3 bg-primary/10 rounded-full">
              <Truck className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Cadastre-se para começar a gerenciar sua frota
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
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
              />
            </div>

            <div>
              <Label htmlFor="company" className="text-sm font-medium">
                Empresa
              </Label>
              <Input
                id="company"
                type="text"
                placeholder="Nome da sua empresa"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                disabled={isAuthenticating}
                required
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isAuthenticating}
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Crie uma senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isAuthenticating}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                  disabled={isAuthenticating}
                />
                <label htmlFor="terms" className="text-sm leading-none">
                  Aceito os{" "}
                  <a
                    href="https://drive.google.com/file/d/1YUlgWRwq0x32AvsL8uBvIEsccboNfcVe/view?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Termos de Uso
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="privacy"
                  checked={acceptedPrivacy}
                  onCheckedChange={(checked) => setAcceptedPrivacy(checked as boolean)}
                  disabled={isAuthenticating}
                />
                <label htmlFor="privacy" className="text-sm leading-none">
                  Aceito a{" "}
                  <a
                    href="https://drive.google.com/file/d/19lg6tVrXG1wiBC0-fyPoINJzkqTuQjdA/view?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Política de Privacidade
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </label>
              </div>
            </div>

            {error && (
              <p className="text-destructive text-sm text-center bg-destructive/10 p-2 rounded-md border border-destructive/20">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isAuthenticating || !acceptedTerms || !acceptedPrivacy}>
              {isAuthenticating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar Conta"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className={`text-primary hover:underline ${isAuthenticating ? "pointer-events-none opacity-50" : ""}`}
            >
              Faça login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
