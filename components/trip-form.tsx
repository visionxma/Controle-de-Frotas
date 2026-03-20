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
import { CityAutocomplete } from "./city-autocomplete"
import { TruckIcon, User, MapPin, Calendar, Clock, Package, CheckCircle2, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
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
      startKm: selectedTruck?.mileage?.toString() || "",
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
    <Card className="rounded-sm border-white/10 overflow-hidden shadow-2xl">
      <CardHeader className="bg-muted/30 pb-6">
        <CardTitle className="text-xl font-black uppercase italic tracking-tight flex items-center gap-3">
          <TruckIcon className="h-6 w-6 text-primary" />
          Nova Viagem
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
                <div className="h-4 w-1 bg-primary rounded-full" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/80">Logística e Equipe</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="truck" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1 flex items-center gap-2">
                  <TruckIcon className="h-3 w-3 opacity-40" /> Caminhão Selecionado *
                </Label>
                <Select value={formData.truckId} onValueChange={handleTruckChange} required>
                  <SelectTrigger className="h-11 rounded-sm border-border/40 shadow-sm transition-all focus:ring-primary/20">
                    <SelectValue placeholder="Selecione um caminhão" />
                  </SelectTrigger>
                  <SelectContent className="rounded-sm border-white/10">
                    {availableTrucks.map((truck) => (
                      <SelectItem key={truck.id} value={truck.id} className="text-xs font-bold uppercase py-3">
                        {truck.plate} <span className="opacity-40 mx-2">•</span> {truck.brand} {truck.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="driver" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1 flex items-center gap-2">
                  <User className="h-3 w-3 opacity-40" /> Motorista Designado *
                </Label>
                <Select value={formData.driverId} onValueChange={handleDriverChange} required>
                  <SelectTrigger className="h-11 rounded-sm border-border/40 shadow-sm transition-all focus:ring-primary/20">
                    <SelectValue placeholder="Selecione um motorista" />
                  </SelectTrigger>
                  <SelectContent className="rounded-sm border-white/10">
                    {availableDrivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id} className="text-xs font-bold uppercase py-3">
                        {driver.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startLocation" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1 flex items-center gap-2">
                  <MapPin className="h-3 w-3 opacity-40" /> Local de Origem (Saída) *
                </Label>
                <CityAutocomplete
                   value={formData.startLocation}
                   onChange={(val) => setFormData(prev => ({ ...prev, startLocation: val }))}
                   placeholder="Cidade da partida..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startKm" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1 flex items-center gap-2">
                   <ChevronRight className="h-3 w-3 opacity-40" /> Quilometragem no Início *
                </Label>
                <div className="relative">
                    <Input
                      id="startKm"
                      type="number"
                      value={formData.startKm}
                      onChange={(e) => setFormData((prev) => ({ ...prev, startKm: e.target.value }))}
                      placeholder="Ex: 154200"
                      className="h-11 rounded-sm border-border/40 pl-10 font-black italic tracking-tighter text-lg"
                      required
                    />
                    <span className="absolute left-3 top-3 text-[10px] font-black text-muted-foreground/30 italic">KM</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1 flex items-center gap-2">
                  <Calendar className="h-3 w-3 opacity-40" /> Data de Partida *
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="h-11 rounded-sm border-border/40 shadow-sm focus-visible:ring-primary/10"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1 flex items-center gap-2">
                  <Clock className="h-3 w-3 opacity-40" /> Horário Previsto *
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                  className="h-11 rounded-sm border-border/40 shadow-sm focus-visible:ring-primary/10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="cargoDescription" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1 flex items-center gap-2">
                <Package className="h-3 w-3 opacity-40" /> Descrição Detalhada da Carga
              </Label>
              <Textarea
                id="cargoDescription"
                value={formData.cargoDescription}
                onChange={(e) => setFormData((prev) => ({ ...prev, cargoDescription: e.target.value }))}
                placeholder="Ex: 20 toneladas de soja, Fertilizantes ensacados..."
                className="rounded-sm border-border/40 min-h-[100px] resize-none focus:ring-primary/20 bg-muted/5 italic"
              />
              <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest italic flex items-center gap-2 mt-1 px-1">
                <CheckCircle2 className="h-3 w-3" /> Peso, quantidade ou observações de segurança
              </p>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
                type="submit" 
                disabled={isLoading}
                className="flex-1 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest italic rounded-sm transition-all shadow-xl shadow-primary/20 h-12"
            >
              Iniciar Operação de Transporte
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
