"use client"

import { useState, useMemo } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Plus, Download, LayoutGrid, List as ListIcon, AlertTriangle, ArrowRight } from "lucide-react"
import { TruckForm } from "@/components/truck-form"
import { TruckList } from "@/components/truck-list"
import Link from "next/link"
import { useTrucks, type Truck } from "@/hooks/use-trucks"
import { useToast } from "@/hooks/use-toast"
import { SearchFilter } from "@/components/search-filter"
import { usePdfReports } from "@/hooks/use-pdf-reports"

export default function TrucksPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const { trucks, isLoading, addTruck, updateTruck, deleteTruck, isAtTruckLimit } = useTrucks()
  const { toast } = useToast()
  const { generateTrucksReport } = usePdfReports()

  const handleSubmit = async (data: Omit<Truck, "id" | "userId">) => {
    setIsSubmitting(true)

    try {
      let success = false

      if (editingTruck) {
        success = await updateTruck(editingTruck.id, data)
        if (success) {
          toast({
            title: "Caminhão atualizado",
            description: "As informações do caminhão foram atualizadas com sucesso.",
          })
        }
      } else {
        success = await addTruck(data)
        if (success) {
          toast({
            title: "Caminhão adicionado",
            description: "O caminhão foi adicionado à sua frota com sucesso.",
          })
        }
      }

      if (success) {
        setShowForm(false)
        setEditingTruck(null)
      } else {
        toast({
          title: isAtTruckLimit ? "Limite atingido" : "Erro",
          description: isAtTruckLimit
            ? "Você atingiu o limite de caminhões do seu plano. Ajuste seu plano para adicionar mais caminhões."
            : "Ocorreu um erro ao salvar o caminhão. Tente novamente.",
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

  const handleEdit = (truck: Truck) => {
    setEditingTruck(truck)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteTruck(id)
      if (success) {
        toast({
          title: "Caminhão excluído",
          description: "O caminhão foi removido da sua frota.",
        })
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível excluir o caminhão. Tente novamente.",
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
    setEditingTruck(null)
  }

  const handleDownloadPDF = () => {
    generateTrucksReport(trucks)
  }

  const filteredTrucks = useMemo(() => {
    return trucks.filter((truck) => {
      const matchesSearch =
        truck.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        truck.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        truck.brand.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || truck.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [trucks, searchTerm, statusFilter])

  const handleClearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-2">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl uppercase">Caminhões</h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base font-medium">
                Gerencie sua frota de caminhões com facilidade e precisão.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {!showForm && (
                <>
                  <Button 
                    onClick={handleDownloadPDF} 
                    variant="outline" 
                    size="sm" 
                    className="rounded-2xl border-border/40 hover:bg-primary/5 hover:text-primary transition-all h-10 px-5 font-bold shadow-sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Frota em PDF
                  </Button>
                  <Button
                    onClick={() => setShowForm(true)}
                    size="sm"
                    className="rounded-2xl bg-primary hover:bg-primary/90 transition-all h-10 px-5 font-bold shadow-lg shadow-primary/20"
                    disabled={isAtTruckLimit}
                    title={isAtTruckLimit ? "Limite do plano atingido" : undefined}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Caminhão
                  </Button>
                </>
              )}
            </div>
          </div>

          {isAtTruckLimit && !showForm && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-red-500/5 dark:bg-red-500/10 border border-red-500/10 p-4 rounded-sm text-sm text-red-600 dark:text-red-400 backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-red-500/10 rounded-sm">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <p className="font-bold tracking-tight">
                  Você atingiu o limite de caminhões do seu plano. Para cadastrar mais, atualize sua assinatura.
                </p>
              </div>
              <Link href="/plans" className="w-full sm:w-auto">
                <Button 
                  variant="default" 
                  size="sm" 
                  className="bg-red-600 hover:bg-red-700 text-white font-bold h-9 px-4 shadow-lg shadow-red-500/20 w-full sm:w-auto"
                >
                  Trocar plano
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}

          {!showForm && (
            <SearchFilter
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              placeholder="Pesquisar por placa, modelo ou marca..."
              filters={[
                {
                  label: "Status",
                  value: statusFilter,
                  options: [
                    { label: "Ativo", value: "active" },
                    { label: "Manutenção", value: "maintenance" },
                    { label: "Inativo", value: "inactive" },
                  ],
                  onChange: setStatusFilter,
                },
              ]}
              onClearFilters={handleClearFilters}
            />
          )}

          {showForm ? (
            <TruckForm
              truck={editingTruck || undefined}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={isSubmitting}
            />
          ) : (
            <TruckList trucks={filteredTrucks} onEdit={handleEdit} onDelete={handleDelete} isLoading={isLoading} />
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
