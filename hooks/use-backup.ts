"use client"

import { useCallback } from "react"
import { collection, getDocs, doc, deleteDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"

export const useBackup = () => {
  const { user } = useAuth()

  const downloadBackup = useCallback(async () => {
    if (!user) return

    try {
      const collections = ["transactions", "trips", "trucks", "drivers"]
      const backupData: any = {
        exportDate: new Date().toISOString(),
        userId: user.uid,
        companyName: user.companyName,
        data: {},
      }

      // Export all collections
      for (const collectionName of collections) {
        const querySnapshot = await getDocs(collection(db, `users/${user.uid}/${collectionName}`))
        backupData.data[collectionName] = []

        querySnapshot.forEach((doc) => {
          backupData.data[collectionName].push({
            id: doc.id,
            ...doc.data(),
          })
        })
      }

      // Download as JSON file
      const dataStr = JSON.stringify(backupData, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)

      const link = document.createElement("a")
      link.href = url
      link.download = `backup-${user.companyName}-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      return true
    } catch (error) {
      console.error("Erro ao fazer backup:", error)
      return false
    }
  }, [user])

  const clearAllData = useCallback(async () => {
    if (!user) return false

    try {
      const collections = ["transactions", "trips", "trucks", "drivers"]

      for (const collectionName of collections) {
        const querySnapshot = await getDocs(collection(db, `users/${user.uid}/${collectionName}`))

        const deletePromises = querySnapshot.docs.map((document) =>
          deleteDoc(doc(db, `users/${user.uid}/${collectionName}`, document.id)),
        )

        await Promise.all(deletePromises)
      }

      return true
    } catch (error) {
      console.error("Erro ao limpar dados:", error)
      return false
    }
  }, [user])

  const importBackup = useCallback(
    async (backupData: any) => {
      if (!user || !backupData.data) return false

      try {
        const collections = ["transactions", "trips", "trucks", "drivers"]

        for (const collectionName of collections) {
          if (backupData.data[collectionName]) {
            const items = backupData.data[collectionName]

            for (const item of items) {
              const { id, ...data } = item
              await setDoc(doc(db, `users/${user.uid}/${collectionName}`, id), data)
            }
          }
        }

        return true
      } catch (error) {
        console.error("Erro ao importar backup:", error)
        return false
      }
    },
    [user],
  )

  return {
    downloadBackup,
    clearAllData,
    importBackup,
  }
}
