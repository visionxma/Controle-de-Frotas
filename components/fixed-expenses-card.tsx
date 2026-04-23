"use client"

import { useState } from "react"
import { useFixedExpenses, type FixedExpense } from "@/hooks/use-fixed-expenses"
import { useTrucks } from "@/hooks/use-trucks"
import { useDrivers } from "@/hooks/use-drivers"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CurrencyInput } from "@/components/currency-input"
import { PermissionGate } from "@/components/permission-gate"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Pencil, Trash2, CalendarClock, X, Check, Repeat2 } from "lucide-react"
import { cn } from "@/lib/utils"

const CATEGORIES = [
  "Aluguel",
  "Financiamento",
  "Seguro",
  "IPVA",
  "Salário Fixo",
  "Contador",
  "Internet / Telefone",
  "Software / Sistema",
  "Combustível Fixo",
  "Manutenção Preventiva",
  "Outros",
]

const EMPTY_FORM = {
  description: "",
  amount: 0,
  category: "Outros",
  dayOfMonth: 1,
  truckId: undefined as string | undefined,
  driverId: undefined as string | undefined,
}

export function FixedExpensesCard() {
  const { fixedExpenses, isLoading, totalMonthly, addFixedExpense, updateFixedExpense, deleteFixedExpense } =
    useFixedExpenses()
  const { trucks } = useTrucks()
  const { drivers } = useDrivers()
  const { toast } = useToast()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ ...EMPTY_FORM })
  const [isSaving, setIsSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value === "none" ? undefined : value }))
  }

  const openAdd = () => {
    setFormData({ ...EMPTY_FORM })
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (expense: FixedExpense) => {
    setFormData({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      dayOfMonth: expense.dayOfMonth,
      truckId: expense.truckId,
      driverId: expense.driverId,
    })
    setEditingId(expense.id)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({ ...EMPTY_FORM })
  }

  const handleSave = async () => {
    if (!formData.description.trim() || formData.amount <= 0) {
      toast({ title: "Preencha descrição e valor", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        description: formData.description.trim(),
        amount: formData.amount,
        category: formData.category,
        dayOfMonth: Number(formData.dayOfMonth),
        ...(formData.truckId && { truckId: formData.truckId }),
        ...(formData.driverId && { driverId: formData.driverId }),
      }

      const success = editingId
        ? await updateFixedExpense(editingId, payload)
        : await addFixedExpense(payload)

      if (success) {
        toast({
          title: editingId ? "Despesa fixa atualizada" : "Despesa fixa adicionada",
          description: editingId ? "Alterações salvas com sucesso." : "Registrada com sucesso.",
        })
        handleCancel()
      } else {
        toast({ title: "Erro ao salvar", variant: "destructive" })
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const success = await deleteFixedExpense(deleteId)
    if (success) {
      toast({ title: "Despesa fixa removida" })
    } else {
      toast({ title: "Erro ao remover", variant: "destructive" })
    }
    setDeleteId(null)
  }

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  const ordinal = (day: number) => {
    if (day === 1) return "1º"
    if (day === 2) return "2º"
    if (day === 3) return "3º"
    return `${day}º`
  }

  return (
    <>
      <div className="rounded-sm border border-border/20 bg-white dark:bg-black/20 shadow-sm overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-primary/10 rounded-sm">
              <Repeat2 className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-tight text-foreground">
                Despesas Fixas
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-0.5">
                Recorrentes todo mês
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {fixedExpenses.length > 0 && (
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Total mensal
                </p>
                <p className="text-base font-black text-red-600 tabular-nums">
                  {formatCurrency(totalMonthly)}
                </p>
              </div>
            )}
            <PermissionGate permission="canCreate">
              <Button
                size="sm"
                onClick={openAdd}
                className="rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-[10px] uppercase tracking-widest transition-all h-9 px-4 shadow-lg shadow-primary/20"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Adicionar
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* Formulário inline */}
        {showForm && (
          <div className="px-4 py-5 border-b border-border/20 bg-muted/30">
            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/70 mb-4">
              {editingId ? "Editar Despesa Fixa" : "Nova Despesa Fixa"}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5 lg:col-span-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Descrição *
                </Label>
                <Input
                  placeholder="Ex: Aluguel do galpão"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="h-10 rounded-sm border-border/40 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Valor *
                </Label>
                <CurrencyInput
                  value={formData.amount}
                  onChange={(val) => handleChange("amount", val)}
                  className="h-10 rounded-sm border-border/40"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Categoria
                </Label>
                <Select value={formData.category} onValueChange={(v) => handleChange("category", v)}>
                  <SelectTrigger className="h-10 rounded-sm border-border/40 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-sm">
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Dia do Mês
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={formData.dayOfMonth}
                  onChange={(e) =>
                    handleChange("dayOfMonth", Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))
                  }
                  className="h-10 rounded-sm border-border/40 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Caminhão (opcional)
                </Label>
                <Select
                  value={formData.truckId || "none"}
                  onValueChange={(v) => handleChange("truckId", v)}
                >
                  <SelectTrigger className="h-10 rounded-sm border-border/40 text-sm">
                    <SelectValue placeholder="Nenhum" />
                  </SelectTrigger>
                  <SelectContent className="rounded-sm">
                    <SelectItem value="none">Nenhum</SelectItem>
                    {trucks.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.plate} — {t.brand} {t.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Motorista (opcional)
                </Label>
                <Select
                  value={formData.driverId || "none"}
                  onValueChange={(v) => handleChange("driverId", v)}
                >
                  <SelectTrigger className="h-10 rounded-sm border-border/40 text-sm">
                    <SelectValue placeholder="Nenhum" />
                  </SelectTrigger>
                  <SelectContent className="rounded-sm">
                    <SelectItem value="none">Nenhum</SelectItem>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="h-8 px-5 rounded-sm bg-primary hover:bg-primary/90 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20"
              >
                <Check className="h-3.5 w-3.5 mr-1.5" />
                {isSaving ? "Salvando..." : editingId ? "Salvar" : "Adicionar"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                className="h-8 px-4 rounded-sm border-border/40 font-bold text-[10px] uppercase tracking-widest"
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Lista */}
        <div className="px-4 pb-4 pt-3">
          {isLoading ? (
            <div className="py-6 flex items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : fixedExpenses.length === 0 ? (
            <div className="py-8 text-center">
              <CalendarClock className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm font-bold text-foreground/60 uppercase tracking-widest">
                Nenhuma despesa fixa cadastrada
              </p>
              <p className="text-[11px] text-muted-foreground/40 mt-1">
                Adicione gastos que se repetem todo mês
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {fixedExpenses.map((expense) => {
                const truckName = trucks.find((t) => t.id === expense.truckId)
                const driverName = drivers.find((d) => d.id === expense.driverId)?.name

                return (
                  <div
                    key={expense.id}
                    className={cn(
                      "flex items-center justify-between gap-4 rounded-sm px-4 py-3",
                      "border border-border/20 bg-muted/20 hover:bg-muted/40 transition-colors",
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-muted border border-border/30">
                        <span className="text-[9px] font-black text-foreground/70 tabular-nums">
                          {ordinal(expense.dayOfMonth)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-tight truncate">
                          {expense.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                            {expense.category}
                          </span>
                          {truckName && (
                            <span className="text-[10px] font-bold text-muted-foreground/40">
                              · {truckName.plate}
                            </span>
                          )}
                          {driverName && (
                            <span className="text-[10px] font-bold text-muted-foreground/40">
                              · {driverName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-black text-red-600 tabular-nums">
                        {formatCurrency(expense.amount)}
                      </span>

                      <div className="flex gap-1">
                        <PermissionGate permission="canUpdate">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEdit(expense)}
                            className="h-7 w-7 rounded-sm hover:bg-muted hover:text-foreground transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </PermissionGate>
                        <PermissionGate permission="canDelete">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteId(expense.id)}
                            className="h-7 w-7 rounded-sm hover:bg-red-500/10 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </PermissionGate>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Rodapé com total */}
              <div className="flex items-center justify-between pt-3 mt-1 border-t border-border/20">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                  Total fixo mensal
                </span>
                <span className="text-base font-black text-red-600 tabular-nums">
                  {formatCurrency(totalMonthly)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black uppercase tracking-tight text-red-600">Tem certeza que deseja excluir esta despesa fixa?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p><span className="font-bold text-red-600">Esta ação é permanente e não pode ser desfeita.</span> O registro da despesa fixa será removido e não poderá ser recuperado.</p>
                <p className="text-sm"><strong>O que muda:</strong></p>
                <ul className="text-sm list-disc pl-5 space-y-1">
                  <li>O total de <strong>despesas fixas mensais</strong> no dashboard será reduzido, afetando a margem de lucro calculada.</li>
                  <li>Transações já lançadas referentes a essa despesa <strong>não são apagadas</strong> — continuam no Financeiro normalmente.</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-sm">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
