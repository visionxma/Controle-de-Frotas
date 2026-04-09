import { NextRequest, NextResponse } from "next/server"
import { stripe, STRIPE_PRICE_ID } from "@/lib/stripe"
import { getAdminDb } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, truckCount } = body

    if (!userId || !truckCount || truckCount < 1) {
      return NextResponse.json({ error: "Parâmetros obrigatórios ausentes" }, { status: 400 })
    }

    const db = getAdminDb()
    const userDoc = await db.collection("users").doc(userId).get()
    const userData = userDoc.data()

    if (!userData?.stripe_subscription_id) {
      return NextResponse.json({ error: "Assinatura não encontrada" }, { status: 404 })
    }

    const subscriptionId = userData.stripe_subscription_id

    // Busca a assinatura atual no Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const subscriptionItem = subscription.items.data[0]

    if (!subscriptionItem) {
      return NextResponse.json({ error: "Item da assinatura não encontrado" }, { status: 404 })
    }

    // Atualiza a assinatura no Stripe — muda a quantity
    await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscriptionItem.id,
          price: STRIPE_PRICE_ID,
          quantity: truckCount,
        },
      ],
      metadata: {
        userId,
        maxTrucks: String(truckCount),
      },
      proration_behavior: "create_prorations",
    })

    // Atualiza o Firestore diretamente
    await db.collection("users").doc(userId).set(
      {
        plan_type: "frotas",
        max_trucks: truckCount,
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
