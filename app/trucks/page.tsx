"use client"

import { useState, useMemo } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Plus, Download, AlertTriangle } from "lucide-react"
import { TruckForm } from "@/components/truck-form"
import { TruckList } from "@/components/truck-list"
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
            ? "Você atingiu o limite de caminhões do seu plano. Para adicionar mais, contrate o Plano Personalizado com maior quantidade."
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
        <div className="mobile-spacing">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
            <div>
              <h1 className="font-bold text-balance">Caminhões</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Gerencie sua frota de caminhões</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {!showForm && (
                <>
                  <Button onClick={handleDownloadPDF} variant="outline" className="h-10 sm:h-9">
                    <Download className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Baixar PDF</span>
                  </Button>
                  <Button
                    onClick={() => setShowForm(true)}
                    className="h-10 sm:h-9"
                    disabled={isAtTruckLimit}
                    title={isAtTruckLimit ? "Limite de caminhões do plano atingido" : undefined}
                  >
                    <Plus className="h-4 w-4 sm:mr-2" />
                    Novo Caminhão
                  </Button>
                </>
              )}
            </div>
          </div>

          {isAtTruckLimit && !showForm && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-4 text-sm text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Você atingiu o limite de caminhões do seu plano atual. Para cadastrar mais caminhões, entre em contato com o suporte para atualizar seu plano.
              </span>
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
