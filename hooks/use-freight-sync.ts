"use client"

import { useEffect, useRef } from "react"
import { useTransactions } from "./use-transactions"
import { useTrips } from "./use-trips"

/**
 * Sincronização reversa: garante que toda entrada em `trip.freightEntries`
 * tenha uma transação (receita/frete) correspondente em `transactions`.
 *
 * Contexto: o fluxo normal cria a transação no mesmo momento em que o frete
 * é gravado na viagem. Mas existem cenários onde isso não aconteceu:
 *   - Viagens criadas antes do fix que faz `addTrip` também criar a transação.
 *   - Migração legada (handleAddFreight cria entry para o freightValue antigo
 *     sem gerar a transação linkada).
 *   - Erros pontuais no write da transação.
 *
 * Resultado desses casos: o frete aparece em trip-details mas fica invisível
 * no Financeiro/Dashboard (que leem só de `transactions`). Este hook detecta
 * e preenche o gap em background.
 *
 * Guarda `processedRef` evita loop enquanto o onSnapshot confirma a criação.
 */
export function useFreightSync() {
  const { transactions, addTransaction, isLoading: txLoading } = useTransactions()
  const { trips, isLoading: tripsLoading } = useTrips()
  const processedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (txLoading || tripsLoading) return

    // Conjunto de freightEntryIds que JÁ têm transação — pulamos esses.
    const synced = new Set(
      transactions
        .filter((t) => t.freightEntryId)
        .map((t) => t.freightEntryId as string),
    )

    trips.forEach((trip) => {
      if (!trip.freightEntries?.length) return

      trip.freightEntries.forEach((entry) => {
        if (!entry.id) return
        if (synced.has(entry.id)) return
        if (processedRef.current.has(entry.id)) return
        if (!entry.value || entry.value <= 0) return

        processedRef.current.add(entry.id)

        const routeLabel = entry.origin && entry.destination
          ? `${entry.origin} → ${entry.destination}`
          : entry.origin || entry.destination || ""
        const descParts = [entry.description, routeLabel].filter(Boolean).join(" — ")

        // Usa timestamp do entry como data da transação (ou hoje como fallback).
        let txDate: string
        try {
          txDate = new Date(entry.timestamp || Date.now()).toISOString().split("T")[0]
        } catch {
          txDate = new Date().toISOString().split("T")[0]
        }

        console.log(
          `[freight-sync] Criando transação faltante para frete ${entry.id} (viagem ${trip.id}, R$ ${entry.value})`,
        )

        addTransaction({
          type: "receita",
          description: descParts
            ? `Frete — ${descParts}`
            : `Frete da viagem #${trip.id.slice(-6)}`,
          amount: entry.value,
          date: txDate,
          category: "frete",
          tripId: trip.id,
          truckId: trip.truckId,
          driverId: trip.driverId,
          freightEntryId: entry.id,
        }).catch((err) => {
          console.warn(`[freight-sync] Falha ao criar transação para frete ${entry.id}:`, err)
          // Remove do processedRef para tentar novamente em render futuro
          processedRef.current.delete(entry.id)
        })
      })
    })
  }, [transactions, trips, txLoading, tripsLoading, addTransaction])
}
