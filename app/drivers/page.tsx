"use client"

import { useState, useMemo } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"
import { DriverForm } from "@/components/driver-form"
import { DriverList } from "@/components/driver-list"
import { useDrivers, type Driver } from "@/hooks/use-drivers"
import { useToast } from "@/hooks/use-toast"
import { SearchFilter } from "@/components/search-filter"
import { usePdfReports } from "@/hooks/use-pdf-reports"

export default function DriversPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const { drivers, isLoading, addDriver, updateDriver, deleteDriver } = useDrivers()
  const { toast } = useToast()
  const { generateDriversReport } = usePdfReports()

  const handleSubmit = async (data: Omit<Driver, "id" | "userId">) => {
    setIsSubmitting(true)

    try {
      let success = false

      if (editingDriver) {
        success = await updateDriver(editingDriver.id, data)
        if (success) {
          toast({
            title: "Motorista atualizado",
            description: "As informações do motorista foram atualizadas com sucesso.",
          })
        }
      } else {
        success = await addDriver(data)
        if (success) {
          toast({
            title: "Motorista adicionado",
            description: "O motorista foi adicionado à sua equipe com sucesso.",
          })
        } else {
          toast({
            title: "Erro",
            description: "CPF já cadastrado ou erro no registro. Verifique os dados.",
            variant: "destructive",
          })
        }
      }

      if (success) {
        setShowForm(false)
        setEditingDriver(null)
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

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteDriver(id)
      if (success) {
        toast({
          title: "Motorista excluído",
          description: "O motorista foi removido da sua equipe.",
        })
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível excluir o motorista. Tente novamente.",
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
    setEditingDriver(null)
  }

  const handleDownloadPDF = () => {
    generateDriversReport(drivers)
  }

  const filteredDrivers = useMemo(() => {
    return drivers.filter((driver) => {
      const matchesSearch =
        driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.cpf.includes(searchTerm.replace(/\D/g, "")) ||
        driver.phone.includes(searchTerm.replace(/\D/g, ""))

      const matchesStatus = statusFilter === "all" || driver.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [drivers, searchTerm, statusFilter])

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
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl uppercase">Motoristas</h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base font-medium">
                Gerencie sua equipe de motoristas e acompanhe seu status.
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
                    Equipe em PDF
                  </Button>
                  <Button
                    onClick={() => setShowForm(true)}
                    size="sm"
                    className="rounded-2xl bg-primary hover:bg-primary/90 transition-all h-10 px-5 font-bold shadow-lg shadow-primary/20"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Motorista
                  </Button>
                </>
              )}
            </div>
          </div>

          {!showForm && (
            <SearchFilter
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              placeholder="Pesquisar por nome, CPF ou telefone..."
              filters={[
                {
                  label: "Status",
                  value: statusFilter,
                  options: [
                    { label: "Ativo", value: "active" },
                    { label: "Inativo", value: "inactive" },
                    { label: "Licença Vencida", value: "expired" },
                  ],
                  onChange: setStatusFilter,
                },
              ]}
              onClearFilters={handleClearFilters}
            />
          )}

          {showForm ? (
            <DriverForm
              driver={editingDriver || undefined}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={isSubmitting}
            />
          ) : (
            <DriverList drivers={filteredDrivers} onEdit={handleEdit} onDelete={handleDelete} isLoading={isLoading} />
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
