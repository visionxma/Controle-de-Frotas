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
import { doc, setDoc, getDoc, collection, query, where, getDocs, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

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
  plan_type?: "basic" | "custom" | null
  max_trucks?: number | null
  subscription_status?: "active" | "inactive" | "past_due" | "canceled" | null
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  onboarding_completed?: boolean
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
              const role = userData.role || "admin"

              if (role !== "admin") {
                signOut(auth)
                setUser(null)
                setIsLoading(false)
                return
              }

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
              setUser({
                id: firebaseUser.uid,
                name: firebaseUser.displayName || "",
                email: firebaseUser.email || "",
                company: "",
                role: "admin",
                permissions: {
                  canCreate: true,
                  canRead: true,
                  canUpdate: true,
                  canDelete: true,
                },
                subscription_status: null,
              })
            }
            setIsLoading(false)
          },
          (error) => {
            console.error("Erro ao observar dados do usuário:", error)
            setUser({
              id: firebaseUser.uid,
              name: firebaseUser.displayName || "",
              email: firebaseUser.email || "",
              company: "",
              role: "admin",
              permissions: {
                canCreate: true,
                canRead: true,
                canUpdate: true,
                canDelete: true,
              },
              subscription_status: null,
            })
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

        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        const firebaseUser = userCredential.user

        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))

        if (!userDoc.exists()) {
          await signOut(auth)
          return false
        }

        const userData = userDoc.data()
        const role = userData.role || "admin"

        // Block login if user is not an admin
        if (role !== "admin") {
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
      try {
        if (!auth) {
          throw new Error("Firebase Auth não está configurado")
        }

        // Cria o usuário no Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const firebaseUser = userCredential.user

        await updateProfile(firebaseUser, { displayName: name })

        await setDoc(doc(db, "users", firebaseUser.uid), {
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

        return true
      } catch (error) {
        console.error("Erro no registro:", error)
        return false
      } finally {
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
