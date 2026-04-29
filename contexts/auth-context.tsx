"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  reauthenticateWithCredential,
  EmailAuthProvider,
  getAuth,
} from "firebase/auth"
import { initializeApp, deleteApp } from "firebase/app"
import { auth, app as firebaseApp } from "@/lib/firebase"
import { doc, setDoc, getDoc, collection, query, where, getDocs, onSnapshot, limit, getFirestore } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { isSuperAdminEmail } from "@/lib/admin-config"

interface User {
  id: string
  name: string
  email: string
  company: string
  role: "admin" | "collaborator"
  adminId?: string // For collaborators, references the admin who created them
  permissions: {
    canCreate: boolean
    canRead: boolean
    canUpdate: boolean
    canDelete: boolean
  }
  // Assinatura Stripe
  plan_type?: "basic" | "custom" | "frotas" | null
  max_trucks?: number | null
  subscription_status?: "active" | "inactive" | "past_due" | "canceled" | "incomplete" | "incomplete_expired" | null
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  onboarding_completed?: boolean
  // Boleto/pix: janela de 5 dias de acesso após geração do boleto.
  // Enquanto essa data é futura, ProtectedRoute libera o sistema
  // mesmo com subscription_status !== "active".
  pending_boleto_until?: Date | null
  // Super-admin global: enxerga métricas de todas as empresas em /admin
  // e ignora exigência de assinatura ativa.
  isSuperAdmin?: boolean
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string, userName?: string) => Promise<boolean>
  register: (name: string, email: string, password: string, company: string) => Promise<boolean>
  logout: () => void
  updateUserData: (name: string, company: string) => Promise<boolean>
  resetPassword: (email: string) => Promise<boolean>
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>
  createCollaborator: (name: string, email: string, password: string, role?: "admin" | "collaborator") => Promise<boolean>
  getCollaborators: () => Promise<User[]>
  updateCollaborator: (collaboratorId: string, name: string, email: string, password?: string, role?: "admin" | "collaborator") => Promise<boolean>
  deleteCollaborator: (collaboratorId: string) => Promise<boolean>
  createDriverAccess: (driverId: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  resetDriverPassword: (driverId: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
  isLoading: boolean
  isAuthenticating: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const syncAttemptedRef = useRef(false)

  useEffect(() => {
    // Verifica se o Firebase Auth está disponível
    if (!auth) {
      setIsLoading(false)
      return
    }

    let unsubscribeUserDoc: (() => void) | null = null

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // Cancela o listener anterior do documento do usuário
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc()
        unsubscribeUserDoc = null
      }

      if (firebaseUser) {
        // Listener em tempo real no documento do usuário — reage a mudanças de assinatura feitas pelo webhook
        unsubscribeUserDoc = onSnapshot(
          doc(db, "users", firebaseUser.uid),
          (userDoc) => {
            if (userDoc.exists()) {
              const userData = userDoc.data()
              const role = userData.role

              // Bloqueia qualquer role que não seja exatamente "admin" (incluindo undefined/null)
              if (role !== "admin") {
                signOut(auth)
                setUser(null)
                setIsLoading(false)
                return
              }

              // Firestore Timestamps vs Date: toDate() quando vier do snapshot.
              const rawGraceUntil = userData.pending_boleto_until
              const pendingBoletoUntil =
                rawGraceUntil && typeof rawGraceUntil.toDate === "function"
                  ? rawGraceUntil.toDate()
                  : rawGraceUntil instanceof Date
                    ? rawGraceUntil
                    : null

              setUser({
                id: firebaseUser.uid,
                name: userData.name || firebaseUser.displayName || "",
                email: firebaseUser.email || "",
                company: userData.company || "",
                role: "admin",
                permissions: userData.permissions || {
                  canCreate: true,
                  canRead: true,
                  canUpdate: true,
                  canDelete: true,
                },
                plan_type: userData.plan_type ?? null,
                max_trucks: userData.max_trucks ?? null,
                subscription_status: userData.subscription_status ?? null,
                stripe_customer_id: userData.stripe_customer_id ?? null,
                stripe_subscription_id: userData.stripe_subscription_id ?? null,
                onboarding_completed: userData.onboarding_completed ?? false,
                pending_boleto_until: pendingBoletoUntil,
                isSuperAdmin: userData.isSuperAdmin === true || isSuperAdminEmail(firebaseUser.email),
              })

              // Se a assinatura está ativa mas max_trucks não foi gravado (ex: webhook atrasado),
              // sincroniza com o Stripe uma única vez para recuperar o valor correto.
              if (
                userData.subscription_status === "active" &&
                (userData.max_trucks == null || userData.max_trucks === 0) &&
                !syncAttemptedRef.current &&
                firebaseUser.email
              ) {
                syncAttemptedRef.current = true
                fetch(`/api/stripe/sync-subscription?userId=${firebaseUser.uid}&email=${encodeURIComponent(firebaseUser.email)}`)
                  .then((r) => r.json())
                  .catch(() => null)
              }
            } else {
              // Sem documento na coleção users — pode ser super-admin a meio
              // do bootstrap. Tenta reparar via endpoint server-side e
              // aguarda o snapshot disparar de novo quando o doc aparecer.
              if (isSuperAdminEmail(firebaseUser.email)) {
                fetch("/api/admin/bootstrap", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: firebaseUser.email }),
                }).catch((e) => console.error("[auth] bootstrap reparo falhou:", e))
                // Não desloga — espera o snapshot reabrir com o doc reparado
                return
              }
              signOut(auth)
              setUser(null)
            }
            setIsLoading(false)
          },
          (error) => {
            console.error("Erro ao observar dados do usuário:", error)
            // Em caso de erro, não conceder acesso
            signOut(auth)
            setUser(null)
            setIsLoading(false)
          },
        )
      } else {
        setUser(null)
        syncAttemptedRef.current = false
        setIsLoading(false)
      }
    })

    return () => {
      unsubscribe()
      if (unsubscribeUserDoc) unsubscribeUserDoc()
    }
  }, [])

  const login = useCallback(
    async (email: string, password: string, userName?: string): Promise<boolean> => {
      if (isAuthenticating) return false

      setIsAuthenticating(true)
      try {
        if (!auth) {
          throw new Error("Firebase Auth não está configurado")
        }

        // Bootstrap server-side do super-admin antes de tentar o login.
        // O endpoint usa o Admin SDK (ignora rules), garante que o usuário
        // existe no Firebase Auth com SUPER_ADMIN_PASSWORD e que o doc
        // users/{uid} tenha role: "admin" e isSuperAdmin: true.
        // Idempotente — pode ser chamado em todo login sem efeitos colaterais.
        if (isSuperAdminEmail(email)) {
          try {
            const res = await fetch("/api/admin/bootstrap", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email }),
            })
            if (!res.ok) {
              const data = await res.json().catch(() => ({}))
              console.error("[auth] bootstrap super-admin falhou:", data?.error)
            }
          } catch (bootstrapErr) {
            console.error("[auth] bootstrap super-admin erro de rede:", bootstrapErr)
          }
        }

        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        const firebaseUser = userCredential.user

        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))

        if (!userDoc.exists()) {
          await signOut(auth)
          return false
        }

        const userData = userDoc.data()
        const role = userData.role

        // Bloqueia login se role não for exatamente "admin" (incluindo undefined/null)
        if (role !== "admin") {
          await signOut(auth)
          return false
        }

        // Verifica se o UID pertence a um motorista (doc espúrio criado pelo bug do nativo)
        const driverSnap = await getDocs(
          query(collection(db, "drivers"), where("uid", "==", firebaseUser.uid), limit(1))
        )
        if (!driverSnap.empty) {
          await signOut(auth)
          return false
        }

        return true
      } catch (error) {
        return false
      } finally {
        setIsAuthenticating(false)
      }
    },
    [isAuthenticating],
  )

  const register = useCallback(
    async (name: string, email: string, password: string, company: string): Promise<boolean> => {
      if (isAuthenticating) return false

      setIsAuthenticating(true)

      // App secundário isolado: createUserWithEmailAndPassword no app principal
      // dispara onAuthStateChanged antes do setDoc completar — o listener não
      // encontraria o doc em users/ e deslogaria o usuário recém-criado, deixando
      // uma conta órfã no Firebase Auth sem documento no Firestore.
      const secondaryApp = initializeApp(firebaseApp.options, `register-${Date.now()}`)
      const secondaryAuth = getAuth(secondaryApp)
      // Firestore precisa estar vinculado ao mesmo app do auth — senão o
      // request.auth visto pelas rules é o do app principal (não autenticado),
      // e o setDoc em users/{uid} falha com permission-denied.
      const secondaryDb = getFirestore(secondaryApp)

      try {
        if (!auth) {
          throw new Error("Firebase Auth não está configurado")
        }

        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password)
        const firebaseUser = userCredential.user

        await updateProfile(firebaseUser, { displayName: name })

        await setDoc(doc(secondaryDb, "users", firebaseUser.uid), {
          name,
          email,
          company,
          role: "admin",
          permissions: {
            canCreate: true,
            canRead: true,
            canUpdate: true,
            canDelete: true,
          },
          createdAt: new Date(),
        })

        await signOut(secondaryAuth)

        // Agora sim — autentica no app principal com o doc já existindo.
        await signInWithEmailAndPassword(auth, email, password)

        return true
      } catch (error) {
        console.error("Erro no registro:", error)
        return false
      } finally {
        await deleteApp(secondaryApp).catch(() => null)
        setIsAuthenticating(false)
      }
    },
    [isAuthenticating],
  )

  const logout = useCallback(async () => {
    try {
      if (!auth) {
        throw new Error("Firebase Auth não está configurado")
      }

      await signOut(auth)
      setUser(null)
    } catch (error) {
      // Handle error silently
    }
  }, [])

  const updateUserData = async (name: string, company: string): Promise<boolean> => {
    try {
      if (!auth || !auth.currentUser || !user) {
        throw new Error("Usuário não autenticado ou Firebase não configurado")
      }

      // Atualiza o perfil no Firebase Auth
      await updateProfile(auth.currentUser, { displayName: name })

      // Atualiza dados adicionais no Firestore
      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        {
          name,
          company,
        },
        { merge: true },
      )

      // Atualiza o estado local
      setUser((prev) => (prev ? { ...prev, name, company } : null))

      return true
    } catch (error) {
      console.error("Erro ao atualizar dados do usuário:", error)
      return false
    }
  }

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      if (!auth) {
        throw new Error("Firebase Auth não está configurado")
      }

      await sendPasswordResetEmail(auth, email)
      return true
    } catch (error) {
      console.error("Erro ao redefinir senha:", error)
      return false
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      if (!auth || !auth.currentUser || !auth.currentUser.email) {
        throw new Error("Usuário não autenticado ou Firebase não configurado")
      }

      // Reautentica com a senha atual antes de permitir a troca
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword)
      await reauthenticateWithCredential(auth.currentUser, credential)

      await updatePassword(auth.currentUser, newPassword)
      return true
    } catch (error) {
      console.error("Erro ao alterar senha:", error)
      return false
    }
  }

  const createCollaborator = async (name: string, email: string, password: string, role: "admin" | "collaborator" = "collaborator"): Promise<boolean> => {
    // Usa um app Firebase secundário para criar o colaborador sem deslogar o admin.
    // createUserWithEmailAndPassword no app principal troca a sessão ativa — o app
    // secundário é isolado e descartado logo após o uso.
    const secondaryApp = initializeApp(firebaseApp.options, `collab-${Date.now()}`)
    const secondaryAuth = getAuth(secondaryApp)

    try {
      if (!user || user.role !== "admin") {
        throw new Error("Apenas administradores podem criar colaboradores")
      }

      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password)
      const firebaseUser = userCredential.user

      await updateProfile(firebaseUser, { displayName: name })

      await setDoc(doc(db, "collaborators", firebaseUser.uid), {
        name,
        email,
        adminId: user.id,
        adminEmail: user.email,
        company: user.company,
        role: role,
        permissions: role === "admin" ? {
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: true,
        } : {
          canCreate: true,
          canRead: true,
          canUpdate: false,
          canDelete: false,
        },
        createdAt: new Date(),
      })

      await signOut(secondaryAuth)
      await deleteApp(secondaryApp) // Destroi a instância evitando memory leak e sobrecarga silenciosa
      return true
    } catch (error) {
      console.error("Erro ao criar colaborador:", error)
      return false
    } finally {
      await deleteApp(secondaryApp)
    }
  }

  const getCollaborators = async (): Promise<User[]> => {
    try {
      if (!user) {
        return []
      }

      const adminId = user.role === "admin" ? user.id : user.adminId

      if (!adminId) {
        return []
      }

      const collaboratorsQuery = query(collection(db, "collaborators"), where("adminId", "==", adminId))
      const snapshot = await getDocs(collaboratorsQuery)

      return snapshot.docs
        .filter((doc) => !doc.data().deleted) // Exclude deleted collaborators
        .map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          email: doc.data().email,
          company: doc.data().company,
          role: doc.data().role || "collaborator",
          adminId: doc.data().adminId,
          permissions: doc.data().permissions,
        }))
    } catch (error) {
      return []
    }
  }

  const updateCollaborator = async (
    collaboratorId: string,
    name: string,
    email: string,
    password?: string,
    role?: "admin" | "collaborator",
  ): Promise<boolean> => {
    try {
      if (!user || user.role !== "admin") {
        throw new Error("Apenas administradores podem atualizar colaboradores")
      }

      const updateData: any = { name, email }

      if (role) {
        updateData.role = role
        updateData.permissions = role === "admin" ? {
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: true,
        } : {
          canCreate: true,
          canRead: true,
          canUpdate: false,
          canDelete: false,
        }
      }

      if (password) {
        // Nota: Em produção, seria necessário reautenticar o colaborador para alterar a senha
        // Esta é uma implementação simplificada
      }

      await setDoc(doc(db, "collaborators", collaboratorId), updateData, { merge: true })
      return true
    } catch (error) {
      console.error("Erro ao atualizar colaborador:", error)
      return false
    }
  }

  const deleteCollaborator = async (collaboratorId: string): Promise<boolean> => {
    try {
      if (!user || user.role !== "admin") {
        throw new Error("Apenas administradores podem excluir colaboradores")
      }

      await setDoc(doc(db, "collaborators", collaboratorId), { deleted: true }, { merge: true })
      return true
    } catch (error) {
      console.error("Erro ao excluir colaborador:", error)
      return false
    }
  }

  const createDriverAccess = async (
    driverId: string,
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user || user.role !== "admin") {
        return { success: false, error: "Apenas administradores podem criar acesso de motoristas" }
      }

      const response = await fetch("/api/driver-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", driverId, email, password, adminId: user.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error === "email-already-exists") {
          return { success: false, error: "Este email já está em uso no sistema" }
        }
        if (data.error === "Motorista já possui acesso ao app") {
          return { success: false, error: "Motorista já possui acesso ao app" }
        }
        return { success: false, error: data.error || "Erro ao criar acesso" }
      }

      return { success: true }
    } catch (error) {
      console.error("Erro ao criar acesso de motorista:", error)
      return { success: false, error: "Erro inesperado ao criar acesso" }
    }
  }

  const resetDriverPassword = async (
    driverId: string,
    newPassword: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user || user.role !== "admin") {
        return { success: false, error: "Apenas administradores podem redefinir senhas de motoristas" }
      }

      const response = await fetch("/api/driver-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", driverId, password: newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || "Erro ao redefinir senha" }
      }

      return { success: true }
    } catch (error) {
      console.error("Erro ao redefinir senha do motorista:", error)
      return { success: false, error: "Erro inesperado ao redefinir senha" }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        updateUserData,
        resetPassword,
        changePassword,
        createCollaborator,
        getCollaborators,
        updateCollaborator,
        deleteCollaborator,
        createDriverAccess,
        resetDriverPassword,
        isLoading,
        isAuthenticating,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider")
  }
  return context
}
