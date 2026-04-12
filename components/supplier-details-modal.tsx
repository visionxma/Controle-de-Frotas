"use client"

import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Plus,
  Package,
  Trash2,
  Calendar,
  User,
  ArrowLeft,
  ShoppingCart,
} from "lucide-react"
import type { Supplier } from "@/hooks/use-suppliers"
import { useTransactions, type Transaction } from "@/hooks/use-transactions"
import { SupplierPurchaseForm } from "./supplier-purchase-form"
import { useToast } from "@/hooks/use-toast"
import { PermissionGate } from "./permission-gate"
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

interface SupplierDetailsModalProps {
  supplier: Supplier | null
  isOpen: boolean
  onClose: () => void
}

export function SupplierDetailsModal({ supplier, isOpen, onClose }: SupplierDetailsModalProps) {
  const { transactions, addTransaction, deleteTransaction } = useTransactions()
  const { toast } = useToast()
  const [showPurchaseForm, setShowPurchaseForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const purchases = useMemo(() => {
    if (!supplier) return []
    return transactions
      .filter((tx) => tx.supplierId === supplier.id && tx.type === "despesa")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [transactions, supplier])

  const totalSpent = useMemo(
    () => purchases.reduce((sum, p) => sum + p.amount, 0),
    [purchases],
  )

  if (!supplier) return null

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })

  const handlePurchaseSubmit = async (data: Omit<Transaction, "id" | "userId">) => {
    setIsSubmitting(true)
    try {
      const success = await addTransaction(data)
      if (success) {
        toast({
          title: "Compra registrada",
          description: `${formatCurrency(data.amount)} adicionado às despesas do Financeiro.`,
        })
        setShowPurchaseForm(false)
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível registrar a compra. Tente novamente.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeletePurchase = async () => {
    if (!deleteId) return
    const success = await deleteTransaction(deleteId)
    if (success) {
      toast({
        title: "Compra removida",
        description: "A despesa foi excluída do Financeiro.",
      })
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a compra.",
        variant: "destructive",
      })
    }
    setDeleteId(null)
  }

  const displayName = supplier.tradeName || supplier.name

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          showCloseButton={false}
          className="fixed inset-0 !z-[100] flex flex-col !w-screen !h-screen !max-w-none sm:!max-w-none m-0 p-0 border-none bg-background animate-in slide-in-from-bottom duration-500 rounded-none shadow-none !transform-none !top-0 !left-0 !translate-x-0 !translate-y-0"
        >
          {/* Header fixo */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/30">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between gap-4">
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
                <PermissionGate permission="canCreate">
                  <Button
                    onClick={() => setShowPurchaseForm(true)}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 font-black uppercase text-[9px] tracking-widest rounded-sm shadow-lg shadow-primary/20 h-9 px-4"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Nova Compra
                  </Button>
                </PermissionGate>
              </div>
            </div>
          </div>

          {/* Conteúdo scrollável */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
              {showPurchaseForm ? (
                <SupplierPurchaseForm
                  supplier={supplier}
                  onSubmit={handlePurchaseSubmit}
                  onCancel={() => setShowPurchaseForm(false)}
                  isLoading={isSubmitting}
                />
              ) : (
                <>
                  {/* Seção 1: Info da empresa */}
                  <div className="space-y-4">
                    {/* Nome completo + badges */}
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

                    {/* Grid de dados */}
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

                    {/* Endereço completo */}
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

                  {/* Divider */}
                  <div className="border-t border-border/20" />

                  {/* Seção 2: Compras */}
                  <div className="space-y-4">
                    {/* Total gasto */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                      <div>
                        <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/60">
                          Total Gasto
                        </p>
                        <p className="text-3xl font-black text-primary leading-none mt-1">
                          {formatCurrency(totalSpent)}
                        </p>
                      </div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50">
                        {purchases.length} {purchases.length === 1 ? "compra" : "compras"} registrada{purchases.length !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {/* Lista de compras */}
                    {purchases.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-border/30 rounded-sm">
                        <ShoppingCart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm font-bold text-muted-foreground">
                          Nenhuma compra registrada
                        </p>
                        <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mt-1">
                          Clique em &quot;Nova Compra&quot; para adicionar
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {purchases.map((purchase) => (
                          <div
                            key={purchase.id}
                            className="flex items-center gap-4 p-4 rounded-sm border border-border/20 hover:border-primary/20 bg-card/50 transition-all group"
                          >
                            {/* Ícone */}
                            <div className="h-9 w-9 rounded-sm bg-red-500/10 flex items-center justify-center shrink-0">
                              <Package className="h-4 w-4 text-red-500" />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="font-bold text-sm truncate">
                                  {purchase.itemName || purchase.description}
                                </p>
                                {purchase.category && (
                                  <Badge
                                    variant="outline"
                                    className="text-[8px] font-black uppercase tracking-wider rounded-sm shrink-0 border-border/30"
                                  >
                                    {purchase.category}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-muted-foreground/70">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(purchase.date)}
                                </span>
                                {purchase.quantity && purchase.unitPrice ? (
                                  <span>{purchase.quantity} x {formatCurrency(purchase.unitPrice)}</span>
                                ) : null}
                              </div>
                            </div>

                            {/* Valor + delete */}
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-base font-black text-red-500">
                                -{formatCurrency(purchase.amount)}
                              </span>
                              <PermissionGate permission="canDelete">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setDeleteId(purchase.id)}
                                  className="h-8 w-8 p-0 text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </PermissionGate>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black uppercase tracking-tight text-red-600">
              Excluir compra
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/80 font-medium">
              A despesa correspondente será removida do Financeiro.{" "}
              <span className="font-bold text-red-600">Esta ação é irreversvel.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePurchase}
              className="bg-destructive text-destructive-foreground font-black uppercase tracking-widest text-xs h-10 px-6"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
