"use client"

import { useState, useMemo } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Building2, Phone, Mail, MapPin } from "lucide-react"
import type { Supplier } from "@/hooks/use-suppliers"
import { PermissionGate } from "@/components/permission-gate"
import { SupplierDetailsModal } from "./supplier-details-modal"
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

interface SupplierListProps {
  suppliers: Supplier[]
  onEdit: (supplier: Supplier) => void
  onDelete: (id: string) => void
  isLoading?: boolean
}

export function SupplierList({ suppliers, onEdit, onDelete, isLoading }: SupplierListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const supplierIdParam = searchParams.get("supplierId")

  const [deleteId, setDeleteId] = useState<string | null>(null)

  const selectedSupplier = useMemo(() => {
    if (!supplierIdParam || !suppliers) return null
    return suppliers.find((s) => s.id === supplierIdParam) || null
  }, [supplierIdParam, suppliers])

  const handleOpenDetails = (supplier: Supplier) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("supplierId", supplier.id)
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleCloseDetails = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("supplierId")
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleDelete = () => {
    if (deleteId) {
      onDelete(deleteId)
      setDeleteId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Carregando fornecedores...</p>
      </div>
    )
  }

  if (suppliers.length === 0) {
    return (
      <Card className="rounded-[2.5rem] border-dashed border-2 border-border/40 bg-muted/5">
        <CardContent className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold uppercase mb-2">Nenhum fornecedor cadastrado</h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Cadastre seu primeiro fornecedor para começar a registrar compras de equipamentos.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="responsive-grid gap-4">
        {suppliers.map((supplier) => {
          const displayName = supplier.tradeName || supplier.name
          const initials = displayName
            .split(" ")
            .slice(0, 2)
            .map((w) => w[0])
            .join("")
            .toUpperCase()

          return (
            <Card
              key={supplier.id}
              className="group rounded-sm border-border/40 shadow-sm hover:shadow-lg transition-all overflow-hidden bg-card/50 backdrop-blur-sm cursor-pointer hover:border-primary/30"
              onClick={() => handleOpenDetails(supplier)}
            >
              {/* Topo — avatar + status */}
              <CardHeader className="pb-0 px-5 pt-5">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-black text-primary tracking-tight">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm font-black tracking-tight uppercase leading-tight line-clamp-2">
                        {displayName}
                      </CardTitle>
                    </div>
                    {supplier.tradeName && (
                      <p className="text-[10px] text-muted-foreground/60 font-medium truncate mt-0.5">
                        {supplier.name}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={supplier.status === "active" ? "default" : "secondary"}
                    className="rounded-sm px-2 py-0.5 font-black uppercase text-[8px] tracking-wider shrink-0 mt-0.5"
                  >
                    {supplier.status === "active" ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="px-5 pb-5 pt-4">
                {/* Info — contato e localização */}
                <div className="space-y-2 pb-3 border-b border-border/10">
                  {supplier.category && (
                    <Badge variant="outline" className="text-[8px] font-black uppercase tracking-wider rounded-sm border-border/30 h-5">
                      {supplier.category}
                    </Badge>
                  )}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Phone className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                      <span className="font-semibold">{supplier.phone}</span>
                    </div>
                    {(supplier.city || supplier.state) && (
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                        <span className="font-semibold">
                          {supplier.city}{supplier.city && supplier.state && " - "}{supplier.state}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/10">
                  <div className="opacity-60">
                    <RegisteredBy userName={supplier.createdBy} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <PermissionGate permission="canUpdate">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(supplier)
                        }}
                        className="px-4 rounded-sm border-border/40 font-black uppercase text-[9px] tracking-widest hover:bg-primary/5 hover:text-primary h-8"
                      >
                        Editar
                      </Button>
                    </PermissionGate>
                    <PermissionGate permission="canDelete">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteId(supplier.id)
                        }}
                        className="rounded-sm text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10 h-8 w-8 p-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </PermissionGate>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <SupplierDetailsModal
        supplier={selectedSupplier}
        isOpen={!!selectedSupplier}
        onClose={handleCloseDetails}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black uppercase tracking-tight text-red-600">
              Confirmar exclusão de fornecedor
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/80 font-medium">
              As compras já registradas como despesas no Financeiro <strong>não serão excluídas</strong>, mas perderão o vínculo com este fornecedor.{" "}
              <span className="font-bold text-red-600">Esta ação é irreversível.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground font-black uppercase tracking-widest text-xs h-10 px-6"
            >
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
