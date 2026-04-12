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
import { validateCNPJ, formatCNPJ, formatPhone, validateEmail, fetchCEP, formatCEP, fetchCNPJ } from "@/lib/utils-validation"
import { CheckCircle2, Search, Loader2, Building2, Sparkles, Info } from "lucide-react"
import type { Supplier } from "@/hooks/use-suppliers"
import { useToast } from "@/hooks/use-toast"

interface SupplierFormProps {
  supplier?: Supplier
  onSubmit: (data: Omit<Supplier, "id" | "userId">) => void
  onCancel: () => void
  isLoading?: boolean
}

const SUPPLIER_CATEGORIES = [
  "Equipamentos",
  "Peças e Acessórios",
  "Combustível",
  "Manutenção",
  "Pneus",
  "Serviços",
  "Lubrificantes",
  "Outros",
]

export function SupplierForm({ supplier, onSubmit, onCancel, isLoading }: SupplierFormProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: supplier?.name || "",
    tradeName: supplier?.tradeName || "",
    cnpj: supplier?.cnpj || "",
    email: supplier?.email || "",
    phone: supplier?.phone || "",
    address: supplier?.address || "",
    city: supplier?.city || "",
    state: supplier?.state || "",
    contactName: supplier?.contactName || "",
    category: supplier?.category || "Equipamentos",
    status: supplier?.status || ("active" as const),
    notes: supplier?.notes || "",
    cep: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [validFields, setValidFields] = useState<Record<string, boolean>>({})
  const [isValidatingCEP, setIsValidatingCEP] = useState(false)
  const [isFetchingCNPJ, setIsFetchingCNPJ] = useState(false)
  const [cnpjAutoFilled, setCnpjAutoFilled] = useState(false)

  const validateField = (name: string, value: string) => {
    let error = ""
    let isValid = false

    switch (name) {
      case "cnpj":
        const cleanCNPJ = value.replace(/\D/g, "")
        isValid = validateCNPJ(cleanCNPJ)
        if (!isValid && cleanCNPJ.length >= 14) error = "CNPJ Inválido"
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
        isValid = value.trim().length >= 3
        if (!isValid && value.length > 0) error = "Informe a razão social"
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
      const fullAddress = `${data.street || ""}, ${data.neighborhood || ""}`
      setFormData((prev) => ({
        ...prev,
        address: fullAddress,
        city: data.city || prev.city,
        state: data.state || prev.state,
      }))
      setValidFields((prev) => ({ ...prev, cep: true, address: true }))
      toast({
        title: "Sucesso!",
        description: "Endereço localizado pelo CEP.",
      })
    } else {
      setErrors((prev) => ({ ...prev, cep: "CEP não encontrado" }))
      setValidFields((prev) => ({ ...prev, cep: false }))
      toast({
        title: "Atenção",
        description: "CEP não encontrado. Verifique os números.",
        variant: "destructive",
      })
    }
    setIsValidatingCEP(false)
  }

  const handleCNPJBlur = async () => {
    const cleanCNPJ = formData.cnpj.replace(/\D/g, "")

    // Não busca se inválido ou se está editando um existente
    if (cleanCNPJ.length !== 14 || !validateCNPJ(cleanCNPJ)) return
    if (supplier && cleanCNPJ === supplier.cnpj.replace(/\D/g, "")) return

    setIsFetchingCNPJ(true)
    setCnpjAutoFilled(false)

    const data = await fetchCNPJ(cleanCNPJ)

    if (data) {
      // Monta endereço: TIPO LOGRADOURO + nome, número, complemento
      const addressParts = [
        data.descricao_tipo_de_logradouro,
        data.logradouro,
      ]
        .filter(Boolean)
        .join(" ")
      const fullAddress = [
        addressParts,
        data.numero && `nº ${data.numero}`,
        data.complemento,
        data.bairro,
      ]
        .filter(Boolean)
        .join(", ")

      // Telefone vem como "1133334444" (DDD colado) — formata
      const formattedPhone = data.ddd_telefone_1
        ? formatPhone(data.ddd_telefone_1)
        : formData.phone

      setFormData((prev) => ({
        ...prev,
        name: data.razao_social || prev.name,
        tradeName: data.nome_fantasia || prev.tradeName,
        email: data.email || prev.email,
        phone: formattedPhone,
        address: fullAddress || prev.address,
        city: data.municipio || prev.city,
        state: data.uf || prev.state,
        cep: data.cep ? formatCEP(data.cep) : prev.cep,
      }))

      // Marca campos preenchidos como válidos
      setValidFields((prev) => ({
        ...prev,
        cnpj: true,
        name: !!data.razao_social,
        phone: !!data.ddd_telefone_1,
        email: !!data.email && validateEmail(data.email),
        address: !!fullAddress,
      }))
      setErrors((prev) => ({ ...prev, cnpj: "", name: "", phone: "" }))

      setCnpjAutoFilled(true)

      // Avisa se o CNPJ não está ativo
      const isInactive =
        data.descricao_situacao_cadastral &&
        data.descricao_situacao_cadastral.toUpperCase() !== "ATIVA"

      toast({
        title: isInactive ? "CNPJ encontrado (atenção)" : "Dados preenchidos!",
        description: isInactive
          ? `Situação cadastral: ${data.descricao_situacao_cadastral}. Confira os dados antes de salvar.`
          : `${data.razao_social} carregado da Receita Federal.`,
        variant: isInactive ? "destructive" : "default",
      })
    } else {
      toast({
        title: "CNPJ não encontrado",
        description: "Não foi possível buscar os dados. Preencha os campos manualmente.",
        variant: "destructive",
      })
    }

    setIsFetchingCNPJ(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const isNameValid = validateField("name", formData.name)
    const isCNPJValid = validateField("cnpj", formData.cnpj)
    const isPhoneValid = validateField("phone", formData.phone)

    if (!isNameValid || !isCNPJValid || !isPhoneValid) {
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
          : "",
    )
  }

  return (
    <Card className="rounded-sm border-white/10 overflow-hidden shadow-2xl">
      <CardHeader className="bg-muted/30 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-sm bg-primary/10 border border-primary/20">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl font-black uppercase italic tracking-tight">
              {supplier ? "Editar Fornecedor" : "Novo Fornecedor"}
            </CardTitle>
            <CardDescription className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground/60">
              {supplier ? "Atualize as informações da empresa" : "Cadastre uma nova empresa fornecedora"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Alerta de auto-preenchimento via CNPJ */}
          <div
            className={cn(
              "rounded-sm border p-4 flex items-start gap-3 transition-all",
              cnpjAutoFilled
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-primary/20 bg-primary/5",
            )}
          >
            <div
              className={cn(
                "p-1.5 rounded-sm shrink-0 mt-0.5",
                cnpjAutoFilled ? "bg-emerald-500/15" : "bg-primary/15",
              )}
            >
              {cnpjAutoFilled ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <Sparkles className="h-4 w-4 text-primary" />
              )}
            </div>
            <div className="space-y-1 min-w-0">
              <p
                className={cn(
                  "text-[11px] font-black uppercase tracking-widest",
                  cnpjAutoFilled ? "text-emerald-500" : "text-primary",
                )}
              >
                {cnpjAutoFilled
                  ? "Dados carregados automaticamente"
                  : "Preencha o CNPJ primeiro"}
              </p>
              <p className="text-[11px] text-muted-foreground/80 font-medium leading-relaxed">
                {cnpjAutoFilled
                  ? "Os campos abaixo foram preenchidos com dados da Receita Federal via Brasil API. Revise e ajuste se necessário antes de salvar."
                  : "Após digitar o CNPJ, os demais campos (razão social, telefone, endereço, cidade, etc.) serão preenchidos automaticamente consultando a Receita Federal."}
              </p>
            </div>
          </div>

          {/* CNPJ — primeiro campo, largura total */}
          <div className="space-y-2">
            <Label
              htmlFor="cnpj"
              className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1 flex items-center gap-2"
            >
              CNPJ *
              <span className="text-[9px] font-bold text-primary normal-case tracking-normal flex items-center gap-1">
                <Info className="h-3 w-3" />
                preencha primeiro para auto-completar
              </span>
            </Label>
            <div className="relative">
              <Input
                id="cnpj"
                placeholder="00.000.000/0000-00"
                value={formData.cnpj}
                onChange={(e) => handleChange("cnpj", formatCNPJ(e.target.value))}
                onBlur={handleCNPJBlur}
                className={cn(getInputClass("cnpj"), "h-12 text-base font-bold tracking-wide")}
                maxLength={18}
                disabled={isFetchingCNPJ}
                required
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isFetchingCNPJ ? (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                ) : validFields.cnpj ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 animate-in fade-in zoom-in" />
                ) : (
                  <Search className="h-5 w-5 text-muted-foreground/30" />
                )}
              </div>
            </div>
            {errors.cnpj && (
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1">
                {errors.cnpj}
              </p>
            )}
            {isFetchingCNPJ && (
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest ml-1 animate-pulse">
                Consultando Receita Federal...
              </p>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                Razão Social *
              </Label>
              <div className="relative">
                <Input
                  id="name"
                  placeholder="Nome legal da empresa"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={getInputClass("name")}
                  required
                />
                {validFields.name && <CheckCircle2 className="absolute right-3 top-3 h-5 w-4 text-emerald-500 animate-in fade-in zoom-in" />}
              </div>
              {errors.name && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tradeName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                Nome Fantasia
              </Label>
              <Input
                id="tradeName"
                placeholder="Nome comercial (opcional)"
                value={formData.tradeName}
                onChange={(e) => handleChange("tradeName", e.target.value)}
                className={getInputClass("tradeName")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                Categoria *
              </Label>
              <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                <SelectTrigger className="h-11 rounded-sm border-border/40 shadow-sm">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent className="rounded-sm border-white/10 bg-background/95 backdrop-blur-md">
                  {SUPPLIER_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              {errors.phone && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1">{errors.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                Email
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="contato@empresa.com.br"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={getInputClass("email")}
                />
                {validFields.email && <CheckCircle2 className="absolute right-3 top-3 h-5 w-4 text-emerald-500 animate-in fade-in zoom-in" />}
              </div>
              {errors.email && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                Nome do Contato
              </Label>
              <Input
                id="contactName"
                placeholder="Pessoa de contato na empresa"
                value={formData.contactName}
                onChange={(e) => handleChange("contactName", e.target.value)}
                className={getInputClass("contactName")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                Status
              </Label>
              <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                <SelectTrigger className="h-11 rounded-sm border-border/40 shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-sm border-white/10">
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
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
              {errors.cep && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1">{errors.cep}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                Cidade / UF
              </Label>
              <div className="flex gap-2">
                <Input
                  id="city"
                  placeholder="Cidade"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  className={getInputClass("city")}
                />
                <Input
                  id="state"
                  placeholder="UF"
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value.toUpperCase())}
                  className={cn(getInputClass("state"), "w-20 text-center uppercase")}
                  maxLength={2}
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                Endereço
              </Label>
              <Input
                id="address"
                placeholder="Rua, número, bairro"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                className={getInputClass("address")}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                Observações
              </Label>
              <Textarea
                id="notes"
                placeholder="Informações adicionais sobre o fornecedor"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                className="transition-all duration-300 rounded-sm border-border/40 min-h-[80px] resize-none"
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
              ) : supplier ? (
                "Atualizar Cadastro"
              ) : (
                "Finalizar Fornecedor"
              )}
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
