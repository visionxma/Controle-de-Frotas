"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Trip } from "@/hooks/use-trips"
import { useTrucks } from "@/hooks/use-trucks"

interface CompleteTripProps {
  trip: Trip
  onSubmit: (data: {
    endLocation: string
    endKm: number
    endDate: string
    endTime: string
    refuelingLiters: number
    fuelConsumption: number
  }) => void
  onCancel: () => void
  isLoading: boolean
}

export function CompleteTrip({ trip, onSubmit, onCancel, isLoading }: CompleteTripProps) {
  const { trucks } = useTrucks()
  const [formData, setFormData] = useState({
    endLocation: "",
    endKm: "",
    endDate: "",
    endTime: "",
    refuelingLiters: "",
    fuelConsumption: "",
  })

  const currentTruck = trucks.find((t) => t.id === trip.truckId)

  useEffect(() => {
    const now = new Date()
    const date = now.toISOString().split("T")[0]
    const time = now.toTimeString().slice(0, 5)

    setFormData((prev) => ({
      ...prev,
      endDate: date,
      endTime: time,
    }))
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.endLocation || !formData.endKm || !formData.refuelingLiters || !formData.fuelConsumption) {
      return
    }

    const endKmValue = Number.parseInt(formData.endKm, 10)
    const refuelingLitersValue = Number.parseFloat(formData.refuelingLiters)
    const fuelConsumptionValue = Number.parseFloat(formData.fuelConsumption)

    if (isNaN(endKmValue) || endKmValue <= trip.startKm) {
      alert("A quilometragem final deve ser maior que a inicial")
      return
    }

    if (isNaN(refuelingLitersValue) || refuelingLitersValue <= 0) {
      alert("A quantidade de abastecimento deve ser maior que zero")
      return
    }

    if (isNaN(fuelConsumptionValue) || fuelConsumptionValue <= 0) {
      alert("O consumo médio deve ser maior que zero")
      return
    }

    onSubmit({
      endLocation: formData.endLocation,
      endKm: endKmValue,
      endDate: formData.endDate,
      endTime: formData.endTime,
      refuelingLiters: refuelingLitersValue,
      fuelConsumption: fuelConsumptionValue,
    })
  }

  const kmTraveled = formData.endKm ? Number.parseInt(formData.endKm, 10) - trip.startKm : 0

  // Calculate fuel consumed: distance / consumption (km/L) = liters consumed
  const fuelConsumed =
    formData.fuelConsumption && kmTraveled > 0 ? kmTraveled / Number.parseFloat(formData.fuelConsumption) : 0

  // Calculate remaining fuel: refueling amount - fuel consumed
  const remainingFuel =
    formData.refuelingLiters && fuelConsumed > 0
      ? Math.max(0, Number.parseFloat(formData.refuelingLiters) - fuelConsumed)
      : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Finalizar Viagem</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Informações da Viagem</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Caminhão:</span> {trip.truckPlate}
            </div>
            <div>
              <span className="text-muted-foreground">Motorista:</span> {trip.driverName}
            </div>
            <div>
              <span className="text-muted-foreground">Saída:</span> {trip.startLocation}
            </div>
            <div>
              <span className="text-muted-foreground">KM Inicial:</span> {trip.startKm.toLocaleString()}
            </div>
            <div>
              <span className="text-muted-foreground">Data/Hora Saída:</span>{" "}
              {new Date(`${trip.startDate}T${trip.startTime}`).toLocaleString("pt-BR")}
            </div>
            {currentTruck?.currentFuelLevel !== undefined && (
              <div>
                <span className="text-muted-foreground">Combustível Atual:</span>{" "}
                {currentTruck.currentFuelLevel.toFixed(1)} L
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Dados de Chegada</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="endLocation">Local de Chegada</Label>
                <Input
                  id="endLocation"
                  value={formData.endLocation}
                  onChange={(e) => setFormData((prev) => ({ ...prev, endLocation: e.target.value }))}
                  placeholder="Ex: Rio de Janeiro - RJ"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endKm">Quilometragem Final</Label>
                <Input
                  id="endKm"
                  type="number"
                  step="1"
                  value={formData.endKm}
                  onChange={(e) => {
                    const value = e.target.value
                    setFormData((prev) => ({ ...prev, endKm: value }))
                  }}
                  placeholder="Ex: 150500"
                  min={trip.startKm + 1}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Data de Chegada</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                  min={trip.startDate}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">Horário de Chegada</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="refuelingLiters">Abastecimento Total (Litros)</Label>
                <Input
                  id="refuelingLiters"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.refuelingLiters}
                  onChange={(e) => setFormData((prev) => ({ ...prev, refuelingLiters: e.target.value }))}
                  placeholder="Ex: 250.5"
                  required
                />
                <p className="text-xs text-muted-foreground">Quantidade total de combustível abastecido na viagem</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuelConsumption">Consumo Médio do Caminhão (km/L)</Label>
                <Input
                  id="fuelConsumption"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.fuelConsumption}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fuelConsumption: e.target.value }))}
                  placeholder="Ex: 3.5"
                  required
                />
                <p className="text-xs text-muted-foreground">Informe quantos km o caminhão faz por litro</p>
              </div>

              {kmTraveled > 0 && (
                <div className="space-y-2">
                  <Label>Quilômetros Percorridos</Label>
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <span className="text-lg font-semibold text-primary">{kmTraveled.toLocaleString()} km</span>
                  </div>
                </div>
              )}

              {kmTraveled > 0 && formData.refuelingLiters && formData.fuelConsumption && (
                <div className="space-y-2 md:col-span-2">
                  <Label>Resumo do Consumo</Label>
                  <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Consumo Médio:</span>
                        <div className="text-2xl font-bold text-primary">{formData.fuelConsumption} km/L</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Combustível Consumido:</span>
                        <div className="text-lg font-semibold text-orange-700">{fuelConsumed.toFixed(2)} L</div>
                        <p className="text-xs text-muted-foreground">
                          ({kmTraveled} km ÷ {formData.fuelConsumption} km/L)
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Combustível Restante:</span>
                        <div className="text-lg font-semibold text-blue-700">{remainingFuel.toFixed(2)} L</div>
                        <p className="text-xs text-muted-foreground">
                          ({formData.refuelingLiters} L - {fuelConsumed.toFixed(2)} L)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Finalizando..." : "Finalizar Viagem"}
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
