import { NextRequest, NextResponse } from "next/server"
import { stripe, STRIPE_PRICE_ID } from "@/lib/stripe"
import { getAdminDb } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, userEmail, truckCount } = body

    if (!userId || !userEmail || !truckCount || truckCount < 1) {
      return NextResponse.json({ error: "Parâmetros obrigatórios ausentes" }, { status: 400 })
    }

    const proto = request.headers.get("x-forwarded-proto") ?? "http"
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host")
    const appUrl = host
      ? `${proto}://${host}`
      : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")

    // --- Busca stripe_customer_id salvo no Firestore ---
    let stripeCustomerId: string | undefined

    try {
      const db = getAdminDb()
      const userDoc = await db.collection("users").doc(userId).get()
      const savedCustomerId = userDoc.data()?.stripe_customer_id

      if (savedCustomerId) {
        try {
          const customer = await stripe.customers.retrieve(savedCustomerId)
          if (!customer.deleted) {
            stripeCustomerId = savedCustomerId
          }
        } catch {
          // Customer não existe mais — cria novo abaixo
        }
      }
    } catch {
      // Firestore indisponível
    }

    if (!stripeCustomerId && process.env.STRIPE_SECRET_KEY) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { userId },
      })
      stripeCustomerId = customer.id
    }

    // --- DEVELOPMENT FALLBACK ---
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn("[CHECKOUT] Stripe SDK não configurado. Simulando pagamento...")
      try {
        const db = getAdminDb()
        await db.collection("users").doc(userId).set({
          subscription_status: "active",
          plan_type: "frotas",
          max_trucks: truckCount,
          stripe_customer_id: "mock_customer_123",
          stripe_subscription_id: "mock_sub_123",
        }, { merge: true })
      } catch (err) {
        console.error("Modo Dev Fake Falhou:", err)
      }
      return NextResponse.json({ url: `${appUrl}/plans/success?session_id=fake_dev_session_123` })
    }

    // --- Cria Checkout com tiered price e quantity ---
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      line_items: [{ price: STRIPE_PRICE_ID, quantity: truckCount }],

      allow_promotion_codes: true,

      payment_method_types: ["card", "boleto"],
      payment_method_options: {
        // Alinhado com a janela de 5 dias de acesso ao sistema após geração
        // do boleto. Passado esse prazo, a subscription vira incomplete_expired
        // no Stripe e o ProtectedRoute bloqueia o usuário.
        boleto: { expires_after_days: 5 },
      },

      success_url: `${appUrl}/plans/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/plans`,

      metadata: {
        userId,
        maxTrucks: String(truckCount),
      },

      subscription_data: {
        metadata: {
          userId,
          maxTrucks: String(truckCount),
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
