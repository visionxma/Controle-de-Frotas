"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, TrendingUp, TrendingDown, Search, Edit, Percent, Route, Warehouse, Package, MapPin } from "lucide-react"
import type { Transaction } from "@/hooks/use-transactions"
import { useTrucks } from "@/hooks/use-trucks"
import { useDrivers } from "@/hooks/use-drivers"
import { useTrips } from "@/hooks/use-trips"
import { useRentals } from "@/hooks/use-rentals"
import { useSuppliers } from "@/hooks/use-suppliers"
import { PermissionGate } from "@/components/permission-gate"
import { RegisteredBy } from "./registered-by"
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

interface TransactionListProps {
  transactions: Transaction[]
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
  isLoading?: boolean
}

export function TransactionList({ transactions, onEdit, onDelete, isLoading }: TransactionListProps) {
  const { trucks } = useTrucks()
  const { drivers } = useDrivers()
  const { trips } = useTrips()
  const { rentals } = useRentals()
  const { suppliers } = useSuppliers()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "receita" | "despesa">("all")
  const [filterCategory, setFilterCategory] = useState("all")

  const handleDelete = () => {
    if (deleteId) {
      onDelete(deleteId)
      setDeleteId(null)
    }
  }

  const getTruckName = (truckId?: string) => {
    if (!truckId) return null
    const truck = trucks.find((t) => t.id === truckId)
    return truck ? `${truck.plate} - ${truck.brand} ${truck.model}` : null
  }

  const getDriverName = (driverId?: string) => {
    if (!driverId) return null
    const driver = drivers.find((d) => d.id === driverId)
    return driver?.name || null
  }

  const getTransactionOrigin = (transaction: Transaction) => {
    if (transaction.tripId) {
      const trip = trips.find((t) => t.id === transaction.tripId)
      if (trip) {
        return {
          icon: <Route className="h-3 w-3" />,
          label: `Viagem: ${trip.startLocation} → ${trip.endLocation || "Em rota"}`,
          color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        }
      }
      return {
        icon: <Route className="h-3 w-3" />,
        label: "Viagem (removida)",
        color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      }
    }
    if (transaction.rentalId) {
      const rental = rentals.find((r) => r.id === transaction.rentalId)
      if (rental) {
        return {
          icon: <Warehouse className="h-3 w-3" />,
          label: `Locação: ${rental.machinerySerial} - ${rental.driverName}`,
          color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
        }
      }
      return {
        icon: <Warehouse className="h-3 w-3" />,
        label: "Locação (removida)",
        color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      }
    }
    if (transaction.supplierId) {
      const supplier = suppliers.find((s) => s.id === transaction.supplierId)
      const itemInfo = transaction.itemName
        ? ` | ${transaction.itemName}${transaction.quantity ? ` x${transaction.quantity}` : ""}`
        : ""
      if (supplier) {
        return {
          icon: <Package className="h-3 w-3" />,
          label: `Fornecedor: ${supplier.name}${itemInfo}`,
          color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        }
      }
      return {
        icon: <Package className="h-3 w-3" />,
        label: `Fornecedor (removido)${itemInfo}`,
        color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      }
    }
    if (transaction.isCommission) {
      return {
        icon: <Percent className="h-3 w-3" />,
        label: `Comissão automática`,
        color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
      }
    }
    return {
      icon: <MapPin className="h-3 w-3" />,
      label: "Lançamento manual",
      color: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    }
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || transaction.type === filterType
    const matchesCategory = filterCategory === "all" || transaction.category === filterCategory

    return matchesSearch && matchesType && matchesCategory
  })

  const categories = [...new Set(transactions.map((t) => t.category))].filter((category) => category !== "").sort()

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Carregando transações...</p>
      </div>
    )
  }

  return (
    <>
      <Card className="rounded-sm border-border/20 shadow-sm bg-white dark:bg-black/20 overflow-hidden mb-6">
        <CardContent className="py-3 px-4">
          <div className="flex flex-col lg:flex-row items-center gap-4">
             <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
              <div className="p-1.5 bg-primary/10 rounded-sm">
                <Search className="h-3.5 w-3.5 text-primary" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Filtros</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 w-full items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar transações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-xs font-medium border-border/10 rounded-sm"
                />
              </div>

              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="h-9 text-xs font-medium border-border/10 rounded-sm">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Todos</SelectItem>
                  <SelectItem value="receita" className="text-xs">Receitas</SelectItem>
                  <SelectItem value="despesa" className="text-xs">Despesas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="h-9 text-xs font-medium border-border/10 rounded-sm">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Todas</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category} className="text-xs">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter text-right lg:text-left">
                {filteredTransactions.length} transação(ões) encontrada(s)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 responsive-card-padding">
            <h3 className="text-base sm:text-lg font-medium mb-2">Nenhuma transação encontrada</h3>
            <p className="text-muted-foreground text-sm">
              {transactions.length === 0
                ? "Adicione sua primeira transação para começar o controle financeiro."
                : "Tente ajustar os filtros para encontrar as transações desejadas."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredTransactions.map((transaction) => (
            <Card key={transaction.id}>
              <CardContent className="responsive-card-padding">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full flex-shrink-0 ${
                        transaction.type === "receita" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      }`}
                    >
                      {transaction.type === "receita" ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm sm:text-base truncate leading-tight">
                        {transaction.description}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground mt-1">
                        <span>{new Date(transaction.date).toLocaleDateString("pt-BR")}</span>
                        <Badge variant="outline">{transaction.category}</Badge>
                        {transaction.isCommission && (
                          <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 gap-1 text-[10px]">
                            <Percent className="h-2.5 w-2.5" />
                            Comissão
                          </Badge>
                        )}
                        {getTruckName(transaction.truckId) && (
                          <Badge variant="secondary" className="hidden md:inline-flex text-xs">
                            {getTruckName(transaction.truckId)}
                          </Badge>
                        )}
                        {getDriverName(transaction.driverId) && (
                          <Badge variant="secondary" className="hidden md:inline-flex text-xs">
                            {getDriverName(transaction.driverId)}
                          </Badge>
                        )}
                      </div>
                      {(() => {
                        const origin = getTransactionOrigin(transaction)
                        return (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <Badge className={`${origin.color} gap-1 text-[10px] font-semibold border`}>
                              {origin.icon}
                              {origin.label}
                            </Badge>
                          </div>
                        )
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center justify-between lg:justify-end gap-3 mt-4 lg:mt-0">
                    <div className="text-right">
                      <p
                        className={`font-bold text-sm sm:text-base ${transaction.type === "receita" ? "text-green-600" : "text-red-600"}`}
                      >
                        {transaction.type === "receita" ? "+" : "-"}R${" "}
                        {transaction.amount.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <PermissionGate permission="canUpdate">
                        <Button size="sm" variant="outline" onClick={() => onEdit(transaction)} className="h-8">
                          <Edit className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline text-xs">Editar</span>
                        </Button>
                      </PermissionGate>
                      <PermissionGate permission="canDelete">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteId(transaction.id)}
                          className="h-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </PermissionGate>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/5">
                   <RegisteredBy userName={transaction.createdBy} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
