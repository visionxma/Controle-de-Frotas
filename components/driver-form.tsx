"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { validateCPF, formatCPF, formatPhone, validateEmail, fetchCEP, formatCEP } from "@/lib/utils-validation"
import { CheckCircle2, Search, Loader2 } from "lucide-react"
import type { Driver } from "@/hooks/use-drivers"
import { useToast } from "@/hooks/use-toast"

interface DriverFormProps {
  driver?: Driver
  onSubmit: (data: Omit<Driver, "id" | "userId">) => void
  onCancel: () => void
  isLoading?: boolean
}

export function DriverForm({ driver, onSubmit, onCancel, isLoading }: DriverFormProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: driver?.name || "",
    cpf: driver?.cpf || "",
    cnh: driver?.cnh || "",
    cnhCategory: driver?.cnhCategory || "",
    cnhExpiry: driver?.cnhExpiry || "",
    phone: driver?.phone || "",
    email: driver?.email || "",
    address: driver?.address || "",
    birthDate: driver?.birthDate || "",
    status: driver?.status || ("active" as const),
    cep: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [validFields, setValidFields] = useState<Record<string, boolean>>({})
  const [isValidatingCEP, setIsValidatingCEP] = useState(false)

  const validateField = (name: string, value: string) => {
    let error = ""
    let isValid = false

    switch (name) {
      case "cpf":
        const cleanCPF = value.replace(/\D/g, "")
        isValid = validateCPF(cleanCPF)
        if (!isValid && cleanCPF.length >= 11) error = "CPF Inválido"
        break
      case "email":
        if (value) {
          isValid = validateEmail(value)
          if (!isValid) error = "Email Inválido"
        } else {
          isValid = true
        }
        break
      case "name":
        isValid = value.trim().split(" ").length >= 2
        if (!isValid && value.length > 3) error = "Informe o nome completo"
        break
      case "phone":
        const digits = value.replace(/\D/g, "")
        isValid = digits.length >= 10
        if (!isValid && digits.length >= 2) error = "Telefone incompleto"
        break
      default:
        isValid = value.length > 0
    }

    setErrors((prev) => ({ ...prev, [name]: error }))
    setValidFields((prev) => ({ ...prev, [name]: isValid && !error }))
    return isValid
  }

  const handleCEPBlur = async () => {
    const cleanCEP = formData.cep.replace(/\D/g, "")
    if (cleanCEP.length !== 8) return

    setIsValidatingCEP(true)
    const data = await fetchCEP(cleanCEP)
    
    if (data) {
      const fullAddress = `${data.street || ""}, ${data.neighborhood || ""}, ${data.city || ""} - ${data.state || ""}`
      setFormData(prev => ({ ...prev, address: fullAddress }))
      setValidFields(prev => ({ ...prev, cep: true, address: true }))
      toast({
        title: "Sucesso!",
        description: "Endereço localizado pelo CEP.",
      })
    } else {
      setErrors(prev => ({ ...prev, cep: "CEP não encontrado" }))
      setValidFields(prev => ({ ...prev, cep: false }))
      toast({
        title: "Atenção",
        description: "CEP não encontrado. Verifique os números.",
        variant: "destructive",
      })
    }
    setIsValidatingCEP(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Final validation
    const isNameValid = validateField("name", formData.name)
    const isCPFValid = validateField("cpf", formData.cpf)
    const isPhoneValid = validateField("phone", formData.phone)

    if (!isNameValid || !isCPFValid || !isPhoneValid) {
      toast({
        title: "Erro no formulário",
        description: "Por favor, corrija os campos marcados em vermelho.",
        variant: "destructive",
      })
      return
    }

    const { cep, ...submitData } = formData
    onSubmit(submitData)
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    validateField(field, value)
  }

  const getInputClass = (fieldName: string) => {
    return cn(
      "h-11 transition-all duration-300 rounded-sm border-border/40",
      errors[fieldName] 
        ? "border-red-500 bg-red-50/5 focus-visible:ring-red-500" 
        : validFields[fieldName] 
          ? "border-emerald-500/40 bg-emerald-500/5 focus-visible:ring-emerald-500" 
          : ""
    )
  }

  return (
    <Card className="rounded-sm border-white/10 overflow-hidden shadow-2xl">
      <CardHeader className="bg-muted/30 pb-6">
        <CardTitle className="text-xl font-black uppercase italic tracking-tight italic">
          {driver ? "Editar Motorista" : "Novo Motorista"}
        </CardTitle>
        <CardDescription className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground/60">
          {driver ? "Atualize as informações do motorista" : "Adicione um novo motorista à sua equipe"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                Nome Completo *
              </Label>
              <div className="relative">
                <Input
                  id="name"
                  placeholder="Nome completo do motorista"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={getInputClass("name")}
                  required
                />
                {validFields.name && <CheckCircle2 className="absolute right-3 top-3 h-5 w-4 text-emerald-500 animate-in fade-in zoom-in" />}
              </div>
              {errors.name && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1 animate-in slide-in-from-top-1">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                CPF *
              </Label>
              <div className="relative">
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={(e) => handleChange("cpf", formatCPF(e.target.value))}
                  className={getInputClass("cpf")}
                  maxLength={14}
                  required
                />
                {validFields.cpf && <CheckCircle2 className="absolute right-3 top-3 h-5 w-4 text-emerald-500 animate-in fade-in zoom-in" />}
              </div>
              {errors.cpf && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1 animate-in slide-in-from-top-1">{errors.cpf}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnh" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                CNH *
              </Label>
              <Input
                id="cnh"
                placeholder="Número da CNH"
                value={formData.cnh}
                onChange={(e) => handleChange("cnh", e.target.value)}
                className={getInputClass("cnh")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnhCategory" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                Categoria CNH *
              </Label>
              <Select value={formData.cnhCategory} onValueChange={(value) => handleChange("cnhCategory", value)}>
                <SelectTrigger className="h-11 rounded-sm border-border/40 shadow-sm">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent className="rounded-sm border-white/10 bg-background/95 backdrop-blur-md">
                  <SelectItem value="A">A - Motocicleta</SelectItem>
                  <SelectItem value="B">B - Carro</SelectItem>
                  <SelectItem value="C">C - Caminhão</SelectItem>
                  <SelectItem value="D">D - Ônibus</SelectItem>
                  <SelectItem value="E">E - Carreta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnhExpiry" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                Vencimento CNH *
              </Label>
              <Input
                id="cnhExpiry"
                type="date"
                value={formData.cnhExpiry}
                onChange={(e) => handleChange("cnhExpiry", e.target.value)}
                className={getInputClass("cnhExpiry")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                Data de Nascimento *
              </Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleChange("birthDate", e.target.value)}
                className={getInputClass("birthDate")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                Telefone *
              </Label>
              <div className="relative">
                <Input
                  id="phone"
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", formatPhone(e.target.value))}
                  className={getInputClass("phone")}
                  maxLength={15}
                  required
                />
                {validFields.phone && <CheckCircle2 className="absolute right-3 top-3 h-5 w-4 text-emerald-500 animate-in fade-in zoom-in" />}
              </div>
              {errors.phone && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1 animate-in slide-in-from-top-1">{errors.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                Email
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={getInputClass("email")}
                />
                {validFields.email && <CheckCircle2 className="absolute right-3 top-3 h-5 w-4 text-emerald-500 animate-in fade-in zoom-in" />}
              </div>
              {errors.email && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1 animate-in slide-in-from-top-1">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cep" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                CEP (Localizar Endereço)
              </Label>
              <div className="relative">
                <Input
                  id="cep"
                  placeholder="00000-000"
                  value={formData.cep}
                  onChange={(e) => handleChange("cep", formatCEP(e.target.value))}
                  onBlur={handleCEPBlur}
                  className={getInputClass("cep")}
                  maxLength={9}
                />
                <div className="absolute right-3 top-3">
                  {isValidatingCEP ? (
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  ) : validFields.cep ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Search className="h-4 w-4 text-muted-foreground/30" />
                  )}
                </div>
              </div>
              {errors.cep && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1 animate-in slide-in-from-top-1">{errors.cep}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                Status Atual
              </Label>
              <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                <SelectTrigger className="h-11 rounded-sm border-border/40 shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-sm border-white/10">
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                Endereço de Residência
              </Label>
              <Textarea
                id="address"
                placeholder="Endereço completo do motorista"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                className={cn(
                  "transition-all duration-300 rounded-sm border-border/40 min-h-[100px] resize-none focus-visible:ring-primary/20",
                  validFields.address ? "border-emerald-500/30 bg-emerald-500/5" : ""
                )}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
                type="submit" 
                disabled={isLoading}
                className="flex-1 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest italic rounded-sm transition-all shadow-lg shadow-primary/20"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : driver ? "Atualizar Cadastro" : "Finalizar Motorista"}
            </Button>
            <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                className="rounded-sm border-white/10 hover:bg-white/5 font-bold uppercase text-[10px] tracking-widest px-8"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
