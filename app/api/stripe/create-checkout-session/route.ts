import { NextRequest, NextResponse } from "next/server"
import { stripe, STRIPE_PRICE_IDS, PLAN_PRICES } from "@/lib/stripe"
import { getAdminDb } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, userEmail, planType, truckCount } = body

    // --- Validação de entrada ---
    if (!userId || !userEmail || !planType) {
      return NextResponse.json({ error: "Parâmetros obrigatórios ausentes" }, { status: 400 })
    }

    if (planType !== "basic" && planType !== "custom") {
      return NextResponse.json({ error: "Tipo de plano inválido" }, { status: 400 })
    }

    if (planType === "custom" && (!truckCount || truckCount < 1)) {
      return NextResponse.json({ error: "Quantidade de caminhões inválida" }, { status: 400 })
    }

    // Prioridade: headers do request > NEXT_PUBLIC_APP_URL > fallback localhost
    // Os headers sempre refletem o host real que recebeu a requisição (Vercel, localhost etc.)
    // NEXT_PUBLIC_APP_URL é útil apenas quando rodando atrás de proxies que não passam x-forwarded-host.
    const proto = request.headers.get("x-forwarded-proto") ?? "http"
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host")
    const appUrl = host
      ? `${proto}://${host}`
      : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
    const maxTrucks = planType === "basic" ? PLAN_PRICES.basic.maxTrucks : truckCount

    // --- Busca stripe_customer_id salvo no Firestore (evita lookup por email) ---
    let stripeCustomerId: string | undefined

    try {
      const db = getAdminDb()
      const userDoc = await db.collection("users").doc(userId).get()
      const savedCustomerId = userDoc.data()?.stripe_customer_id

      if (savedCustomerId) {
        // Verifica se o customer ainda existe no Stripe
        try {
          const customer = await stripe.customers.retrieve(savedCustomerId)
          if (!customer.deleted) {
            stripeCustomerId = savedCustomerId
          }
        } catch {
          // Customer não existe mais no Stripe — cria novo abaixo
        }
      }
    } catch {
      // Firestore indisponível — continua sem customer salvo
    }

    // Se não tem customer salvo ou ele não existe mais, cria um novo
    if (!stripeCustomerId && process.env.STRIPE_SECRET_KEY) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { userId },
      })
      stripeCustomerId = customer.id
    }

    // --- DEVELOPMENT FALLBACK: MOCK CHECKOUT SE FALTAR CHAVE ---
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn("[CHECKOUT] Stripe SDK não configurado. Simulando pagamento automático na base de dados para testes...")
      try {
        const db = getAdminDb()
        await db.collection("users").doc(userId).set({
           subscription_status: "active",
           plan_type: planType,
           max_trucks: maxTrucks,
           stripe_customer_id: "mock_customer_123",
           stripe_subscription_id: "mock_sub_123"
        }, { merge: true })
      } catch (err) {
        console.error("Modo Dev Fake Falhou (Firebase Admin missing?):", err)
      }
      return NextResponse.json({ url: `${appUrl}/plans/success?session_id=fake_dev_session_123` })
    }

    // --- Monta line items usando Price IDs persistentes ---
    const lineItems =
      planType === "basic"
        ? [{ price: STRIPE_PRICE_IDS.basic, quantity: 1 }]
        : [{ price: STRIPE_PRICE_IDS.custom, quantity: truckCount }]

    // --- Cria a Checkout Session ---
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      line_items: lineItems,

      // Habilita o campo de código promocional no formulário do Stripe
      allow_promotion_codes: true,

      success_url: `${appUrl}/plans/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/plans`,

      // Metadados na session (para checkout.session.completed)
      metadata: {
        userId,
        planType,
        maxTrucks: String(maxTrucks),
      },

      // Metadados na subscription (para customer.subscription.updated / invoice.paid)
      subscription_data: {
        metadata: {
          userId,
          planType,
          maxTrucks: String(maxTrucks),
        },
      },

      locale: "pt-BR",
    })

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido"
    console.error("Erro ao criar checkout session:", message)
    return NextResponse.json({ error: "Erro interno ao criar sessão de pagamento" }, { status: 500 })
  }
}
