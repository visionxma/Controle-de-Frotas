"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Trip } from "@/hooks/use-trips"
import { useTrucks } from "@/hooks/use-trucks"
import { CityAutocomplete } from "./city-autocomplete"
import { cn } from "@/lib/utils"
import { MapPin, Info, ArrowRight, Gauge, Fuel, CheckCircle2 } from "lucide-react"

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
    <Card className="rounded-sm border-white/10 overflow-hidden shadow-2xl">
      <CardHeader className="bg-muted/30 pb-6 border-b border-white/5">
        <CardTitle className="text-xl font-black uppercase italic tracking-tight flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          Finalizar Viagem
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-8">
        <div className="mb-8 p-6 bg-zinc-900/50 rounded-sm border border-white/5 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Info className="h-24 w-24 text-white" />
          </div>
          
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
            <Info className="h-3 w-3" /> Resumo da Operação em Aberto
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm relative z-10">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Veículo</span>
              <span className="font-black text-xs uppercase italic">{trip.truckPlate}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Condutor</span>
              <span className="font-black text-xs uppercase italic">{trip.driverName}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Ponto de Partida</span>
              <span className="font-black text-xs uppercase italic">{trip.startLocation}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Hodômetro Inicial</span>
              <span className="font-black text-xs uppercase italic">{trip.startKm.toLocaleString()} KM</span>
            </div>
            <div className="space-y-1 col-span-2">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Início da Jornada</span>
              <span className="font-black text-xs uppercase italic">
                {new Date(`${trip.startDate}T${trip.startTime}`).toLocaleString("pt-BR")}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
             <div className="flex items-center gap-2 mb-2">
                <div className="h-4 w-1 bg-emerald-500 rounded-full" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/80">Dados de Encerramento</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="endLocation" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1 flex items-center gap-2">
                   <MapPin className="h-3 w-3 opacity-40" /> Local de Chegada (Destino) *
                </Label>
                <CityAutocomplete
                   value={formData.endLocation}
                   onChange={(val) => setFormData(prev => ({ ...prev, endLocation: val }))}
                   placeholder="Cidade de destino..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endKm" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1 flex items-center gap-2">
                  <Gauge className="h-3 w-3 opacity-40" /> Quilometragem Final *
                </Label>
                <div className="relative">
                    <Input
                      id="endKm"
                      type="number"
                      step="1"
                      value={formData.endKm}
                      onChange={(e) => setFormData((prev) => ({ ...prev, endKm: e.target.value }))}
                      placeholder="Ex: 154850"
                      min={trip.startKm + 1}
                      className="h-11 rounded-sm border-border/40 pl-10 font-black italic tracking-tighter text-lg"
                      required
                    />
                    <span className="absolute left-3 top-3 text-[10px] font-black text-muted-foreground/30 italic">KM</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                   Data de Chegada *
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                  min={trip.startDate}
                  className="h-11 rounded-sm border-border/40 shadow-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                  Horário de Chegada *
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                  className="h-11 rounded-sm border-border/40 shadow-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="refuelingLiters" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1 flex items-center gap-2">
                  <Fuel className="h-3.5 w-3.5 opacity-40" /> Abastecimento em Rota (Litros) *
                </Label>
                <div className="relative">
                    <Input
                      id="refuelingLiters"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.refuelingLiters}
                      onChange={(e) => setFormData((prev) => ({ ...prev, refuelingLiters: e.target.value }))}
                      placeholder="0.0"
                      className="h-11 rounded-sm border-border/40 pl-10 font-black italic tracking-tighter text-lg"
                      required
                    />
                    <span className="absolute left-3 top-3 text-[10px] font-black text-muted-foreground/30 italic">L</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuelConsumption" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                   Média Consumo do Veículo (KM/L) *
                </Label>
                <Input
                  id="fuelConsumption"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.fuelConsumption}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fuelConsumption: e.target.value }))}
                  placeholder="Ex: 3.5"
                  className="h-11 rounded-sm border-border/40 font-black italic tracking-tighter text-lg"
                  required
                />
              </div>

              {kmTraveled > 0 && (
                <div className="md:col-span-2 mt-4 space-y-4">
                  <div className="flex items-center gap-4">
                      <div className="flex-1 h-px bg-white/5" />
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic">Análise de Performance</span>
                      <div className="flex-1 h-px bg-white/5" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-zinc-900/40 p-4 rounded-sm border border-white/5 flex flex-col justify-between">
                         <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Distância Percorrida</span>
                         <span className="text-xl font-black text-primary italic">
                            {kmTraveled.toLocaleString()} <span className="text-[10px] opacity-40">KM</span>
                         </span>
                    </div>

                    <div className="bg-zinc-900/40 p-4 rounded-sm border border-white/5 flex flex-col justify-between">
                         <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Combustível Consumido</span>
                         <span className="text-xl font-black text-orange-500 italic">
                            {fuelConsumed.toFixed(1)} <span className="text-[10px] opacity-40">L</span>
                         </span>
                    </div>

                    <div className="bg-zinc-900/40 p-4 rounded-sm border border-white/5 flex flex-col justify-between">
                         <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Total Abastecido</span>
                         <span className="text-xl font-black text-blue-500 italic">
                            {formData.refuelingLiters || "0"} <span className="text-[10px] opacity-40">L</span>
                         </span>
                    </div>

                    <div className="bg-emerald-500/10 p-4 rounded-sm border border-emerald-500/20 flex flex-col justify-between">
                         <span className="text-[8px] font-bold text-emerald-500/60 uppercase tracking-widest block mb-1">Saldo no Tanque</span>
                         <span className={cn("text-xl font-black italic", remainingFuel > 0 ? "text-emerald-500" : "text-red-500")}>
                            {remainingFuel.toFixed(1)} <span className="text-[10px] opacity-40">L</span>
                         </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
                type="submit" 
                disabled={isLoading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest italic rounded-sm transition-all shadow-xl shadow-emerald-500/20 h-12"
            >
              Confirmar Encerramento e Calcular Saldo
            </Button>
            <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                className="rounded-sm border-white/10 hover:bg-white/5 font-bold uppercase text-[10px] tracking-widest px-8"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
