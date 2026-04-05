"use client"

import type React from "react"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { useBackup } from "@/hooks/use-backup"
import { useDrivers } from "@/hooks/use-drivers"
import type { Driver } from "@/hooks/use-drivers"
import {
  Mail,
  Globe,
  Phone,
  User,
  Shield,
  FileText,
  HelpCircle,
  ExternalLink,
  Edit,
  Save,
  X,
  Key,
  Users,
  UserPlus,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Smartphone,
  CheckCircle2,
  RotateCcw,
} from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

interface Collaborator {
  id: string
  name: string
  email: string
  company: string
  role: "admin" | "collaborator"
  adminId?: string
  permissions: {
    canCreate: boolean
    canRead: boolean
    canUpdate: boolean
    canDelete: boolean
  }
}

export default function SettingsPage() {
  const {
    user,
    updateUserData,
    changePassword,
    createCollaborator,
    getCollaborators,
    updateCollaborator,
    deleteCollaborator,
    createDriverAccess,
    resetDriverPassword,
  } = useAuth()
  const { downloadBackup, importBackup, clearAllData } = useBackup()
  const { drivers } = useDrivers()

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(user?.name || "")
  const [editCompany, setEditCompany] = useState(user?.company || "")
  const [isUpdating, setIsUpdating] = useState(false)

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [isLoadingCollaborators, setIsLoadingCollaborators] = useState(false)
  const [isCreateCollaboratorDialogOpen, setIsCreateCollaboratorDialogOpen] = useState(false)
  const [isEditCollaboratorDialogOpen, setIsEditCollaboratorDialogOpen] = useState(false)
  const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null)

  // Estados do formulário de colaborador
  const [newCollaboratorName, setNewCollaboratorName] = useState("")
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState("")
  const [newCollaboratorPassword, setNewCollaboratorPassword] = useState("")
  const [newCollaboratorRole, setNewCollaboratorRole] = useState<"admin" | "collaborator">("collaborator")
  const [editCollaboratorName, setEditCollaboratorName] = useState("")
  const [editCollaboratorEmail, setEditCollaboratorEmail] = useState("")
  const [editCollaboratorPassword, setEditCollaboratorPassword] = useState("")
  const [editCollaboratorRole, setEditCollaboratorRole] = useState<"admin" | "collaborator">("collaborator")
  const [showNewCollaboratorPassword, setShowNewCollaboratorPassword] = useState(false)
  const [showEditCollaboratorPassword, setShowEditCollaboratorPassword] = useState(false)
  const [isSubmittingCollaborator, setIsSubmittingCollaborator] = useState(false)

  // Estados para acesso de motoristas no app
  const [selectedDriverForAccess, setSelectedDriverForAccess] = useState<Driver | null>(null)
  const [isCreateDriverAccessDialogOpen, setIsCreateDriverAccessDialogOpen] = useState(false)
  const [isResetDriverPasswordDialogOpen, setIsResetDriverPasswordDialogOpen] = useState(false)
  const [driverAccessEmail, setDriverAccessEmail] = useState("")
  const [driverAccessPassword, setDriverAccessPassword] = useState("")
  const [driverResetPassword, setDriverResetPassword] = useState("")
  const [driverResetPasswordConfirm, setDriverResetPasswordConfirm] = useState("")
  const [showDriverAccessPassword, setShowDriverAccessPassword] = useState(false)
  const [showDriverResetPassword, setShowDriverResetPassword] = useState(false)
  const [isSubmittingDriverAccess, setIsSubmittingDriverAccess] = useState(false)

  const loadCollaborators = async () => {
    if (user?.role !== "admin") return

    setIsLoadingCollaborators(true)
    try {
      const collaboratorsList = await getCollaborators()
      setCollaborators(collaboratorsList)
    } catch (error) {
      console.error("Erro ao carregar colaboradores:", error)
      toast.error("Erro ao carregar colaboradores")
    } finally {
      setIsLoadingCollaborators(false)
    }
  }

  useEffect(() => {
    if (user?.role === "admin") {
      loadCollaborators()
    }
  }, [user])

  const handleSave = async () => {
    if (!editName.trim() || !editCompany.trim()) {
      toast.error("Nome e empresa são obrigatórios")
      return
    }

    setIsUpdating(true)
    const success = await updateUserData(editName.trim(), editCompany.trim())

    if (success) {
      toast.success("Dados atualizados com sucesso!")
      setIsEditing(false)
    } else {
      toast.error("Erro ao atualizar dados. Tente novamente.")
    }
    setIsUpdating(false)
  }

  const handleCancel = () => {
    setEditName(user?.name || "")
    setEditCompany(user?.company || "")
    setIsEditing(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem")
      return
    }

    if (newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres")
      return
    }

    setIsChangingPassword(true)
    const success = await changePassword(currentPassword, newPassword)

    if (success) {
      toast.success("Senha alterada com sucesso!")
      setIsPasswordDialogOpen(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } else {
      toast.error("Erro ao alterar senha. Verifique se a senha atual está correta.")
    }
    setIsChangingPassword(false)
  }

  const handleCreateCollaborator = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCollaboratorName.trim() || !newCollaboratorEmail.trim() || !newCollaboratorPassword.trim()) {
      toast.error("Nome, email e senha são obrigatórios")
      return
    }

    setIsSubmittingCollaborator(true)
    try {
      const success = await createCollaborator(
        newCollaboratorName.trim(),
        newCollaboratorEmail.trim(),
        newCollaboratorPassword,
        newCollaboratorRole,
      )
      if (success) {
        toast.success("Colaborador criado com sucesso!")
        setNewCollaboratorName("")
        setNewCollaboratorEmail("")
        setNewCollaboratorPassword("")
        setNewCollaboratorRole("collaborator")
        setIsCreateCollaboratorDialogOpen(false)
        await loadCollaborators()
      } else {
        toast.error("Erro ao criar colaborador")
      }
    } catch (error) {
      console.error("Erro ao criar colaborador:", error)
      toast.error("Erro ao criar colaborador")
    } finally {
      setIsSubmittingCollaborator(false)
    }
  }

  const handleEditCollaborator = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCollaborator || !editCollaboratorName.trim() || !editCollaboratorEmail.trim()) {
      toast.error("Nome e email são obrigatórios")
      return
    }

    setIsSubmittingCollaborator(true)
    try {
      const success = await updateCollaborator(
        editingCollaborator.id,
        editCollaboratorName.trim(),
        editCollaboratorEmail.trim(),
        editCollaboratorPassword.trim() || undefined,
        editCollaboratorRole,
      )
      if (success) {
        toast.success("Colaborador atualizado com sucesso!")
        setEditCollaboratorName("")
        setEditCollaboratorEmail("")
        setEditCollaboratorPassword("")
        setEditingCollaborator(null)
        setIsEditCollaboratorDialogOpen(false)
        await loadCollaborators()
      } else {
        toast.error("Erro ao atualizar colaborador")
      }
    } catch (error) {
      console.error("Erro ao atualizar colaborador:", error)
      toast.error("Erro ao atualizar colaborador")
    } finally {
      setIsSubmittingCollaborator(false)
    }
  }

  const handleDeleteCollaborator = async (collaborator: Collaborator) => {
    if (!confirm(`Tem certeza que deseja excluir o colaborador ${collaborator.name}?`)) {
      return
    }

    try {
      const success = await deleteCollaborator(collaborator.id)
      if (success) {
        toast.success("Colaborador excluído com sucesso!")
        await loadCollaborators()
      } else {
        toast.error("Erro ao excluir colaborador")
      }
    } catch (error) {
      console.error("Erro ao excluir colaborador:", error)
      toast.error("Erro ao excluir colaborador")
    }
  }

  const openEditCollaboratorDialog = (collaborator: Collaborator) => {
    setEditingCollaborator(collaborator)
    setEditCollaboratorName(collaborator.name)
    setEditCollaboratorEmail(collaborator.email)
    setEditCollaboratorRole(collaborator.role)
    setEditCollaboratorPassword("")
    setIsEditCollaboratorDialogOpen(true)
  }

  const openCreateDriverAccessDialog = (driver: Driver) => {
    setSelectedDriverForAccess(driver)
    setDriverAccessEmail(driver.email || "")
    setDriverAccessPassword("")
    setShowDriverAccessPassword(false)
    setIsCreateDriverAccessDialogOpen(true)
  }

  const openResetDriverPasswordDialog = (driver: Driver) => {
    setSelectedDriverForAccess(driver)
    setDriverResetPassword("")
    setDriverResetPasswordConfirm("")
    setShowDriverResetPassword(false)
    setIsResetDriverPasswordDialogOpen(true)
  }

  const handleCreateDriverAccess = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDriverForAccess || !driverAccessEmail.trim() || !driverAccessPassword.trim()) {
      toast.error("Email e senha são obrigatórios")
      return
    }
    if (driverAccessPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres")
      return
    }

    setIsSubmittingDriverAccess(true)
    try {
      const result = await createDriverAccess(
        selectedDriverForAccess.id,
        driverAccessEmail.trim(),
        driverAccessPassword,
      )
      if (result.success) {
        toast.success(`Acesso criado com sucesso para ${selectedDriverForAccess.name}!`)
        setIsCreateDriverAccessDialogOpen(false)
        setSelectedDriverForAccess(null)
      } else {
        toast.error(result.error || "Erro ao criar acesso")
      }
    } finally {
      setIsSubmittingDriverAccess(false)
    }
  }

  const handleResetDriverPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDriverForAccess || !driverResetPassword.trim()) {
      toast.error("A nova senha é obrigatória")
      return
    }
    if (driverResetPassword !== driverResetPasswordConfirm) {
      toast.error("As senhas não coincidem")
      return
    }
    if (driverResetPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres")
      return
    }

    setIsSubmittingDriverAccess(true)
    try {
      const result = await resetDriverPassword(selectedDriverForAccess.id, driverResetPassword)
      if (result.success) {
        toast.success(`Senha redefinida com sucesso para ${selectedDriverForAccess.name}!`)
        setIsResetDriverPasswordDialogOpen(false)
        setSelectedDriverForAccess(null)
      } else {
        toast.error(result.error || "Erro ao redefinir senha")
      }
    } finally {
      setIsSubmittingDriverAccess(false)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-[1200px] mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl uppercase">Configurações</h1>
            <p className="text-muted-foreground text-sm sm:text-base font-medium max-w-2xl">
              Personalize sua experiência, gerencie acessos e controle as diretrizes do seu sistema.
            </p>
          </div>

          <div className="grid gap-8">
            {/* Informações da Conta */}
            <Card className="rounded-[2.5rem] border-border/40 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
              <CardHeader className="responsive-card-padding">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <span className="text-base sm:text-lg">Informações da Conta</span>
                  </div>
                  {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="rounded-2xl border-border/40 hover:bg-primary/5 hover:text-primary h-9 px-4 font-bold shadow-sm">
                      <Edit className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Editar Perfil</span>
                    </Button>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                        disabled={isUpdating}
                        className="rounded-2xl border-border/40 h-9 px-4 font-bold"
                      >
                        <X className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Cancelar</span>
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={isUpdating} className="rounded-2xl bg-primary hover:bg-primary/90 h-9 px-4 font-bold shadow-md shadow-primary/10">
                        <Save className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">{isUpdating ? "Salvando..." : "Salvar Alterações"}</span>
                      </Button>
                    </div>
                  )}
                </CardTitle>
                <CardDescription className="text-sm">Visualize e gerencie as informações da sua conta</CardDescription>
              </CardHeader>
              <CardContent className="responsive-card-padding pt-0 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm">
                      Nome
                    </Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Digite seu nome"
                        className="h-10 sm:h-9"
                      />
                    ) : (
                      <Input id="name" value={user?.name || ""} disabled className="h-10 sm:h-9" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm">
                      Email
                    </Label>
                    <Input id="email" value={user?.email || ""} disabled className="h-10 sm:h-9" />
                    {isEditing && (
                      <p className="text-xs text-muted-foreground leading-tight">O email não pode ser alterado</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-sm">
                      Empresa
                    </Label>
                    {isEditing ? (
                      <Input
                        id="company"
                        value={editCompany}
                        onChange={(e) => setEditCompany(e.target.value)}
                        placeholder="Digite o nome da empresa"
                        className="h-10 sm:h-9"
                      />
                    ) : (
                      <Input id="company" value={user?.company || ""} disabled className="h-10 sm:h-9" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Status da Conta</Label>
                    <div>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Ativa
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm sm:text-base">Senha</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Altere sua senha de acesso</p>
                    </div>
                    <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 text-xs bg-transparent">
                          <Key className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Alterar Senha</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Alterar Senha</DialogTitle>
                          <DialogDescription>Digite sua senha atual e a nova senha para alterar.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleChangePassword} className="space-y-4 sm:space-y-5">
                          <div className="space-y-2">
                            <Label htmlFor="currentPassword" className="text-sm">
                              Senha Atual
                            </Label>
                            <Input
                              id="currentPassword"
                              type="password"
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              className="h-10 sm:h-9"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newPassword" className="text-sm">
                              Nova Senha
                            </Label>
                            <Input
                              id="newPassword"
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="h-10 sm:h-9"
                              minLength={6}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-sm">
                              Confirmar Nova Senha
                            </Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="h-10 sm:h-9"
                              minLength={6}
                              required
                            />
                          </div>
                          <Button type="submit" className="w-full h-10 sm:h-9" disabled={isChangingPassword}>
                            {isChangingPassword ? "Alterando..." : "Alterar Senha"}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>

            {user?.role === "admin" && (
              <Card className="rounded-[2.5rem] border-border/40 shadow-sm overflow-hidden bg-white/40 dark:bg-black/20 backdrop-blur-sm">
                <CardHeader className="responsive-card-padding">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      <span className="text-base sm:text-lg">Gestão de Acessos</span>
                    </div>
                    <Dialog open={isCreateCollaboratorDialogOpen} onOpenChange={setIsCreateCollaboratorDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 text-xs bg-transparent">
                          <UserPlus className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Adicionar Colaborador</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Criar Novo Colaborador</DialogTitle>
                          <DialogDescription>Adicione um novo colaborador à sua equipe</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateCollaborator} className="space-y-4">
                          <div>
                            <Label htmlFor="new-collaborator-name">Nome do Colaborador</Label>
                            <Input
                              id="new-collaborator-name"
                              type="text"
                              placeholder="Nome completo"
                              value={newCollaboratorName}
                              onChange={(e) => setNewCollaboratorName(e.target.value)}
                              required
                              disabled={isSubmittingCollaborator}
                            />
                          </div>
                          <div>
                            <Label htmlFor="new-collaborator-email">Email do Colaborador</Label>
                            <Input
                              id="new-collaborator-email"
                              type="email"
                              placeholder="email@exemplo.com"
                              value={newCollaboratorEmail}
                              onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                              required
                              disabled={isSubmittingCollaborator}
                            />
                          </div>
                          <div>
                            <Label htmlFor="new-collaborator-password">Senha</Label>
                            <div className="relative">
                              <Input
                                id="new-collaborator-password"
                                type={showNewCollaboratorPassword ? "text" : "password"}
                                placeholder="Senha para o colaborador"
                                value={newCollaboratorPassword}
                                onChange={(e) => setNewCollaboratorPassword(e.target.value)}
                                required
                                disabled={isSubmittingCollaborator}
                                className="pr-10"
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                onClick={() => setShowNewCollaboratorPassword(!showNewCollaboratorPassword)}
                                disabled={isSubmittingCollaborator}
                              >
                                {showNewCollaboratorPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                          <div>
                            <Label>Função</Label>
                            <Select value={newCollaboratorRole} onValueChange={(value: any) => setNewCollaboratorRole(value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="collaborator">Colaborador</SelectItem>
                                <SelectItem value="admin">Administrador</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsCreateCollaboratorDialogOpen(false)}
                              disabled={isSubmittingCollaborator}
                            >
                              Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmittingCollaborator}>
                              {isSubmittingCollaborator ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Criando...
                                </>
                              ) : (
                                "Criar Colaborador"
                              )}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Gerencie os colaboradores que têm acesso ao sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="responsive-card-padding pt-0">
                  {isLoadingCollaborators ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      Carregando colaboradores...
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Admin row */}
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-primary/10">
                            <Shield className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm sm:text-base">{user.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="destructive" className="text-[10px] font-black uppercase rounded-full px-2">
                                Administrador
                              </Badge>
                              <span className="text-xs text-muted-foreground font-medium italic">Você</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-xs">
                            Criar
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Ler
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Editar
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Excluir
                          </Badge>
                        </div>
                      </div>

                      {/* Collaborators */}
                      {collaborators.length === 0 ? (
                        <div className="text-center py-6">
                          <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Nenhum colaborador cadastrado</p>
                        </div>
                      ) : (
                        collaborators.map((collaborator) => (
                          <div
                            key={collaborator.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-secondary">
                                <User className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium text-sm sm:text-base">{collaborator.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge 
                                    variant={collaborator.role === "admin" ? "destructive" : "secondary"} 
                                    className="text-[10px] font-black uppercase rounded-full px-2"
                                  >
                                    {collaborator.role === "admin" ? "Administrador" : "Colaborador"}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground font-medium opacity-60">{collaborator.email}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="hidden sm:flex gap-1">
                                <Badge variant="outline" className="text-xs">
                                  Criar
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  Ler
                                </Badge>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditCollaboratorDialog(collaborator)}
                                  className="h-8"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteCollaborator(collaborator)}
                                  className="h-8"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Acesso de Motoristas no App */}
            {user?.role === "admin" && (
              <>
                {/* Dialog: Criar Acesso */}
                <Dialog open={isCreateDriverAccessDialogOpen} onOpenChange={setIsCreateDriverAccessDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Acesso no App Mobile</DialogTitle>
                      <DialogDescription>
                        Defina email e senha para <strong>{selectedDriverForAccess?.name}</strong> acessar o aplicativo.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateDriverAccess} className="space-y-4">
                      <div>
                        <Label htmlFor="driver-access-email">Email de acesso</Label>
                        <Input
                          id="driver-access-email"
                          type="email"
                          placeholder="email@exemplo.com"
                          value={driverAccessEmail}
                          onChange={(e) => setDriverAccessEmail(e.target.value)}
                          required
                          disabled={isSubmittingDriverAccess}
                        />
                      </div>
                      <div>
                        <Label htmlFor="driver-access-password">Senha</Label>
                        <div className="relative">
                          <Input
                            id="driver-access-password"
                            type={showDriverAccessPassword ? "text" : "password"}
                            placeholder="Mínimo 6 caracteres"
                            value={driverAccessPassword}
                            onChange={(e) => setDriverAccessPassword(e.target.value)}
                            required
                            minLength={6}
                            disabled={isSubmittingDriverAccess}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowDriverAccessPassword(!showDriverAccessPassword)}
                            disabled={isSubmittingDriverAccess}
                          >
                            {showDriverAccessPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCreateDriverAccessDialogOpen(false)}
                          disabled={isSubmittingDriverAccess}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmittingDriverAccess}>
                          {isSubmittingDriverAccess ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Criando...
                            </>
                          ) : (
                            "Criar Acesso"
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Dialog: Redefinir Senha */}
                <Dialog open={isResetDriverPasswordDialogOpen} onOpenChange={setIsResetDriverPasswordDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Redefinir Senha do Motorista</DialogTitle>
                      <DialogDescription>
                        Nova senha de acesso ao app para <strong>{selectedDriverForAccess?.name}</strong>.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleResetDriverPassword} className="space-y-4">
                      <div>
                        <Label htmlFor="driver-reset-password">Nova Senha</Label>
                        <div className="relative">
                          <Input
                            id="driver-reset-password"
                            type={showDriverResetPassword ? "text" : "password"}
                            placeholder="Mínimo 6 caracteres"
                            value={driverResetPassword}
                            onChange={(e) => setDriverResetPassword(e.target.value)}
                            required
                            minLength={6}
                            disabled={isSubmittingDriverAccess}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowDriverResetPassword(!showDriverResetPassword)}
                            disabled={isSubmittingDriverAccess}
                          >
                            {showDriverResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="driver-reset-password-confirm">Confirmar Nova Senha</Label>
                        <Input
                          id="driver-reset-password-confirm"
                          type="password"
                          placeholder="Repita a nova senha"
                          value={driverResetPasswordConfirm}
                          onChange={(e) => setDriverResetPasswordConfirm(e.target.value)}
                          required
                          minLength={6}
                          disabled={isSubmittingDriverAccess}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsResetDriverPasswordDialogOpen(false)}
                          disabled={isSubmittingDriverAccess}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmittingDriverAccess}>
                          {isSubmittingDriverAccess ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Redefinindo...
                            </>
                          ) : (
                            "Redefinir Senha"
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                <Card className="rounded-[2.5rem] border-border/40 shadow-sm overflow-hidden bg-white/40 dark:bg-black/20 backdrop-blur-sm">
                  <CardHeader className="responsive-card-padding">
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5" />
                      <span className="text-base sm:text-lg">Acesso de Motoristas no App</span>
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Gerencie quais motoristas podem fazer login no aplicativo mobile
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="responsive-card-padding pt-0">
                    {drivers.length === 0 ? (
                      <div className="text-center py-6">
                        <Smartphone className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Nenhum motorista cadastrado</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {drivers.map((driver) => (
                          <div
                            key={driver.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-secondary">
                                <User className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium text-sm sm:text-base">{driver.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  {driver.hasAppAccess ? (
                                    <>
                                      <Badge className="text-[10px] font-black uppercase rounded-full px-2 bg-green-500 text-white dark:bg-green-600">
                                        Acesso Liberado
                                      </Badge>
                                      {driver.email && (
                                        <span className="text-xs text-muted-foreground font-medium opacity-60">
                                          {driver.email}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px] font-black uppercase rounded-full px-2 text-muted-foreground">
                                      Sem Acesso
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {driver.hasAppAccess ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openResetDriverPasswordDialog(driver)}
                                  className="h-8 text-xs gap-1"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  <span className="hidden sm:inline">Redefinir Senha</span>
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => openCreateDriverAccessDialog(driver)}
                                  className="h-8 text-xs gap-1 bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <Smartphone className="h-3 w-3" />
                                  <span className="hidden sm:inline">Liberar App</span>
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {/* Suporte */}
            <Card className="rounded-[2.5rem] border-border/40 shadow-sm overflow-hidden bg-white/40 dark:bg-black/20 backdrop-blur-sm">
              <CardHeader className="responsive-card-padding">
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  <span className="text-base sm:text-lg">Suporte</span>
                </CardTitle>
                <CardDescription className="text-sm">
                  Entre em contato conosco para obter ajuda e suporte
                </CardDescription>
              </CardHeader>
              <CardContent className="responsive-card-padding pt-0 space-y-4">
                <div className="grid gap-3 sm:gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-0">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-sm sm:text-base">Email</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">visionxma@gmail.com</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild className="h-8 text-xs w-full sm:w-auto bg-transparent">
                      <a href="mailto:visionxma@gmail.com">
                        Enviar Email
                        <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
                      </a>
                    </Button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-0">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-sm sm:text-base">Website</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">visionxma.com</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild className="h-8 text-xs w-full sm:w-auto bg-transparent">
                      <a href="https://visionxma.com" target="_blank" rel="noopener noreferrer">
                        Visitar Site
                        <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
                      </a>
                    </Button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-0">
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-sm sm:text-base">WhatsApp</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">+55 99 8468-0391</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild className="h-8 text-xs w-full sm:w-auto bg-transparent">
                      <a href="https://wa.me/5599984680391" target="_blank" rel="noopener noreferrer">
                        Abrir WhatsApp
                        <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Termos de Uso e Políticas */}
            <Card className="rounded-[2.5rem] border-border/40 shadow-sm overflow-hidden bg-white/40 dark:bg-black/20 backdrop-blur-sm">
              <CardHeader className="responsive-card-padding">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <span className="text-base sm:text-lg">Termos e Políticas</span>
                </CardTitle>
                <CardDescription className="text-sm">Informações legais e políticas do sistema</CardDescription>
              </CardHeader>
              <CardContent className="responsive-card-padding pt-0 space-y-4">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-3 sm:gap-0">
                    <div>
                      <p className="font-medium text-sm sm:text-base">Termos de Uso</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Condições de uso do sistema de Controle de frotas
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild className="h-8 text-xs w-full sm:w-auto bg-transparent">
                      <a
                        href="https://drive.google.com/file/d/1YUlgWRwq0x32AvsL8uBvIEsccboNfcVe/view?usp=sharing"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Visualizar
                        <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
                      </a>
                    </Button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-3 sm:gap-0">
                    <div>
                      <p className="font-medium text-sm sm:text-base">Política de Privacidade</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Como tratamos e protegemos seus dados</p>
                    </div>
                    <Button variant="outline" size="sm" asChild className="h-8 text-xs w-full sm:w-auto bg-transparent">
                      <a
                        href="https://drive.google.com/file/d/19lg6tVrXG1wiBC0-fyPoINJzkqTuQjdA/view?usp=sharing"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Visualizar
                        <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
                      </a>
                    </Button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-3 sm:gap-0">
                    <div>
                      <p className="font-medium text-sm sm:text-base">Política de Cookies</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Informações sobre o uso de cookies</p>
                    </div>
                    <Button variant="outline" size="sm" asChild className="h-8 text-xs w-full sm:w-auto bg-transparent">
                      <a
                        href="https://drive.google.com/file/d/11yApmqkKxjudVyEfm4H68M4m-S0J55yF/view?usp=sharing"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Visualizar
                        <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações do Sistema */}
            <Card className="rounded-[2.5rem] border-border/40 shadow-sm overflow-hidden bg-white/40 dark:bg-black/20 backdrop-blur-sm">
              <CardHeader className="responsive-card-padding">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <span className="text-base sm:text-lg">Informações do Sistema</span>
                </CardTitle>
                <CardDescription className="text-sm">Detalhes técnicos e versão do sistema</CardDescription>
              </CardHeader>
              <CardContent className="responsive-card-padding pt-0 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Versão do Sistema</Label>
                    <p className="text-xs sm:text-sm font-mono bg-muted p-2 rounded">v1.0.0</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Última Atualização</Label>
                    <p className="text-xs sm:text-sm font-mono bg-muted p-2 rounded">
                      {new Date().toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Desenvolvido por</Label>
                    <p className="text-xs sm:text-sm bg-muted p-2 rounded">VisionX Inova Simples (I.S) </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Licença</Label>
                    <p className="text-xs sm:text-sm bg-muted p-2 rounded">Proprietária</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={isEditCollaboratorDialogOpen} onOpenChange={setIsEditCollaboratorDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Colaborador</DialogTitle>
              <DialogDescription>Atualize as informações do colaborador</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditCollaborator} className="space-y-4">
              <div>
                <Label htmlFor="edit-collaborator-name">Nome do Colaborador</Label>
                <Input
                  id="edit-collaborator-name"
                  type="text"
                  placeholder="Nome completo"
                  value={editCollaboratorName}
                  onChange={(e) => setEditCollaboratorName(e.target.value)}
                  required
                  disabled={isSubmittingCollaborator}
                />
              </div>
              <div>
                <Label htmlFor="edit-collaborator-email">Email do Colaborador</Label>
                <Input
                  id="edit-collaborator-email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={editCollaboratorEmail}
                  onChange={(e) => setEditCollaboratorEmail(e.target.value)}
                  required
                  disabled={isSubmittingCollaborator}
                />
              </div>
              <div>
                <Label htmlFor="edit-collaborator-password">Nova Senha (opcional)</Label>
                <div className="relative">
                  <Input
                    id="edit-collaborator-password"
                    type={showEditCollaboratorPassword ? "text" : "password"}
                    placeholder="Deixe em branco para manter a atual"
                    value={editCollaboratorPassword}
                    onChange={(e) => setEditCollaboratorPassword(e.target.value)}
                    disabled={isSubmittingCollaborator}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowEditCollaboratorPassword(!showEditCollaboratorPassword)}
                    disabled={isSubmittingCollaborator}
                  >
                    {showEditCollaboratorPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditCollaboratorDialogOpen(false)}
                  disabled={isSubmittingCollaborator}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmittingCollaborator}>
                  {isSubmittingCollaborator ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Alterações"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
