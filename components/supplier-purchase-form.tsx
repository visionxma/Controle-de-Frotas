"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CurrencyInput } from "@/components/currency-input"
import type { Transaction } from "@/hooks/use-transactions"
import type { Supplier } from "@/hooks/use-suppliers"
import { Package, Loader2 } from "lucide-react"

interface SupplierPurchaseFormProps {
  supplier: Supplier
  onSubmit: (data: Omit<Transaction, "id" | "userId">) => void
  onCancel: () => void
  isLoading?: boolean
}

const PURCHASE_CATEGORIES = [
  "Equipamentos",
  "Peças e Acessórios",
  "Combustível",
  "Manutenção",
  "Pneus",
  "Lubrificantes",
  "Serviços",
  "Outros",
]

export function SupplierPurchaseForm({
  supplier,
  onSubmit,
  onCancel,
  isLoading,
}: SupplierPurchaseFormProps) {
  const [formData, setFormData] = useState({
    itemName: "",
    quantity: 1,
    unitPrice: 0,
    description: "",
    date: new Date().toISOString().split("T")[0],
    category: supplier.category && PURCHASE_CATEGORIES.includes(supplier.category)
      ? supplier.category
      : "Equipamentos",
  })

  const totalAmount = useMemo(
    () => Math.round(formData.quantity * formData.unitPrice * 100) / 100,
    [formData.quantity, formData.unitPrice],
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const description =
      formData.description.trim() ||
      `${formData.itemName}${formData.quantity > 1 ? ` (x${formData.quantity})` : ""} — ${supplier.tradeName || supplier.name}`

    const data: Omit<Transaction, "id" | "userId"> = {
      type: "despesa",
      description,
      amount: totalAmount,
      date: formData.date,
      category: formData.category,
      supplierId: supplier.id,
      itemName: formData.itemName,
      quantity: formData.quantity,
      unitPrice: formData.unitPrice,
    }

    onSubmit(data)
  }

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  const isValid = formData.itemName.trim() && formData.quantity > 0 && formData.unitPrice > 0

  return (
    <Card className="rounded-sm border-white/10 overflow-hidden shadow-2xl">
      <CardHeader className="bg-muted/30 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-sm bg-primary/10 border border-primary/20 shrink-0">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl font-black uppercase italic tracking-tight">
              Nova Compra
            </CardTitle>
            <CardDescription className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground/60">
              Registre uma compra de {supplier.tradeName || supplier.name}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="itemName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                Equipamento / Item *
              </Label>
              <Input
                id="itemName"
                placeholder="Ex: Pneu 295/80R22.5, Filtro de óleo, Compressor..."
                value={formData.itemName}
                onChange={(e) => setFormData((p) => ({ ...p, itemName: e.target.value }))}
                className="h-11 rounded-sm border-border/40"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                Quantidade *
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                step="1"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, quantity: Math.max(1, parseInt(e.target.value) || 1) }))
                }
                className="h-11 rounded-sm border-border/40"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitPrice" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                Valor Unitário *
              </Label>
              <CurrencyInput
                id="unitPrice"
                value={formData.unitPrice}
                onChange={(val) => setFormData((p) => ({ ...p, unitPrice: val }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                Data da Compra *
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                className="h-11 rounded-sm border-border/40"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                Categoria *
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData((p) => ({ ...p, category: value }))}
              >
                <SelectTrigger className="h-11 rounded-sm border-border/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-sm border-white/10 bg-background/95 backdrop-blur-md">
                  {PURCHASE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                Descrição (opcional)
              </Label>
              <Input
                id="description"
                placeholder="Notas adicionais sobre a compra"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                className="h-11 rounded-sm border-border/40"
              />
            </div>
          </div>

          {/* Resumo do total */}
          <div className="rounded-sm border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 block">
                Total da Compra
              </span>
              <span className="text-[10px] text-muted-foreground">
                {formData.quantity} × {formatCurrency(formData.unitPrice)}
              </span>
            </div>
            <span className="text-2xl font-black text-primary">{formatCurrency(totalAmount)}</span>
          </div>

          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest text-center">
            Esta compra será registrada como despesa no Financeiro
          </p>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isLoading || !isValid}
              className="flex-1 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest italic rounded-sm transition-all shadow-lg shadow-primary/20"
            >
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Registrar Compra"}
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
