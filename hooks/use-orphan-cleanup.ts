"use client"

import { useEffect, useRef } from "react"
import { useTransactions } from "./use-transactions"
import { useTrips } from "./use-trips"
import { useRentals } from "./use-rentals"

/**
 * Faxina automática de transações órfãs.
 *
 * Contexto: antes do cascade delete, apagar uma viagem (ou locação) deixava as
 * transações vinculadas vivas no Firestore, com `tripId`/`rentalId` apontando
 * para documentos inexistentes. Esses órfãos apareciam no Financeiro e no
 * Dashboard rotulados como "Viagem (removida)".
 *
 * Esta limpeza:
 *  1. Só roda depois de `transactions`, `trips` e `rentals` terminarem de carregar.
 *  2. Roda uma única vez por sessão (flag `done` na ref).
 *  3. Apaga do Firestore as transações com `tripId`/`rentalId` órfãos.
 *  4. Logs discretos no console — erros não quebram a UI.
 */
export function useOrphanCleanup() {
  const { transactions, deleteTransaction, isLoading: txLoading } = useTransactions()
  const { trips, isLoading: tripsLoading } = useTrips()
  const { rentals, isLoading: rentalsLoading } = useRentals()
  // Guarda dos ids já processados nesta sessão — evita reentrar em loop caso
  // o onSnapshot dispare antes do servidor confirmar a exclusão.
  const processedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (txLoading || tripsLoading || rentalsLoading) return
    if (!transactions.length) return

    const tripIds = new Set(trips.map((t) => t.id))
    const rentalIds = new Set(rentals.map((r) => r.id))

    const orphans = transactions.filter((t) => {
      if (processedRef.current.has(t.id)) return false
      if (t.tripId && !tripIds.has(t.tripId)) return true
      if (t.rentalId && !rentalIds.has(t.rentalId)) return true
      return false
    })

    if (orphans.length === 0) return

    console.log(
      `[orphan-cleanup] Apagando ${orphans.length} transação(ões) órfã(s) (viagem/locação já removida).`,
    )

    // Apaga em paralelo — erros individuais não bloqueiam o restante.
    orphans.forEach((tx) => {
      processedRef.current.add(tx.id)
      deleteTransaction(tx.id).catch((err) => {
        console.warn(`[orphan-cleanup] Falha ao apagar transação ${tx.id}:`, err)
      })
    })
  }, [transactions, trips, rentals, txLoading, tripsLoading, rentalsLoading, deleteTransaction])
}
