"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { RoleBasedRoute } from "@/components/role-based-route"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Users, UserPlus, Edit, Trash2, Loader2, Eye, EyeOff, Shield } from "lucide-react"
import { toast } from "sonner"
import { UserRoleBadge } from "@/components/user-role-badge"

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

export default function TeamPage() {
  const { user, createCollaborator, getCollaborators, updateCollaborator, deleteCollaborator } = useAuth()
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null)

  // Form states
  const [newName, setNewName] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [editName, setEditName] = useState("")
  const [editPassword, setEditPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadCollaborators = async () => {
    setIsLoading(true)
    try {
      const collaboratorsList = await getCollaborators()
      setCollaborators(collaboratorsList)
    } catch (error) {
      console.error("Erro ao carregar colaboradores:", error)
      toast.error("Erro ao carregar colaboradores")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === "admin") {
      loadCollaborators()
    }
  }, [user])

  const handleCreateCollaborator = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newPassword.trim()) {
      toast.error("Nome e senha são obrigatórios")
      return
    }

    setIsSubmitting(true)
    try {
      const success = await createCollaborator(newName.trim(), newPassword)
      if (success) {
        toast.success("Colaborador criado com sucesso!")
        setNewName("")
        setNewPassword("")
        setIsCreateDialogOpen(false)
        await loadCollaborators()
      } else {
        toast.error("Erro ao criar colaborador")
      }
    } catch (error) {
      console.error("Erro ao criar colaborador:", error)
      toast.error("Erro ao criar colaborador")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditCollaborator = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCollaborator || !editName.trim()) {
      toast.error("Nome é obrigatório")
      return
    }

    setIsSubmitting(true)
    try {
      const success = await updateCollaborator(
        editingCollaborator.id,
        editName.trim(),
        editPassword.trim() || undefined,
      )
      if (success) {
        toast.success("Colaborador atualizado com sucesso!")
        setEditName("")
        setEditPassword("")
        setEditingCollaborator(null)
        setIsEditDialogOpen(false)
        await loadCollaborators()
      } else {
        toast.error("Erro ao atualizar colaborador")
      }
    } catch (error) {
      console.error("Erro ao atualizar colaborador:", error)
      toast.error("Erro ao atualizar colaborador")
    } finally {
      setIsSubmitting(false)
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

  const openEditDialog = (collaborator: Collaborator) => {
    setEditingCollaborator(collaborator)
    setEditName(collaborator.name)
    setEditPassword("")
    setIsEditDialogOpen(true)
  }

  return (
    <RoleBasedRoute allowedRoles={["admin"]}>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8" />
              Gerenciar Equipe
            </h1>
            <p className="text-muted-foreground mt-2">Gerencie os colaboradores da sua empresa</p>
          </div>
          <UserRoleBadge />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Colaboradores</CardTitle>
                <CardDescription>Lista de todos os colaboradores da sua equipe</CardDescription>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Adicionar Colaborador
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Novo Colaborador</DialogTitle>
                    <DialogDescription>Adicione um novo colaborador à sua equipe</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateCollaborator} className="space-y-4">
                    <div>
                      <Label htmlFor="new-name">Nome do Colaborador</Label>
                      <Input
                        id="new-name"
                        type="text"
                        placeholder="Nome completo"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-password">Senha</Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Senha para o colaborador"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          disabled={isSubmitting}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          disabled={isSubmitting}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                        disabled={isSubmitting}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
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
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Carregando colaboradores...
              </div>
            ) : collaborators.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum colaborador encontrado</h3>
                <p className="text-muted-foreground mb-4">Adicione colaboradores para começar a gerenciar sua equipe</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Colaborador
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Permissões</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Admin row */}
                  <TableRow>
                    <TableCell className="font-medium">{user?.name}</TableCell>
                    <TableCell>
                      <Badge variant="default" className="flex items-center gap-1 w-fit">
                        <Shield className="h-3 w-3" />
                        Administrador
                      </Badge>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm">Você</span>
                    </TableCell>
                  </TableRow>

                  {/* Collaborators rows */}
                  {collaborators.map((collaborator) => (
                    <TableRow key={collaborator.id}>
                      <TableCell className="font-medium">{collaborator.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          <Shield className="h-3 w-3" />
                          Colaborador
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-xs">
                            Criar
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Ler
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(collaborator)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteCollaborator(collaborator)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Colaborador</DialogTitle>
              <DialogDescription>Atualize as informações do colaborador</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditCollaborator} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nome do Colaborador</Label>
                <Input
                  id="edit-name"
                  type="text"
                  placeholder="Nome completo"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-password">Nova Senha (opcional)</Label>
                <div className="relative">
                  <Input
                    id="edit-password"
                    type={showEditPassword ? "text" : "password"}
                    placeholder="Deixe em branco para manter a atual"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    disabled={isSubmitting}
                  >
                    {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
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
      </div>
    </RoleBasedRoute>
  )
}
