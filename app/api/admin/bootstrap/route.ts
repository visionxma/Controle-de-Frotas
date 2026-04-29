import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin"
import {
  SUPER_ADMIN_COMPANY,
  SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_NAME,
  SUPER_ADMIN_PASSWORD,
  isSuperAdminEmail,
} from "@/lib/admin-config"

export const dynamic = "force-dynamic"

/**
 * POST /api/admin/bootstrap
 *
 * Cria (ou repara) a conta super-admin do sistema:
 *  - Usuário no Firebase Auth com SUPER_ADMIN_PASSWORD
 *  - Doc em users/{uid} com role: "admin" e isSuperAdmin: true
 *
 * Idempotente — pode ser chamado várias vezes. Se a conta existir mas a senha
 * não bater com a esperada, redefine para SUPER_ADMIN_PASSWORD.
 *
 * Acessível sem autenticação porque: o email/senha são fixos e públicos
 * só para o dono do sistema, e o endpoint só atua sobre a conta cujo email
 * é exatamente SUPER_ADMIN_EMAIL.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const email: string = body?.email || SUPER_ADMIN_EMAIL

    if (!isSuperAdminEmail(email)) {
      return NextResponse.json(
        { error: "Endpoint só atua sobre o super-admin" },
        { status: 403 },
      )
    }

    let auth: ReturnType<typeof getAdminAuth>
    let db: ReturnType<typeof getAdminDb>
    try {
      auth = getAdminAuth()
      db = getAdminDb()
    } catch (sdkErr: any) {
      console.error("[admin/bootstrap] SDK não configurado:", sdkErr.message)
      return NextResponse.json(
        { error: "Firebase Admin SDK não configurado: " + sdkErr.message },
        { status: 500 },
      )
    }

    // 1. Garante o usuário no Firebase Auth
    let uid: string
    try {
      const existing = await auth.getUserByEmail(SUPER_ADMIN_EMAIL)
      uid = existing.uid
      // Sempre garante que a senha é a esperada — assim o login a partir
      // do front com SUPER_ADMIN_PASSWORD funciona mesmo se o doc tiver
      // sido alterado manualmente.
      await auth.updateUser(uid, {
        password: SUPER_ADMIN_PASSWORD,
        displayName: SUPER_ADMIN_NAME,
        emailVerified: true,
      })
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        const created = await auth.createUser({
          email: SUPER_ADMIN_EMAIL,
          password: SUPER_ADMIN_PASSWORD,
          displayName: SUPER_ADMIN_NAME,
          emailVerified: true,
        })
        uid = created.uid
      } else {
        console.error("[admin/bootstrap] erro auth:", err)
        return NextResponse.json(
          { error: "Erro ao preparar conta: " + (err.message || err.code) },
          { status: 500 },
        )
      }
    }

    // 2. Garante o doc em users/{uid} com role: "admin" e flag de super-admin
    await db.collection("users").doc(uid).set(
      {
        name: SUPER_ADMIN_NAME,
        email: SUPER_ADMIN_EMAIL,
        company: SUPER_ADMIN_COMPANY,
        role: "admin",
        isSuperAdmin: true,
        permissions: {
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: true,
        },
        updatedAt: new Date(),
      },
      { merge: true },
    )

    // Garante createdAt apenas se ainda não existir
    const doc = await db.collection("users").doc(uid).get()
    if (!doc.data()?.createdAt) {
      await db.collection("users").doc(uid).set({ createdAt: new Date() }, { merge: true })
    }

    console.log("[admin/bootstrap] super-admin pronto, uid:", uid)
    return NextResponse.json({ success: true, uid })
  } catch (err: any) {
    console.error("[admin/bootstrap] erro geral:", err)
    return NextResponse.json(
      { error: err?.message || "Erro interno" },
      { status: 500 },
    )
  }
}
