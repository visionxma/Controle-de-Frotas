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
        <div className="mobile-spacing">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
            <div>
              <h1 className="font-bold text-balance">Motoristas</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Gerencie seus motoristas</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {!showForm && (
                <>
                  <Button onClick={handleDownloadPDF} variant="outline" className="h-10 sm:h-9">
                    <Download className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Baixar PDF</span>
                  </Button>
                  <Button onClick={() => setShowForm(true)} className="h-10 sm:h-9">
                    <Plus className="h-4 w-4 sm:mr-2" />
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
