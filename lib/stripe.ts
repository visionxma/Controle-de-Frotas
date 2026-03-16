import Stripe from "stripe"

// Metadados dos planos (usados no frontend e para validação)
export const PLAN_PRICES = {
  basic: {
    unitAmount: 3900, // R$39,00
    maxTrucks: 2,
    name: "Plano Básico",
    description: "Até 2 caminhões",
  },
  custom: {
    unitAmount: 2000, // R$20,00 por caminhão
    name: "Plano Personalizado",
  },
} as const

// Price IDs persistentes criados no Stripe Dashboard
export const STRIPE_PRICE_IDS = {
  basic: process.env.STRIPE_BASIC_PRICE_ID ?? "",
  custom: process.env.STRIPE_CUSTOM_PRICE_ID ?? "",
}

// Inicialização lazy — evita throw em build time quando a env var não está disponível.
// O erro só acontece em runtime, quando a API é realmente chamada.
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
