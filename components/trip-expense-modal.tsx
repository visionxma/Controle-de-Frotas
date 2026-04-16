"use client"

import type React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CurrencyInput } from "@/components/currency-input"
import { useTransactions } from "@/hooks/use-transactions"
import { TrendingDown, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Trip } from "@/hooks/use-trips"

const expenseCategories = [
  "Combustível",
  "Manutenção",
  "Pedágio",
  "Alimentação",
  "Hospedagem",
  "Multas",
  "Seguro",
  "Outros",
]

interface TripExpenseModalProps {
  trip: Trip
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TripExpenseModal({ trip, open, onOpenChange }: TripExpenseModalProps) {
  const { addTransaction } = useTransactions()

  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState(0)
  const [category, setCategory] = useState("Combustível")
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0])
  const [isSaving, setIsSaving] = useState(false)

  const reset = () => {
    setDescription("")
    setAmount(0)
    setCategory("Combustível")
    setDate(new Date().toISOString().split("T")[0])
  }

  const handleClose = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!description.trim()) {
      toast.error("Informe uma descrição para a despesa")
      return
    }
    if (amount <= 0) {
      toast.error("Informe um valor maior que zero")
      return
    }

    setIsSaving(true)
    try {
      const success = await addTransaction({
        type: "despesa",
        description: description.trim(),
        amount,
        date,
        category,
        tripId: trip.id,
        truckId: trip.truckId,
        driverId: trip.driverId,
      })

      if (success) {
        toast.success("Despesa registrada com sucesso!")
        reset()
        onOpenChange(false)
      } else {
        toast.error("Erro ao registrar despesa")
      }
    } catch {
      toast.error("Erro ao registrar despesa")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            Nova Despesa da Viagem
          </DialogTitle>
          <DialogDescription>
            Registre uma despesa vinculada à viagem #{trip.id.slice(-6)} ({trip.truckPlate} — {trip.driverName})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="expense-description">Descrição *</Label>
            <Input
              id="expense-description"
              placeholder="Ex: Abastecimento em Goiânia"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSaving}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expense-amount">Valor *</Label>
              <CurrencyInput
                id="expense-amount"
                value={amount}
                onChange={setAmount}
                disabled={isSaving}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-date">Data *</Label>
              <Input
                id="expense-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isSaving}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-category">Categoria *</Label>
            <Select value={category} onValueChange={setCategory} disabled={isSaving}>
              <SelectTrigger id="expense-category">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Registrar Despesa"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
