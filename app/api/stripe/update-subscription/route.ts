import { NextRequest, NextResponse } from "next/server"
import { stripe, STRIPE_PRICE_IDS, PLAN_PRICES } from "@/lib/stripe"
import { getAdminDb } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, planType, truckCount } = body

    if (!userId || !planType) {
      return NextResponse.json({ error: "Parâmetros obrigatórios ausentes" }, { status: 400 })
    }

    if (planType !== "basic" && planType !== "custom") {
      return NextResponse.json({ error: "Tipo de plano inválido" }, { status: 400 })
    }

    if (planType === "custom" && (!truckCount || truckCount < 1)) {
      return NextResponse.json({ error: "Quantidade de caminhões inválida" }, { status: 400 })
    }

    const db = getAdminDb()
    const userDoc = await db.collection("users").doc(userId).get()
    const userData = userDoc.data()

    if (!userData?.stripe_subscription_id) {
      return NextResponse.json({ error: "Assinatura não encontrada" }, { status: 404 })
    }

    const subscriptionId = userData.stripe_subscription_id
    const maxTrucks = planType === "basic" ? PLAN_PRICES.basic.maxTrucks : truckCount

    // Busca a assinatura atual no Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const subscriptionItem = subscription.items.data[0]

    if (!subscriptionItem) {
      return NextResponse.json({ error: "Item da assinatura não encontrado" }, { status: 404 })
    }

    const newPriceId = planType === "basic" ? STRIPE_PRICE_IDS.basic : STRIPE_PRICE_IDS.custom
    const newQuantity = planType === "basic" ? 1 : truckCount

    // Atualiza a assinatura no Stripe
    await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscriptionItem.id,
          price: newPriceId,
          quantity: newQuantity,
        },
      ],
      metadata: {
        userId,
        planType,
        maxTrucks: String(maxTrucks),
      },
      proration_behavior: "create_prorations",
    })

    // Atualiza o Firestore diretamente (sem esperar pelo webhook)
    await db.collection("users").doc(userId).set(
      {
        plan_type: planType,
        max_trucks: maxTrucks,
        subscription_status: "active",
      },
      { merge: true },
    )

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido"
    console.error("Erro ao atualizar assinatura:", message)
    return NextResponse.json({ error: "Erro interno ao atualizar assinatura" }, { status: 500 })
  }
}
