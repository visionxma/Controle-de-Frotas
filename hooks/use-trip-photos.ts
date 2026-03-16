"use client"

import { useState } from "react"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { storage, db } from "@/lib/firebase"
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"
import type { TripPhoto } from "./use-trips"

export function useTripPhotos() {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadPhoto = async (
    tripId: string,
    file: File,
    description?: string,
    type?: "cargo" | "receipt" | "other",
  ): Promise<TripPhoto | null> => {
    try {
      console.log("[v0] Upload iniciado - tripId:", tripId, "file:", file.name)
      setIsUploading(true)
      setError(null)

      if (!file.type.startsWith("image/")) {
        console.log("[v0] Erro: arquivo não é imagem")
        setError("Por favor, selecione um arquivo de imagem válido")
        return null
      }

      const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
      if (file.size > MAX_FILE_SIZE) {
        console.log("[v0] Erro: arquivo muito grande")
        setError("A imagem não pode ser maior que 5MB")
        return null
      }

      // Create a unique filename with proper path structure
      const timestamp = Date.now()
      const sanitizedFilename = file.name.replace(/[^a-z0-9.-]/gi, "_").toLowerCase()
      const filename = `trips/${tripId}/${timestamp}_${sanitizedFilename}`
      console.log("[v0] Caminho do arquivo:", filename)

      const storageRef = ref(storage, filename)
      console.log("[v0] Referência do storage criada")

      // Upload file to Firebase Storage
      console.log("[v0] Iniciando upload para Firebase Storage...")
      await uploadBytes(storageRef, file, {
        contentType: file.type,
      })
      console.log("[v0] Upload concluído")

      // Get download URL
      console.log("[v0] Obtendo URL de download...")
      const url = await getDownloadURL(storageRef)
      console.log("[v0] URL obtida:", url)

      // Create photo object
      const photo: TripPhoto = {
        id: `${timestamp}`,
        url,
        uploadedAt: new Date().toISOString(),
        description,
        type: type || "other",
      }
      console.log("[v0] Objeto photo criado:", photo)

      // Update trip document with new photo
      console.log("[v0] Atualizando documento da viagem...")
      const tripRef = doc(db, "trips", tripId)
      await updateDoc(tripRef, {
        photos: arrayUnion(photo),
      })
      console.log("[v0] Documento atualizado com sucesso")

      return photo
    } catch (err) {
      console.log("[v0] Erro durante upload:", err)
      const errorMessage = err instanceof Error ? err.message : "Erro ao fazer upload da foto"
      setError(errorMessage)
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const deletePhoto = async (tripId: string, photo: TripPhoto): Promise<boolean> => {
    try {
      setError(null)

      // Extract the path from the URL
      const decodedUrl = decodeURIComponent(photo.url)
      const pathMatch = decodedUrl.match(/\/o\/(.+?)\?/)
      if (!pathMatch) {
        setError("Não foi possível extrair o caminho do arquivo")
        return false
      }

      const filePath = pathMatch[1]
      const storageRef = ref(storage, filePath)

      // Delete from storage
      await deleteObject(storageRef)

      // Remove from trip document
      const tripRef = doc(db, "trips", tripId)
      await updateDoc(tripRef, {
        photos: arrayRemove(photo),
      })

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao deletar a foto"
      setError(errorMessage)
      return false
    }
  }

  return {
    uploadPhoto,
    deletePhoto,
    isUploading,
    error,
  }
}
