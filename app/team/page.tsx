"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { RoleBasedRoute } from "@/components/role-based-route"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Users, UserPlus, Edit, Trash2, Loader2, Eye, EyeOff, Shield } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newRole, setNewRole] = useState<"admin" | "collaborator">("collaborator")
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editPassword, setEditPassword] = useState("")
  const [editRole, setEditRole] = useState<"admin" | "collaborator">("collaborator")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingCollaborator, setDeletingCollaborator] = useState<Collaborator | null>(null)

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
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      toast.error("Nome, email e senha são obrigatórios")
      return
    }

    setIsSubmitting(true)
    try {
      const success = await createCollaborator(newName.trim(), newEmail.trim(), newPassword, newRole)
      if (success) {
        toast.success(newRole === "admin" ? "Administrador criado com sucesso!" : "Colaborador criado com sucesso!")
        setNewName("")
        setNewEmail("")
        setNewPassword("")
        setNewRole("collaborator")
        setIsCreateDialogOpen(false)
        await loadCollaborators()
      } else {
        toast.error("Erro ao criar membro da equipe")
      }
    } catch (error) {
      console.error("Erro ao criar membro:", error)
      toast.error("Erro ao criar membro")
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
        editEmail.trim(),
        editPassword.trim() || undefined,
        editRole
      )
      if (success) {
        toast.success("Membro atualizado com sucesso!")
        setEditName("")
        setEditEmail("")
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

  const confirmDeleteCollaborator = async () => {
    if (!deletingCollaborator) return
    const collaborator = deletingCollaborator
    setDeletingCollaborator(null)

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
    setEditEmail(collaborator.email)
    setEditRole(collaborator.role)
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
            <p className="text-muted-foreground mt-2">Gerencie os colaboradores e administradores da sua empresa</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Membros da Equipe</CardTitle>
                <CardDescription>Lista de todos os membros da sua equipe e seus níveis de acesso</CardDescription>
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
                    <DialogTitle>Adicionar Membro à Equipe</DialogTitle>
                    <DialogDescription>Escolha a função e as informações do novo membro</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateCollaborator} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="new-name">Nome Completo</Label>
                        <Input
                          id="new-name"
                          type="text"
                          placeholder="Ex: João Silva"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="new-email">E-mail</Label>
                        <Input
                          id="new-email"
                          type="email"
                          placeholder="joao@exemplo.com"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <Label htmlFor="new-password">Senha</Label>
                        <div className="relative">
                          <Input
                            id="new-password"
                            type={showNewPassword ? "text" : "password"}
                            placeholder="******"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            disabled={isSubmitting}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <Label>Função</Label>
                        <Select value={newRole} onValueChange={(value: any) => setNewRole(value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="collaborator">Colaborador</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
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
                          "Adicionar Membro"
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
                Carregando equipe...
              </div>
            ) : collaborators.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Equipe vazia</h3>
                <p className="text-muted-foreground mb-4">Adicione membros para começar a gerenciar os acessos</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Membro
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
                      <Badge 
                        variant={collaborator.role === "admin" ? "destructive" : "secondary"} 
                        className="flex items-center gap-1 w-fit rounded-full px-3"
                      >
                        <Shield className="h-3 w-3" />
                        {collaborator.role === "admin" ? "Administrador" : "Colaborador"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {collaborator.role === "admin" ? (
                          <>
                            <Badge variant="outline" className="text-xs">Criar</Badge>
                            <Badge variant="outline" className="text-xs">Ler</Badge>
                            <Badge variant="outline" className="text-xs">Editar</Badge>
                            <Badge variant="outline" className="text-xs">Excluir</Badge>
                          </>
                        ) : (
                          <>
                            <Badge variant="outline" className="text-xs">Criar</Badge>
                            <Badge variant="outline" className="text-xs">Ler</Badge>
                          </>
                        )}
                      </div>
                    </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(collaborator)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setDeletingCollaborator(collaborator)}>
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
              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2">
                    <Label htmlFor="edit-name">Nome Completo</Label>
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
                 <div className="col-span-2">
                    <Label htmlFor="edit-email">E-mail</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                 </div>
                 <div className="col-span-2 sm:col-span-1">
                    <Label htmlFor="edit-password">Nova Senha (opcional)</Label>
                    <div className="relative">
                      <Input
                        id="edit-password"
                        type={showEditPassword ? "text" : "password"}
                        placeholder="Manter atual"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                      >
                        {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                 </div>
                 <div className="col-span-2 sm:col-span-1">
                    <Label>Função</Label>
                    <Select value={editRole} onValueChange={(value: any) => setEditRole(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="collaborator">Colaborador</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
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

        <AlertDialog open={!!deletingCollaborator} onOpenChange={(open) => !open && setDeletingCollaborator(null)}>
          <AlertDialogContent className="rounded-sm">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-black uppercase tracking-tight text-red-600">
                Tem certeza que deseja excluir {deletingCollaborator?.name}?
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="text-foreground/80 font-medium space-y-2">
                  <p><span className="font-bold text-red-600">Esta ação é permanente e não pode ser desfeita.</span> O colaborador perderá o acesso ao sistema imediatamente.</p>
                  <p className="text-sm"><strong>O que muda:</strong></p>
                  <ul className="text-sm list-disc pl-5 space-y-1">
                    <li>O colaborador não aparecerá mais na lista e não poderá fazer login.</li>
                    <li>Viagens, transações e demais registros criados por ele <strong>permanecem no sistema</strong> e continuam vinculados à sua conta.</li>
                    <li>A conta de autenticação (login) do colaborador <strong>não é removida</strong> — apenas desativada neste painel. Se precisar reativar, será necessário criar um novo colaborador com outro e-mail.</li>
                  </ul>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="font-bold">Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteCollaborator} className="bg-destructive text-destructive-foreground font-black uppercase tracking-widest text-xs h-10 px-6">
                Confirmar Exclusão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </RoleBasedRoute>
  )
}
