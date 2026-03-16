"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Machinery } from "@/hooks/use-machinery"

interface MachineryFormProps {
  machinery?: Machinery
  onSubmit: (data: Omit<Machinery, "id" | "userId">) => void
  onCancel: () => void
  isLoading?: boolean
}

const machineryTypes = [
  { value: "tractor", label: "Trator" },
  { value: "excavator", label: "Retroescavadeira" },
  { value: "loader", label: "Carregadeira" },
  { value: "bulldozer", label: "Bulldozer" },
  { value: "crane", label: "Guindaste" },
  { value: "other", label: "Outros" },
]

export function MachineryForm({ machinery, onSubmit, onCancel, isLoading }: MachineryFormProps) {
  const [formData, setFormData] = useState({
    model: machinery?.model || "",
    brand: machinery?.brand || "",
    serialNumber: machinery?.serialNumber || "",
    year: machinery?.year || new Date().getFullYear(),
    type: machinery?.type || ("tractor" as const),
    status: machinery?.status || ("active" as const),
    hours: machinery?.hours || 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{machinery ? "Editar Máquina" : "Nova Máquina"}</CardTitle>
        <CardDescription>
          {machinery ? "Atualize as informações da máquina" : "Adicione uma nova máquina à sua frota"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Máquina *</Label>
              <Select value={formData.type} onValueChange={(value) => handleChange("type", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {machineryTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Marca *</Label>
              <Input
                id="brand"
                placeholder="Caterpillar, Komatsu, JCB..."
                value={formData.brand}
                onChange={(e) => handleChange("brand", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Modelo *</Label>
              <Input
                id="model"
                placeholder="320D, PC200, 3CX..."
                value={formData.model}
                onChange={(e) => handleChange("model", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serialNumber">Número de Série *</Label>
              <Input
                id="serialNumber"
                placeholder="Número de série da máquina"
                value={formData.serialNumber}
                onChange={(e) => handleChange("serialNumber", e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Ano *</Label>
              <Input
                id="year"
                type="number"
                min="1990"
                max={new Date().getFullYear() + 1}
                value={formData.year}
                onChange={(e) => {
                  const value = e.target.value
                  const numValue = value === "" ? new Date().getFullYear() : Number.parseInt(value, 10)
                  handleChange("year", isNaN(numValue) ? new Date().getFullYear() : numValue)
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="maintenance">Manutenção</SelectItem>
                  <SelectItem value="inactive">Inativa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="hours">Horímetro (horas)</Label>
              <Input
                id="hours"
                type="number"
                min="0"
                step="0.1"
                placeholder="0"
                value={formData.hours}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === "") {
                    handleChange("hours", 0)
                  } else {
                    const numValue = Number.parseFloat(value)
                    handleChange("hours", isNaN(numValue) ? 0 : numValue)
                  }
                }}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : machinery ? "Atualizar" : "Adicionar"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
