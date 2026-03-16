import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY não está configurada nas variáveis de ambiente")
}

// Versão pinada compatível com SDK v20 e sem breaking changes do clover
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
})

// Price IDs persistentes criados no Stripe Dashboard (não mudam entre checkouts)
export const STRIPE_PRICE_IDS = {
  basic: process.env.STRIPE_BASIC_PRICE_ID!,
  custom: process.env.STRIPE_CUSTOM_PRICE_ID!,
}

// Metadados dos planos (usados apenas no frontend e para validação)
export const PLAN_PRICES = {
  basic: {
    unitAmount: 3900, // R$39,00 — apenas referência, o valor real vem do Price ID
    maxTrucks: 2,
    name: "Plano Básico",
    description: "Até 2 caminhões",
  },
  custom: {
    unitAmount: 2000, // R$20,00 por caminhão — apenas referência
    name: "Plano Personalizado",
  },
} as const
