import Stripe from "stripe"

// Tabela de preços por faixa de caminhões (Volume Tiered Pricing)
// O preço por caminhão diminui conforme a frota cresce.
export const PRICE_TIERS = [
  { min: 1, max: 5, pricePerTruck: 120 },
  { min: 6, max: 10, pricePerTruck: 105 },
  { min: 11, max: 15, pricePerTruck: 90 },
  { min: 16, max: 18, pricePerTruck: 80 },
  { min: 19, max: Infinity, pricePerTruck: 75 },
] as const

// Calcula o preço unitário por caminhão baseado na quantidade total (volume pricing)
export function getPricePerTruck(truckCount: number): number {
  const tier = PRICE_TIERS.find(t => truckCount >= t.min && truckCount <= t.max)
  return tier?.pricePerTruck ?? 75
}

// Calcula o total mensal
export function getMonthlyTotal(truckCount: number): number {
  return truckCount * getPricePerTruck(truckCount)
}

// Price ID do plano único com tiered pricing no Stripe
export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID ?? ""

// Inicialização lazy — evita throw em build time quando a env var não está disponível.
let _stripe: Stripe | null = null

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop: string | symbol) {
    if (!_stripe) {
      const key = process.env.STRIPE_SECRET_KEY
      if (!key) {
        throw new Error(
          "STRIPE_SECRET_KEY não está configurada nas variáveis de ambiente. " +
            "Adicione ela no .env.local (dev) ou nas variáveis do Vercel (produção).",
        )
      }
      _stripe = new Stripe(key, { apiVersion: "2026-02-25.clover" })
    }
    const value = (_stripe as unknown as Record<string | symbol, unknown>)[prop]
    return typeof value === "function" ? value.bind(_stripe) : value
  },
})
