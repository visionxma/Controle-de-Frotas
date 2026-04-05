import { NextRequest, NextResponse } from "next/server"
import { getAdminDb, getAdminAuth } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, driverId, email, password, adminId } = body

    console.log("[driver-access] body recebido:", { action, driverId, email, adminId, passwordLen: password?.length })

    if (!action || !driverId) {
      return NextResponse.json({ error: "Parâmetros obrigatórios ausentes" }, { status: 400 })
    }

    let db: ReturnType<typeof getAdminDb>
    let auth: ReturnType<typeof getAdminAuth>
    try {
      db = getAdminDb()
      auth = getAdminAuth()
    } catch (sdkErr: any) {
      console.error("[driver-access] ERRO SDK:", sdkErr.message)
      return NextResponse.json({ error: "Erro de configuração do servidor: " + sdkErr.message }, { status: 500 })
    }

    const driverDoc = await db.collection("drivers").doc(driverId).get()
    if (!driverDoc.exists) {
      return NextResponse.json({ error: "Motorista não encontrado" }, { status: 404 })
    }

    const driverData = driverDoc.data()!

    if (action === "create") {
      if (!email || !password || !adminId) {
        return NextResponse.json({ error: "Email, senha e adminId são obrigatórios" }, { status: 400 })
      }

      if (driverData.hasAppAccess && driverData.uid) {
        return NextResponse.json({ error: "Motorista já possui acesso ao app" }, { status: 400 })
      }

      let uid: string
      try {
        console.log("[driver-access] criando usuário no Firebase Auth:", email)
        const userRecord = await auth.createUser({ email, password })
        uid = userRecord.uid
        console.log("[driver-access] novo usuário criado:", uid)
      } catch (error: any) {
        if (error.code === "auth/email-already-exists") {
          // Email já existe no Firebase Auth — recuperar o UID existente
          console.log("[driver-access] email já existe, recuperando UID existente...")
          const existingUser = await auth.getUserByEmail(email)
          uid = existingUser.uid

          // Verificar se esse UID é de um admin
          const adminDoc = await db.collection("users").doc(uid).get()
          if (adminDoc.exists) {
            console.log("[driver-access] BLOQUEADO: UID pertence a um admin")
            return NextResponse.json(
              { error: "Este email já está em uso por um administrador do sistema" },
              { status: 400 },
            )
          }

          // Verificar se esse UID é de um colaborador ativo
          const collabDoc = await db.collection("collaborators").doc(uid).get()
          if (collabDoc.exists && !collabDoc.data()?.deleted) {
            console.log("[driver-access] BLOQUEADO: UID pertence a um colaborador")
            return NextResponse.json(
              { error: "Este email já está em uso por um colaborador do sistema" },
              { status: 400 },
            )
          }

          // Atualizar a senha da conta existente para a nova senha definida pelo admin
          await auth.updateUser(uid, { password })
          console.log("[driver-access] reutilizando conta existente e atualizando senha, uid:", uid)
        } else {
          console.error("[driver-access] ERRO ao criar usuário:", error.code, error.message)
          return NextResponse.json({ error: "Erro ao criar conta: " + error.message }, { status: 500 })
        }
      }

      await db.collection("drivers").doc(driverId).update({
        uid,
        email,
        hasAppAccess: true,
        role: "driver",
        adminId,
        updatedAt: new Date(),
      })

      console.log("[driver-access] documento do motorista atualizado com sucesso, uid:", uid)
      return NextResponse.json({ success: true, uid })
    }

    if (action === "reset") {
      if (!password) {
        return NextResponse.json({ error: "Nova senha é obrigatória" }, { status: 400 })
      }

      if (!driverData.uid) {
        return NextResponse.json({ error: "Motorista não possui acesso ao app" }, { status: 400 })
      }

      console.log("[driver-access] redefinindo senha para uid:", driverData.uid)
      await auth.updateUser(driverData.uid, { password })

      await db.collection("drivers").doc(driverId).update({
        updatedAt: new Date(),
      })

      console.log("[driver-access] senha redefinida com sucesso")
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
  } catch (error: any) {
    console.error("[driver-access] ERRO GERAL:", error)
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 })
  }
}
