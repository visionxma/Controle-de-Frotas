"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTrucks } from "@/hooks/use-trucks"
import { useDrivers } from "@/hooks/use-drivers"
import type { Trip } from "@/hooks/use-trips"

interface TripFormProps {
  onSubmit: (data: Omit<Trip, "id" | "userId" | "status">) => void
  onCancel: () => void
  isLoading: boolean
}

export function TripForm({ onSubmit, onCancel, isLoading }: TripFormProps) {
  const { trucks } = useTrucks()
  const { drivers } = useDrivers()

  const [formData, setFormData] = useState({
    truckId: "",
    truckPlate: "",
    driverId: "",
    driverName: "",
    startLocation: "",
    startKm: "",
    startDate: "",
    startTime: "",
    cargoDescription: "",
  })

  useEffect(() => {
    const now = new Date()
    const date = now.toISOString().split("T")[0]
    const time = now.toTimeString().slice(0, 5)

    setFormData((prev) => ({
      ...prev,
      startDate: date,
      startTime: time,
    }))
  }, [])

  const availableTrucks = trucks.filter((truck) => truck.status === "active")
  const availableDrivers = drivers.filter((driver) => driver.status === "active")

  const handleTruckChange = (truckId: string) => {
    const selectedTruck = trucks.find((truck) => truck.id === truckId)
    setFormData((prev) => ({
      ...prev,
      truckId,
      truckPlate: selectedTruck?.plate || "",
    }))
  }

  const handleDriverChange = (driverId: string) => {
    const selectedDriver = drivers.find((driver) => driver.id === driverId)
    setFormData((prev) => ({
      ...prev,
      driverId,
      driverName: selectedDriver?.name || "",
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.truckId || !formData.driverId || !formData.startLocation || !formData.startKm) {
      return
    }

    onSubmit({
      truckId: formData.truckId,
      truckPlate: formData.truckPlate,
      driverId: formData.driverId,
      driverName: formData.driverName,
      startLocation: formData.startLocation,
      startKm: Number(formData.startKm),
      startDate: formData.startDate,
      startTime: formData.startTime,
      cargoDescription: formData.cargoDescription || undefined,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova Viagem</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Informações da Viagem</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="truck">Caminhão</Label>
                <Select value={formData.truckId} onValueChange={handleTruckChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um caminhão" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTrucks.map((truck) => (
                      <SelectItem key={truck.id} value={truck.id}>
                        {truck.plate} - {truck.brand} {truck.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="driver">Motorista</Label>
                <Select value={formData.driverId} onValueChange={handleDriverChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um motorista" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDrivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startLocation">Local de Saída</Label>
                <Input
                  id="startLocation"
                  value={formData.startLocation}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startLocation: e.target.value }))}
                  placeholder="Ex: São Paulo - SP"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startKm">Quilometragem Inicial</Label>
                <Input
                  id="startKm"
                  type="number"
                  value={formData.startKm}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startKm: e.target.value }))}
                  placeholder="Ex: 150000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Data de Saída</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime">Horário de Saída</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="cargoDescription">Descrição da Carga</Label>
              <Textarea
                id="cargoDescription"
                value={formData.cargoDescription}
                onChange={(e) => setFormData((prev) => ({ ...prev, cargoDescription: e.target.value }))}
                placeholder="Ex: 20 toneladas de arroz, 500 caixas de eletrônicos..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Descreva o tipo de carga, quantidade, peso ou outras informações relevantes
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Iniciar Viagem"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
