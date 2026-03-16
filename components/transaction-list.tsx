"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, TrendingUp, TrendingDown, Search, Edit } from "lucide-react"
import type { Transaction } from "@/hooks/use-transactions"
import { useTrucks } from "@/hooks/use-trucks"
import { useDrivers } from "@/hooks/use-drivers"
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

interface TransactionListProps {
  transactions: Transaction[]
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
  isLoading?: boolean
}

export function TransactionList({ transactions, onEdit, onDelete, isLoading }: TransactionListProps) {
  const { trucks } = useTrucks()
  const { drivers } = useDrivers()
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
      <Card>
        <CardHeader className="responsive-card-padding">
          <CardTitle className="text-base sm:text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="responsive-card-padding pt-0">
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar transações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 sm:h-9"
              />
            </div>

            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="h-10 sm:h-9">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="receita">Receitas</SelectItem>
                <SelectItem value="despesa">Despesas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="h-10 sm:h-9">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start">
              {filteredTransactions.length} transação(ões)
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
                        {transaction.createdBy && (
                          <Badge variant="secondary" className="text-xs">
                            Registrado por: {transaction.createdBy}
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
                    </div>
                  </div>

                  <div className="flex items-center justify-between lg:justify-end gap-3">
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
