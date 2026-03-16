import admin from "firebase-admin"
import type { Firestore } from "firebase-admin/firestore"

let _db: Firestore | null = null

function getAdminDb(): Firestore {
  if (_db) return _db

  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")

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
