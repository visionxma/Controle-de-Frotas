import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { getAdminDb } from "@/lib/firebase-admin"

export const dynamic = "force-dynamic"

/**
 * GET /api/stripe/sync-subscription?userId=xxx&email=xxx
 *
 * Chamado pela página /plans quando o usuário está logado mas sem assinatura ativa.
 * Busca no Stripe se existe subscription ativa para esse email/customer e,
 * se encontrar, ativa no Firestore.
 *
 * Resolve o cenário de boleto pago (webhook que chegou mas falhou ao gravar
 * no Firestore) ou webhook nunca recebido.
 */
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId")
  const email = request.nextUrl.searchParams.get("email")

  if (!userId || !email) {
    return NextResponse.json({ error: "userId e email obrigatórios" }, { status: 400 })
  }

  try {
    // 1. Busca customer no Stripe pelo email
    const customers = await stripe.customers.list({ email, limit: 5 })

    if (customers.data.length === 0) {
      return NextResponse.json({ activated: false, reason: "Nenhum customer encontrado para este email" })
    }

    // 2. Verifica subscriptions ativas em todos os customers com esse email
    for (const customer of customers.data) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: "active",
        limit: 1,
      })

      if (subscriptions.data.length === 0) continue

      const subscription = subscriptions.data[0]
      const planType = subscription.metadata?.planType ?? null
      const maxTrucks = parseInt(subscription.metadata?.maxTrucks ?? "0", 10)

      // 3. Ativa no Firestore
      await getAdminDb()
        .collection("users")
        .doc(userId)
        .set(
          {
            subscription_status: "active",
            plan_type: planType,
            max_trucks: maxTrucks > 0 ? maxTrucks : null,
            stripe_customer_id: customer.id,
            stripe_subscription_id: subscription.id,
          },
          { merge: true },
        )

      console.log(`[sync-subscription] Assinatura sincronizada — userId=${userId}, sub=${subscription.id}`)

      return NextResponse.json({
        activated: true,
        plan_type: planType,
        max_trucks: maxTrucks > 0 ? maxTrucks : null,
      })
    }

    return NextResponse.json({ activated: false, reason: "Nenhuma subscription ativa encontrada no Stripe" })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido"
    console.error("[sync-subscription] Erro:", message)
    return NextResponse.json({ error: "Erro ao sincronizar assinatura" }, { status: 500 })
  }
}
