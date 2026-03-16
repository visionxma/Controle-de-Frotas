"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, Upload, Trash2, ImageIcon, X, AlertCircle } from "lucide-react"
import type { TripPhoto } from "@/hooks/use-trips"
import { useTripPhotos } from "@/hooks/use-trip-photos"
import { useToast } from "@/hooks/use-toast"

interface TripPhotoGalleryProps {
  tripId: string
  photos: TripPhoto[]
  canEdit?: boolean
}

export function TripPhotoGallery({ tripId, photos = [], canEdit = true }: TripPhotoGalleryProps) {
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [photoDescription, setPhotoDescription] = useState("")
  const [photoType, setPhotoType] = useState<"cargo" | "receipt" | "other">("other")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<TripPhoto | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const { uploadPhoto, deletePhoto, isUploading, error } = useTripPhotos()
  const { toast } = useToast()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    console.log("[v0] Arquivo selecionado:", file?.name)
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
        console.log("[v0] Preview criado")
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    console.log("[v0] handleUpload chamado - selectedFile:", selectedFile?.name)
    if (!selectedFile) {
      console.log("[v0] Nenhum arquivo selecionado")
      return
    }

    console.log("[v0] Chamando uploadPhoto...")
    const photo = await uploadPhoto(tripId, selectedFile, photoDescription, photoType)
    console.log("[v0] uploadPhoto retornou:", photo)

    if (photo) {
      toast({
        title: "Foto enviada",
        description: "A foto foi adicionada à galeria com sucesso.",
      })
      setShowUploadDialog(false)
      resetForm()
    } else {
      console.log("[v0] Upload falhou - error:", error)
      toast({
        title: "Erro ao enviar foto",
        description: error || "Não foi possível fazer upload da foto.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (photo: TripPhoto) => {
    if (!confirm("Tem certeza que deseja excluir esta foto?")) return

    const success = await deletePhoto(tripId, photo)

    if (success) {
      toast({
        title: "Foto excluída",
        description: "A foto foi removida da galeria.",
      })
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
    setPhotoDescription("")
    setPhotoType("other")
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (cameraInputRef.current) cameraInputRef.current.value = ""
  }

  const getPhotoTypeLabel = (type?: string) => {
    switch (type) {
      case "cargo":
        return "Carga"
      case "receipt":
        return "Comprovante"
      default:
        return "Outro"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Galeria de Fotos
          </CardTitle>
          {canEdit && (
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Adicionar Foto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Adicionar Foto</DialogTitle>
                  <DialogDescription>Tire uma foto ou selecione uma imagem da galeria</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {previewUrl && (
                    <div className="relative">
                      <img
                        src={previewUrl || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button size="sm" variant="destructive" className="absolute top-2 right-2" onClick={resetForm}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => cameraInputRef.current?.click()} disabled={isUploading}>
                      <Camera className="h-4 w-4 mr-2" />
                      Câmera
                    </Button>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                      <Upload className="h-4 w-4 mr-2" />
                      Galeria
                    </Button>
                  </div>

                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {selectedFile && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="photoType">Tipo de Foto</Label>
                        <Select value={photoType} onValueChange={(value: any) => setPhotoType(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cargo">Carga</SelectItem>
                            <SelectItem value="receipt">Comprovante de Pagamento</SelectItem>
                            <SelectItem value="other">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Descrição (opcional)</Label>
                        <Input
                          id="description"
                          value={photoDescription}
                          onChange={(e) => setPhotoDescription(e.target.value)}
                          placeholder="Ex: Carga de arroz"
                        />
                      </div>

                      <Button onClick={handleUpload} disabled={isUploading} className="w-full">
                        {isUploading ? "Enviando..." : "Enviar Foto"}
                      </Button>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {photos.length === 0 ? (
          <div className="text-center py-8">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Nenhuma foto adicionada ainda</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group">
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      className="w-full aspect-square rounded-lg overflow-hidden border hover:border-primary transition-colors"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <img
                        src={photo.url || "/placeholder.svg"}
                        alt={photo.description || "Foto da viagem"}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>{photo.description || "Foto da viagem"}</DialogTitle>
                      <DialogDescription>
                        {getPhotoTypeLabel(photo.type)} • {new Date(photo.uploadedAt).toLocaleDateString("pt-BR")}
                      </DialogDescription>
                    </DialogHeader>
                    <img
                      src={photo.url || "/placeholder.svg"}
                      alt={photo.description || "Foto da viagem"}
                      className="w-full rounded-lg"
                    />
                  </DialogContent>
                </Dialog>

                {canEdit && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(photo)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}

                <div className="mt-1">
                  <p className="text-xs text-muted-foreground truncate">{getPhotoTypeLabel(photo.type)}</p>
                  {photo.description && <p className="text-xs truncate">{photo.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
