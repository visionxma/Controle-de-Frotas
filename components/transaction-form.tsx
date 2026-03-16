"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { Transaction } from "@/hooks/use-transactions"
import { useTrucks } from "@/hooks/use-trucks"
import { useDrivers } from "@/hooks/use-drivers"
import { useTrips } from "@/hooks/use-trips" // Importado hook de viagens
import { useRentals } from "@/hooks/use-rentals" // Importado hook de locações

interface TransactionFormProps {
  transaction?: Transaction
  onSubmit: (data: Omit<Transaction, "id" | "userId">) => void
  onCancel: () => void
  isLoading?: boolean
}

const revenueCategories = ["Frete", "Transporte de Carga", "Serviços Especiais", "Outros"]

const expenseCategories = [
  "Combustível",
  "Manutenção",
  "Pedágio",
  "Seguro",
  "IPVA",
  "Multas",
  "Alimentação",
  "Hospedagem",
  "Outros",
]

export function TransactionForm({ transaction, onSubmit, onCancel, isLoading }: TransactionFormProps) {
  const { trucks } = useTrucks()
  const { drivers } = useDrivers()
  const { trips } = useTrips() // Adicionado hook de viagens
  const { rentals } = useRentals() // Adicionado hook de locações

  const [formData, setFormData] = useState({
    type: transaction?.type || ("receita" as const),
    description: transaction?.description || "",
    amount: transaction?.amount || 0,
    date: transaction?.date || new Date().toISOString().split("T")[0],
    category: transaction?.category || "Frete",
    truckId: transaction?.truckId || undefined,
    driverId: transaction?.driverId || undefined,
    tripId: transaction?.tripId || undefined, // Adicionado campo tripId
    rentalId: transaction?.rentalId || undefined, // Adicionado campo rentalId
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      truckId: formData.truckId || undefined,
      driverId: formData.driverId || undefined,
      tripId: formData.tripId || undefined, // Incluído tripId no submit
      rentalId: formData.rentalId || undefined, // Incluído rentalId no submit
    })
  }

  const handleChange = (field: string, value: string | number) => {
    const finalValue = value === "none" ? undefined : value
    setFormData((prev) => ({ ...prev, [field]: finalValue }))
  }

  const categories = formData.type === "receita" ? revenueCategories : expenseCategories

  const completedTrips = trips.filter((trip) => trip.status === "completed")
  const completedRentals = rentals.filter((rental) => rental.status === "completed")

  return (
    <Card>
      <CardHeader>
        <CardTitle>{transaction ? "Editar Transação" : "Nova Transação"}</CardTitle>
        <CardDescription>
          {transaction ? "Atualize as informações da transação" : "Registre uma nova receita ou despesa"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label>Tipo de Transação</Label>
            <RadioGroup
              value={formData.type}
              onValueChange={(value) => {
                handleChange("type", value)
                handleChange("category", value === "receita" ? "Frete" : "Combustível")
              }}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="receita" id="receita" />
                <Label htmlFor="receita" className="text-green-600 font-medium">
                  Receita
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="despesa" id="despesa" />
                <Label htmlFor="despesa" className="text-red-600 font-medium">
                  Despesa
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                placeholder="Descreva a transação"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={formData.amount}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === "") {
                    handleChange("amount", 0)
                  } else {
                    const numValue = Math.round(Number.parseFloat(value) * 100) / 100
                    handleChange("amount", isNaN(numValue) ? 0 : numValue)
                  }
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tripId">Viagem {formData.type === "receita" ? "*" : "(opcional)"}</Label>
              <Select value={formData.tripId || "none"} onValueChange={(value) => handleChange("tripId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma viagem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {completedTrips.map((trip) => (
                    <SelectItem key={trip.id} value={trip.id}>
                      {trip.startLocation} → {trip.endLocation} ({new Date(trip.startDate).toLocaleDateString("pt-BR")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rentalId">Locação (opcional)</Label>
              <Select value={formData.rentalId || "none"} onValueChange={(value) => handleChange("rentalId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma locação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {completedRentals.map((rental) => (
                    <SelectItem key={rental.id} value={rental.id}>
                      {rental.machinerySerial} - {rental.driverName} ({new Date(rental.date).toLocaleDateString("pt-BR")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="truckId">Caminhão (opcional)</Label>
              <Select value={formData.truckId || "none"} onValueChange={(value) => handleChange("truckId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um caminhão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {trucks.map((truck) => (
                    <SelectItem key={truck.id} value={truck.id}>
                      {truck.plate} - {truck.brand} {truck.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="driverId">Motorista (opcional)</Label>
              <Select value={formData.driverId || "none"} onValueChange={(value) => handleChange("driverId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um motorista" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : transaction ? "Atualizar" : "Adicionar"}
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
