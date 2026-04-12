"use client"

import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  User,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
} from "lucide-react"
import type { Supplier } from "@/hooks/use-suppliers"
import { useTransactions } from "@/hooks/use-transactions"

interface SupplierDetailsModalProps {
  supplier: Supplier | null
  isOpen: boolean
  onClose: () => void
}

export function SupplierDetailsModal({ supplier, isOpen, onClose }: SupplierDetailsModalProps) {
  const { transactions } = useTransactions()
  const [filterType, setFilterType] = useState<"all" | "receita" | "despesa">("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const supplierTransactions = useMemo(() => {
    if (!supplier) return []
    return transactions
      .filter((tx) => tx.supplierId === supplier.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [transactions, supplier])

  const filteredTransactions = useMemo(() => {
    return supplierTransactions.filter((tx) => {
      if (filterType !== "all" && tx.type !== filterType) return false
      if (startDate && tx.date < startDate) return false
      if (endDate && tx.date > endDate) return false
      return true
    })
  }, [supplierTransactions, filterType, startDate, endDate])

  const stats = useMemo(() => {
    const totalReceita = filteredTransactions
      .filter((tx) => tx.type === "receita")
      .reduce((sum, tx) => sum + tx.amount, 0)
    const totalDespesa = filteredTransactions
      .filter((tx) => tx.type === "despesa")
      .reduce((sum, tx) => sum + tx.amount, 0)
    return {
      receita: totalReceita,
      despesa: totalDespesa,
      saldo: totalReceita - totalDespesa,
      total: filteredTransactions.length,
    }
  }, [filteredTransactions])

  if (!supplier) return null

  const displayName = supplier.tradeName || supplier.name

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })

  const clearFilters = () => {
    setFilterType("all")
    setStartDate("")
    setEndDate("")
  }

  const hasFilters = filterType !== "all" || startDate || endDate

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="fixed inset-0 !z-[100] flex flex-col !w-screen !h-screen !max-w-none sm:!max-w-none m-0 p-0 border-none bg-background animate-in slide-in-from-bottom duration-500 rounded-none shadow-none !transform-none !top-0 !left-0 !translate-x-0 !translate-y-0"
      >
        {/* Header fixo */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="rounded-sm h-9 w-9 p-0 shrink-0 hover:bg-muted"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="h-9 w-9 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-sm font-black uppercase italic tracking-tight truncate">
                  {displayName}
                </DialogTitle>
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50">
                  CNPJ: {supplier.cnpj}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Conteudo scrollavel */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Info da empresa */}
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight leading-tight">
                  {displayName}
                </h1>
                {supplier.tradeName && (
                  <p className="text-sm text-muted-foreground font-medium mt-1">
                    {supplier.name}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <Badge
                    variant={supplier.status === "active" ? "default" : "secondary"}
                    className="rounded-sm px-2.5 py-0.5 font-black uppercase text-[9px] tracking-wider"
                  >
                    {supplier.status === "active" ? "Ativo" : "Inativo"}
                  </Badge>
                  {supplier.category && (
                    <Badge variant="outline" className="rounded-sm px-2.5 py-0.5 font-black uppercase text-[9px] tracking-wider border-border/30">
                      {supplier.category}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <div className="bg-muted/30 rounded-sm p-3.5 border border-border/20">
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1.5">
                    <Phone className="h-3 w-3" />
                    Telefone
                  </div>
                  <p className="text-sm font-bold">{supplier.phone}</p>
                </div>

                {supplier.email && (
                  <div className="bg-muted/30 rounded-sm p-3.5 border border-border/20">
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1.5">
                      <Mail className="h-3 w-3" />
                      Email
                    </div>
                    <p className="text-sm font-bold truncate">{supplier.email}</p>
                  </div>
                )}

                {supplier.contactName && (
                  <div className="bg-muted/30 rounded-sm p-3.5 border border-border/20">
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1.5">
                      <User className="h-3 w-3" />
                      Contato
                    </div>
                    <p className="text-sm font-bold">{supplier.contactName}</p>
                  </div>
                )}

                {(supplier.address || supplier.city) && (
                  <div className="bg-muted/30 rounded-sm p-3.5 border border-border/20 col-span-2 sm:col-span-1 lg:col-span-1">
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1.5">
                      <MapPin className="h-3 w-3" />
                      Localização
                    </div>
                    <p className="text-sm font-bold">
                      {supplier.city}{supplier.city && supplier.state && " - "}{supplier.state}
                    </p>
                  </div>
                )}
              </div>

              {supplier.address && (
                <div className="bg-muted/30 rounded-sm p-3.5 border border-border/20">
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1.5">
                    <MapPin className="h-3 w-3" />
                    Endereço Completo
                  </div>
                  <p className="text-sm font-bold">{supplier.address}</p>
                </div>
              )}

              {supplier.notes && (
                <div className="bg-muted/30 rounded-sm p-3.5 border border-border/20">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1.5">
                    Observações
                  </p>
                  <p className="text-sm text-foreground/80">{supplier.notes}</p>
                </div>
              )}
            </div>

            <div className="border-t border-border/20" />

            {/* Resumo financeiro */}
            <div className="space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                Resumo Financeiro
              </h2>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-500/5 rounded-sm p-4 border border-green-500/10">
                  <p className="text-[9px] uppercase font-black tracking-widest text-green-600/60 mb-1">Receitas</p>
                  <p className="text-xl font-black text-green-600 leading-none">{formatCurrency(stats.receita)}</p>
                </div>
                <div className="bg-red-500/5 rounded-sm p-4 border border-red-500/10">
                  <p className="text-[9px] uppercase font-black tracking-widest text-red-600/60 mb-1">Despesas</p>
                  <p className="text-xl font-black text-red-600 leading-none">{formatCurrency(stats.despesa)}</p>
                </div>
                <div className={`rounded-sm p-4 border ${stats.saldo >= 0 ? "bg-green-500/5 border-green-500/10" : "bg-red-500/5 border-red-500/10"}`}>
                  <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/60 mb-1">Saldo</p>
                  <p className={`text-xl font-black leading-none ${stats.saldo >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(stats.saldo)}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-border/20" />

            {/* Filtros */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    Histórico de Transações
                  </h2>
                </div>
                {hasFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-[10px] h-7 px-2 font-bold text-muted-foreground">
                    Limpar filtros
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex gap-1">
                  {(["all", "receita", "despesa"] as const).map((type) => (
                    <Button
                      key={type}
                      variant={filterType === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterType(type)}
                      className="h-8 text-[10px] font-black uppercase tracking-wider rounded-sm px-3"
                    >
                      {type === "all" ? "Todos" : type === "receita" ? "Receitas" : "Despesas"}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-8 text-xs w-36 rounded-sm"
                    placeholder="Data início"
                  />
                  <span className="text-xs text-muted-foreground">até</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-8 text-xs w-36 rounded-sm"
                    placeholder="Data fim"
                  />
                </div>
              </div>

              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50">
                {stats.total} transação(ões) encontrada(s)
              </p>
            </div>

            {/* Lista de transações */}
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border/30 rounded-sm">
                <Building2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-bold text-muted-foreground">
                  Nenhuma transação vinculada
                </p>
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mt-1">
                  Vincule esta empresa ao registrar receitas ou despesas no Financeiro
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center gap-4 p-4 rounded-sm border border-border/20 hover:border-primary/20 bg-card/50 transition-all"
                  >
                    <div className={`h-9 w-9 rounded-sm flex items-center justify-center shrink-0 ${
                      tx.type === "receita" ? "bg-green-500/10" : "bg-red-500/10"
                    }`}>
                      {tx.type === "receita" ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-bold text-sm truncate">{tx.description}</p>
                        <Badge
                          variant="outline"
                          className="text-[8px] font-black uppercase tracking-wider rounded-sm shrink-0 border-border/30"
                        >
                          {tx.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground/70">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(tx.date)}
                        </span>
                        <Badge className={`text-[8px] font-black uppercase tracking-wider rounded-sm border-none shadow-none px-1.5 py-0 ${
                          tx.type === "receita" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                        }`}>
                          {tx.type}
                        </Badge>
                      </div>
                    </div>

                    <span className={`text-base font-black shrink-0 ${
                      tx.type === "receita" ? "text-green-600" : "text-red-600"
                    }`}>
                      {tx.type === "receita" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
