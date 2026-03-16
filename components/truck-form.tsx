"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Truck } from "@/hooks/use-trucks"

interface TruckFormProps {
  truck?: Truck
  onSubmit: (data: Omit<Truck, "id" | "userId">) => void
  onCancel: () => void
  isLoading?: boolean
}

export function TruckForm({ truck, onSubmit, onCancel, isLoading }: TruckFormProps) {
  const [formData, setFormData] = useState({
    plate: truck?.plate || "",
    brand: truck?.brand || "",
    model: truck?.model || "",
    year: truck?.year || new Date().getFullYear(),
    color: truck?.color || "",
    status: truck?.status || ("active" as const),
    mileage: truck?.mileage || 0,
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
        <CardTitle>{truck ? "Editar Caminhão" : "Novo Caminhão"}</CardTitle>
        <CardDescription>
          {truck ? "Atualize as informações do caminhão" : "Adicione um novo caminhão à sua frota"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="plate">Placa *</Label>
              <Input
                id="plate"
                placeholder="ABC-1234"
                value={formData.plate}
                onChange={(e) => handleChange("plate", e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Marca *</Label>
              <Input
                id="brand"
                placeholder="Volvo, Scania, Mercedes..."
                value={formData.brand}
                onChange={(e) => handleChange("brand", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Modelo *</Label>
              <Input
                id="model"
                placeholder="FH 540, R 450, Actros..."
                value={formData.model}
                onChange={(e) => handleChange("model", e.target.value)}
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
              <Label htmlFor="color">Cor</Label>
              <Input
                id="color"
                placeholder="Branco, Azul, Vermelho..."
                value={formData.color}
                onChange={(e) => handleChange("color", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="maintenance">Manutenção</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="mileage">Quilometragem</Label>
              <Input
                id="mileage"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={formData.mileage}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === "") {
                    handleChange("mileage", 0)
                  } else {
                    const numValue = Number.parseInt(value, 10)
                    handleChange("mileage", isNaN(numValue) ? 0 : numValue)
                  }
                }}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : truck ? "Atualizar" : "Adicionar"}
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
