"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"
import { TransactionForm } from "@/components/transaction-form"
import { TransactionList } from "@/components/transaction-list"
import { FixedExpensesCard } from "@/components/fixed-expenses-card"
import { useTransactions, type Transaction } from "@/hooks/use-transactions"
import { useFixedExpenses } from "@/hooks/use-fixed-expenses"
import { useOrphanCleanup } from "@/hooks/use-orphan-cleanup"
import { useToast } from "@/hooks/use-toast"
import { usePdfReports } from "@/hooks/use-pdf-reports"
import { cn } from "@/lib/utils"

export default function FinancePage() {
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { transactions, isLoading, addTransaction, updateTransaction, deleteTransaction } = useTransactions()
  const { totalMonthly: fixedMonthly } = useFixedExpenses()
  const { toast } = useToast()
  const { generateFinanceReport } = usePdfReports()

  // Apaga transações órfãs (viagens/locações já removidas) em background.
  useOrphanCleanup()

  const handleSubmit = async (data: Omit<Transaction, "id" | "userId">, commission?: Omit<Transaction, "id" | "userId">) => {
    setIsSubmitting(true)

    try {
      let success = false

      if (editingTransaction) {
        success = await updateTransaction(editingTransaction.id, data)
        if (success) {
          toast({
            title: "Transação atualizada",
            description: "A transação foi atualizada com sucesso.",
          })
        }
      } else {
        success = await addTransaction(data)

        // Salva a despesa de comissão automaticamente junto com a receita
        if (success && commission) {
          await addTransaction(commission)
        }

        if (success) {
          toast({
            title: "Transação adicionada",
            description: commission
              ? "Receita e comissão do motorista registradas com sucesso."
              : "A transação foi registrada com sucesso.",
          })
        }
      }

      if (success) {
        setShowForm(false)
        setEditingTransaction(null)
      } else {
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao salvar a transação. Tente novamente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteTransaction(id)
      if (success) {
        toast({
          title: "Transação excluída",
          description: "A transação foi removida com sucesso.",
        })
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível excluir a transação. Tente novamente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingTransaction(null)
  }

  const handleDownloadPDF = () => {
    generateFinanceReport(transactions)
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-2">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl uppercase">Financeiro</h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base font-medium">
                Controle suas receitas e despesas com visibilidade total do seu fluxo de caixa.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleDownloadPDF} 
                variant="outline" 
                size="sm" 
                className="rounded-2xl border-border/40 hover:bg-primary/5 hover:text-primary transition-all h-10 px-5 font-bold shadow-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Fluxo em PDF
              </Button>
              {!showForm && (
                <Button
                  onClick={() => setShowForm(true)}
                  size="sm"
                  className="rounded-2xl bg-primary hover:bg-primary/90 transition-all h-10 px-5 font-bold shadow-lg shadow-primary/20"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Transação
                </Button>
              )}
            </div>
          </div>

          {showForm ? (
            <TransactionForm
              transaction={editingTransaction || undefined}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={isSubmitting}
            />
          ) : (
            <>
              {/* Resumo do mês atual incluindo despesas fixas */}
              {(() => {
                const currentMonth = new Date().getMonth()
                const currentYear = new Date().getFullYear()
                const monthTx = transactions.filter((t) => {
                  const d = new Date(t.date)
                  return d.getMonth() === currentMonth && d.getFullYear() === currentYear
                })
                const totalReceita = monthTx.filter((t) => t.type === "receita").reduce((s, t) => s + t.amount, 0)
                const totalDespesaTx = monthTx.filter((t) => t.type === "despesa").reduce((s, t) => s + t.amount, 0)
                const totalDespesa = totalDespesaTx + fixedMonthly
                const saldo = totalReceita - totalDespesa
                const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-sm border border-border/20 bg-white dark:bg-black/20 shadow-sm px-5 py-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">Receitas — Mês Atual</p>
                      <p className="text-2xl font-black text-green-600 tabular-nums">{fmt(totalReceita)}</p>
                    </div>
                    <div className="rounded-sm border border-border/20 bg-white dark:bg-black/20 shadow-sm px-5 py-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">Despesas — Mês Atual</p>
                      <p className="text-2xl font-black text-red-600 tabular-nums">{fmt(totalDespesa)}</p>
                      {fixedMonthly > 0 && (
                        <p className="text-[10px] text-muted-foreground/40 mt-0.5">
                          incl. {fmt(fixedMonthly)} em fixas
                        </p>
                      )}
                    </div>
                    <div className={cn(
                      "rounded-sm border shadow-sm px-5 py-4",
                      saldo >= 0 ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"
                    )}>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">Saldo — Mês Atual</p>
                      <p className={cn("text-2xl font-black tabular-nums", saldo >= 0 ? "text-green-600" : "text-red-600")}>
                        {fmt(saldo)}
                      </p>
                    </div>
                  </div>
                )
              })()}

              <FixedExpensesCard />
              <TransactionList
                transactions={transactions}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isLoading={isLoading}
              />
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
