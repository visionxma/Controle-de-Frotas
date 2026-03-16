// lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getAnalytics, isSupported } from "firebase/analytics"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyAVy9QpK6NELrLS4oYSXNDO8uXt_GAoVVs",
  authDomain: "controledefrotas-a21b7.firebaseapp.com",
  projectId: "controledefrotas-a21b7",
  storageBucket: "controledefrotas-a21b7.firebasestorage.app",
  messagingSenderId: "602147690838",
  appId: "1:602147690838:web:7421d938e7db7d41a69ef7",
  measurementId: "G-89KWMWCQ83",
}

// Inicialização segura do Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()

// Inicializa Auth e Firestore
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

// Analytics - inicialização condicional sem await
let analytics = null
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) analytics = getAnalytics(app)
  })
}

export { app, auth, db, analytics, storage }
export default app
