"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { validatePlaca, formatPlaca } from "@/lib/utils-validation"
import { CheckCircle2, Loader2, TruckIcon } from "lucide-react"
import type { Truck } from "@/hooks/use-trucks"
import { useToast } from "@/hooks/use-toast"

interface TruckFormProps {
  truck?: Truck
  onSubmit: (data: Omit<Truck, "id" | "userId">) => void
  onCancel: () => void
  isLoading?: boolean
}

export function TruckForm({ truck, onSubmit, onCancel, isLoading }: TruckFormProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    plate: truck?.plate || "",
    brand: truck?.brand || "",
    model: truck?.model || "",
    year: truck?.year || new Date().getFullYear(),
    color: truck?.color || "",
    status: truck?.status || ("active" as const),
    mileage: truck?.mileage || 0,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [validFields, setValidFields] = useState<Record<string, boolean>>({})

  const validateField = (name: string, value: any) => {
    let error = ""
    let isValid = false

    switch (name) {
      case "plate":
        isValid = validatePlaca(value)
        if (!isValid && value.length >= 7) error = "Placa Inválida (Use ABC1234 ou ABC1D23)"
        break
      case "brand":
      case "model":
        isValid = String(value).trim().length >= 2
        break
      case "year":
        const year = Number(value)
        isValid = year >= 1990 && year <= new Date().getFullYear() + 1
        if (!isValid) error = "Ano inválido"
        break
      case "mileage":
        isValid = Number(value) >= 0
        break
      default:
        isValid = true
    }

    setErrors((prev) => ({ ...prev, [name]: error }))
    setValidFields((prev) => ({ ...prev, [name]: isValid && !error }))
    return isValid
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const isPlateValid = validateField("plate", formData.plate)
    const isBrandValid = validateField("brand", formData.brand)
    const isModelValid = validateField("model", formData.model)

    if (!isPlateValid || !isBrandValid || !isModelValid) {
      toast({
        title: "Dados Incompletos",
        description: "Corrija os campos marcados em vermelho para continuar.",
        variant: "destructive",
      })
      return
    }

    onSubmit(formData)
  }

  const handleChange = (field: string, value: string | number) => {
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
        <CardTitle className="text-xl font-black uppercase italic tracking-tight italic flex items-center gap-3">
          <TruckIcon className="h-6 w-6 text-primary" />
          {truck ? "Editar Caminhão" : "Novo Caminhão"}
        </CardTitle>
        <CardDescription className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground/60">
          {truck ? "Atualize as informações do caminhão" : "Adicione um novo caminhão à sua frota"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="plate" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                Placa (Mercosul ou Antiga) *
              </Label>
              <div className="relative">
                <Input
                  id="plate"
                  placeholder="ABC1234 ou ABC1D23"
                  value={formData.plate}
                  onChange={(e) => handleChange("plate", formatPlaca(e.target.value))}
                  className={getInputClass("plate")}
                  maxLength={7}
                  required
                />
                {validFields.plate && <CheckCircle2 className="absolute right-3 top-3 h-5 w-4 text-emerald-500 animate-in fade-in zoom-in" />}
              </div>
              {errors.plate && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1 animate-in slide-in-from-top-1">{errors.plate}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                Marca do Veículo *
              </Label>
              <div className="relative">
                <Input
                  id="brand"
                  placeholder="Volvo, Scania, Mercedes..."
                  value={formData.brand}
                  onChange={(e) => handleChange("brand", e.target.value)}
                  className={getInputClass("brand")}
                  required
                />
                {validFields.brand && <CheckCircle2 className="absolute right-3 top-3 h-5 w-4 text-emerald-500 animate-in fade-in zoom-in" />}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                Modelo / Versão *
              </Label>
              <div className="relative">
                <Input
                  id="model"
                  placeholder="FH 540, R 450, Actros..."
                  value={formData.model}
                  onChange={(e) => handleChange("model", e.target.value)}
                  className={getInputClass("model")}
                  required
                />
                {validFields.model && <CheckCircle2 className="absolute right-3 top-3 h-5 w-4 text-emerald-500 animate-in fade-in zoom-in" />}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                Ano de Fabricação *
              </Label>
              <Input
                id="year"
                type="number"
                min="1990"
                max={new Date().getFullYear() + 1}
                value={formData.year}
                onChange={(e) => handleChange("year", parseInt(e.target.value) || 0)}
                className={getInputClass("year")}
                required
              />
              {errors.year && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1 animate-in slide-in-from-top-1">{errors.year}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="color" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                Cor Predominante
              </Label>
              <Input
                id="color"
                placeholder="Branco, Azul, Vermelho..."
                value={formData.color}
                onChange={(e) => handleChange("color", e.target.value)}
                className={getInputClass("color")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                Status Operacional
              </Label>
              <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                <SelectTrigger className="h-11 rounded-sm border-border/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-sm border-white/10">
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="maintenance">Em Manutenção</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="mileage" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                Quilometragem Atual (KM)
              </Label>
              <Input
                id="mileage"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={formData.mileage}
                onChange={(e) => handleChange("mileage", parseInt(e.target.value) || 0)}
                className={getInputClass("mileage")}
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
              ) : truck ? "Atualizar Veículo" : "Finalizar Caminhão"}
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
