import admin from "firebase-admin"
import type { Firestore } from "firebase-admin/firestore"

let _db: Firestore | null = null

function getAdminDb(): Firestore {
  if (_db) return _db

  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL

    // Aceita a chave nos dois formatos comuns no Vercel:
    // 1) Com \n literais: "-----BEGIN PRIVATE KEY-----\nMII..."
    // 2) Com aspas envolvendo o valor: '"-----BEGIN PRIVATE KEY-----\nMII..."'
    const rawKey = process.env.FIREBASE_PRIVATE_KEY ?? ""
    const privateKey = rawKey
      .replace(/^"([\s\S]*)"$/, "$1") // remove aspas externas se existirem
      .replace(/\\n/g, "\n")          // converte \n literal em quebra de linha real

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        "Firebase Admin SDK não configurado. Adicione FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY no .env.local. " +
          "Gere as credenciais em: Firebase Console > Configurações do projeto > Contas de serviço > Gerar nova chave privada",
      )
    }

    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    })
  }

  _db = admin.firestore()
  return _db
}

export { getAdminDb }
