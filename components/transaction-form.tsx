"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CurrencyInput } from "@/components/currency-input"
import type { Transaction } from "@/hooks/use-transactions"
import { useTrucks } from "@/hooks/use-trucks"
import { useDrivers } from "@/hooks/use-drivers"
import { useTrips } from "@/hooks/use-trips"
import { useSuppliers } from "@/hooks/use-suppliers"
import { Percent, TrendingDown } from "lucide-react"

interface TransactionFormProps {
  transaction?: Transaction
  onSubmit: (data: Omit<Transaction, "id" | "userId">, commission?: Omit<Transaction, "id" | "userId">) => void
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
  "Comissão Motorista",
  "Outros",
]

export function TransactionForm({ transaction, onSubmit, onCancel, isLoading }: TransactionFormProps) {
  const { trucks } = useTrucks()
  const { drivers } = useDrivers()
  const { trips } = useTrips()
  const { suppliers } = useSuppliers()
  const [formData, setFormData] = useState({
    type: transaction?.type || ("receita" as const),
    description: transaction?.description || "",
    amount: transaction?.amount || 0,
    date: transaction?.date || new Date().toISOString().split("T")[0],
    category: transaction?.category || "Frete",
    truckId: transaction?.truckId || undefined,
    driverId: transaction?.driverId || undefined,
    tripId: transaction?.tripId || undefined,
    supplierId: transaction?.supplierId || undefined,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const mainData: Omit<Transaction, "id" | "userId"> = {
      ...formData,
      truckId: formData.truckId || undefined,
      driverId: formData.driverId || undefined,
      tripId: formData.tripId || undefined,
      supplierId: formData.supplierId || undefined,
    }

    // Gera a despesa de comissão apenas em novas receitas com motorista comissionado
    const commissionData = buildCommission()

    onSubmit(mainData, commissionData)
  }

  const handleChange = (field: string, value: string | number) => {
    const finalValue = value === "none" ? undefined : value

    // Auto-preencher motorista e caminhão ao selecionar uma viagem
    if (field === "tripId" && finalValue) {
      const selectedTrip = trips.find((t) => t.id === finalValue)
      if (selectedTrip) {
        setFormData((prev) => ({
          ...prev,
          [field]: finalValue,
          driverId: selectedTrip.driverId || prev.driverId,
          truckId: selectedTrip.truckId || prev.truckId,
        }))
        return
      }
    }

    setFormData((prev) => ({ ...prev, [field]: finalValue }))
  }

  const categories = formData.type === "receita" ? revenueCategories : expenseCategories

  // Todas as viagens disponíveis, ordenadas: em andamento primeiro
  const availableTrips = [...trips].sort((a, b) => {
    if (a.status === "in_progress" && b.status !== "in_progress") return -1
    if (a.status !== "in_progress" && b.status === "in_progress") return 1
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  })
  // Motorista selecionado com comissão
  const selectedDriver = useMemo(
    () => drivers.find((d) => d.id === formData.driverId),
    [drivers, formData.driverId],
  )

  const commissionPct = selectedDriver?.commissionPercentage ?? 0
  const commissionAmount =
    !transaction && formData.type === "receita" && commissionPct > 0 && formData.amount > 0
      ? Math.round(formData.amount * (commissionPct / 100) * 100) / 100
      : 0

  const showCommission = commissionAmount > 0

  function buildCommission(): Omit<Transaction, "id" | "userId"> | undefined {
    if (!showCommission || !selectedDriver) return undefined
    return {
      type: "despesa",
      description: `Comissão ${selectedDriver.name} (${commissionPct}% do frete)`,
      amount: commissionAmount,
      date: formData.date,
      category: "Comissão Motorista",
      driverId: selectedDriver.id,
      truckId: formData.truckId || undefined,
      tripId: formData.tripId || undefined,
      isCommission: true,
    }
  }

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

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
              <Label htmlFor="amount">Valor *</Label>
              <CurrencyInput
                id="amount"
                value={formData.amount}
                onChange={(val) => handleChange("amount", val)}
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
                  {availableTrips.map((trip) => (
                    <SelectItem key={trip.id} value={trip.id}>
                      <span className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${trip.status === "in_progress" ? "bg-amber-500" : "bg-green-500"}`} />
                        {trip.startLocation} → {trip.endLocation || "Em rota"} ({new Date(trip.startDate).toLocaleDateString("pt-BR")})
                        {trip.status === "in_progress" && (
                          <span className="text-[10px] font-bold text-amber-500 uppercase">Em andamento</span>
                        )}
                      </span>
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
              <Label htmlFor="driverId">
                Motorista (opcional)
              </Label>
              <Select value={formData.driverId || "none"} onValueChange={(value) => handleChange("driverId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um motorista" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name}
                      {(driver.commissionPercentage ?? 0) > 0 && (
                        <span className="ml-2 text-muted-foreground">
                          ({driver.commissionPercentage}%)
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierId">Empresa (opcional)</Label>
              <Select value={formData.supplierId || "none"} onValueChange={(value) => handleChange("supplierId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {suppliers
                    .filter((s) => s.status === "active")
                    .map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.tradeName || supplier.name}
                        {supplier.category && (
                          <span className="ml-2 text-muted-foreground">({supplier.category})</span>
                        )}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview da comissão */}
          {showCommission && (
            <div className="rounded-sm border border-orange-500/20 bg-orange-500/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-orange-400" />
                <span className="text-xs font-black uppercase tracking-widest text-orange-400">
                  Despesa de Comissão Gerada Automaticamente
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-foreground">
                    Comissão — {selectedDriver?.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Percent className="h-3 w-3" />
                    {commissionPct}% sobre {formatCurrency(formData.amount)}
                  </p>
                </div>
                <span className="text-base font-black text-orange-400">
                  − {formatCurrency(commissionAmount)}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                Uma despesa de &quot;Comissão Motorista&quot; será registrada junto com esta receita.
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : transaction ? "Atualizar" : showCommission ? "Salvar com Comissão" : "Adicionar"}
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
