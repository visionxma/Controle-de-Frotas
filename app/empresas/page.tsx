"use client"

import { useState, useMemo } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { SupplierForm } from "@/components/supplier-form"
import { SupplierList } from "@/components/supplier-list"
import { useSuppliers, type Supplier } from "@/hooks/use-suppliers"
import { useToast } from "@/hooks/use-toast"
import { SearchFilter } from "@/components/search-filter"

export default function EmpresasPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const { suppliers, isLoading, addSupplier, updateSupplier, deleteSupplier } = useSuppliers()
  const { toast } = useToast()

  const handleSubmit = async (data: Omit<Supplier, "id" | "userId">) => {
    setIsSubmitting(true)

    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, data)
        toast({
          title: "Fornecedor atualizado",
          description: "As informações foram atualizadas com sucesso.",
        })
      } else {
        await addSupplier(data)
        toast({
          title: "Fornecedor cadastrado",
          description: "A empresa foi adicionada à sua lista de fornecedores.",
        })
      }

      setShowForm(false)
      setEditingSupplier(null)
    } catch (error: any) {
      console.error("[EmpresasPage] handleSubmit error:", error)
      toast({
        title: "Erro ao salvar fornecedor",
        description: error?.message || "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteSupplier(id)
      if (success) {
        toast({
          title: "Fornecedor excluído",
          description: "A empresa foi removida da sua lista.",
        })
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível excluir o fornecedor. Tente novamente.",
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
    setEditingSupplier(null)
  }

  const categories = useMemo(() => {
    const set = new Set<string>()
    suppliers.forEach((s) => {
      if (s.category) set.add(s.category)
    })
    return Array.from(set).sort()
  }, [suppliers])

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      const search = searchTerm.toLowerCase()
      const matchesSearch =
        !search ||
        supplier.name.toLowerCase().includes(search) ||
        (supplier.tradeName && supplier.tradeName.toLowerCase().includes(search)) ||
        supplier.cnpj.includes(search) ||
        (supplier.contactName && supplier.contactName.toLowerCase().includes(search))

      const matchesStatus = statusFilter === "all" || supplier.status === statusFilter
      const matchesCategory = categoryFilter === "all" || supplier.category === categoryFilter

      return matchesSearch && matchesStatus && matchesCategory
    })
  }, [suppliers, searchTerm, statusFilter, categoryFilter])

  const handleClearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setCategoryFilter("all")
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-2">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl uppercase">
                Empresas
              </h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base font-medium">
                Cadastre seus fornecedores e registre as compras de equipamentos.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {!showForm && (
                <Button
                  onClick={() => setShowForm(true)}
                  size="sm"
                  className="rounded-2xl bg-primary hover:bg-primary/90 transition-all h-10 px-5 font-bold shadow-lg shadow-primary/20"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Fornecedor
                </Button>
              )}
            </div>
          </div>

          {!showForm && (
            <SearchFilter
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              placeholder="Pesquisar por nome, CNPJ ou contato..."
              filters={[
                {
                  label: "Status",
                  value: statusFilter,
                  options: [
                    { label: "Ativo", value: "active" },
                    { label: "Inativo", value: "inactive" },
                  ],
                  onChange: setStatusFilter,
                },
                ...(categories.length > 0
                  ? [
                      {
                        label: "Categoria",
                        value: categoryFilter,
                        options: categories.map((c) => ({ label: c, value: c })),
                        onChange: setCategoryFilter,
                      },
                    ]
                  : []),
              ]}
              onClearFilters={handleClearFilters}
            />
          )}

          {showForm ? (
            <SupplierForm
              supplier={editingSupplier || undefined}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={isSubmitting}
            />
          ) : (
            <SupplierList
              suppliers={filteredSuppliers}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isLoading={isLoading}
            />
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
