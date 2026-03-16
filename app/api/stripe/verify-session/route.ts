import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { getAdminDb } from "@/lib/firebase-admin"

export const dynamic = "force-dynamic"

/**
 * GET /api/stripe/verify-session?session_id=cs_live_xxx
 *
 * Verifica diretamente no Stripe se o pagamento foi aprovado e,
 * em caso positivo, ativa a assinatura no Firestore.
 *
 * Isso elimina a dependência exclusiva do webhook para a ativação inicial —
 * se o webhook falhar (secret errado, Firebase indisponível no momento),
 * a página de sucesso ainda consegue ativar a assinatura.
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id")

  if (!sessionId) {
    return NextResponse.json({ error: "session_id obrigatório" }, { status: 400 })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    // Pagamento não aprovado — informa o cliente sem ativar nada
    const paymentOk =
      session.payment_status === "paid" ||
      session.payment_status === "no_payment_required"

    if (!paymentOk) {
      return NextResponse.json({
        activated: false,
        payment_status: session.payment_status,
      })
    }

    const userId = session.metadata?.userId
    if (!userId) {
      console.error("[verify-session] Sessão sem userId nos metadados:", sessionId)
      return NextResponse.json({ error: "Sessão sem dados do usuário" }, { status: 400 })
    }

    const planType = session.metadata?.planType ?? null
    const maxTrucks = parseInt(session.metadata?.maxTrucks ?? "0", 10)

    // Ativa a assinatura no Firestore
    const db = getAdminDb()
    await db
      .collection("users")
      .doc(userId)
      .set(
        {
          subscription_status: "active",
          plan_type: planType,
          max_trucks: maxTrucks > 0 ? maxTrucks : null,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
        },
        { merge: true },
      )

    console.log(`[verify-session] Assinatura ATIVADA — userId=${userId}, plano=${planType}`)

    return NextResponse.json({
      activated: true,
      plan_type: planType,
      max_trucks: maxTrucks > 0 ? maxTrucks : null,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido"
    console.error("[verify-session] Erro:", message)
    return NextResponse.json({ error: "Erro ao verificar sessão" }, { status: 500 })
  }
}
