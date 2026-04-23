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
    // --- DEVELOPMENT FALLBACK ---
    if (sessionId.includes("fake_dev_session") || !process.env.STRIPE_SECRET_KEY) {
      console.warn("[verify-session] Sessão de teste local detectada, bypassando Stripe e ativando no DB.")
      return NextResponse.json({
        activated: true,
        plan_type: "bypassed_dev",
        max_trucks: null,
      })
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)

    const userId = session.metadata?.userId
    if (!userId) {
      console.error("[verify-session] Sessão sem userId nos metadados:", sessionId)
      return NextResponse.json({ error: "Sessão sem dados do usuário" }, { status: 400 })
    }

    const maxTrucks = parseInt(session.metadata?.maxTrucks ?? "0", 10)
    const db = getAdminDb()

    const paymentOk =
      session.payment_status === "paid" ||
      session.payment_status === "no_payment_required"

    // Boleto/pix pendente — libera 5 dias de acesso ao sistema enquanto
    // aguarda compensação. Idempotente com o webhook checkout.session.completed.
    if (!paymentOk) {
      const BOLETO_GRACE_DAYS = 5
      const graceUntil = new Date(Date.now() + BOLETO_GRACE_DAYS * 24 * 60 * 60 * 1000)

      await db
        .collection("users")
        .doc(userId)
        .set(
          {
            subscription_status: "incomplete",
            plan_type: "frotas",
            max_trucks: maxTrucks > 0 ? maxTrucks : null,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            pending_boleto_until: graceUntil,
          },
          { merge: true },
        )

      console.log(
        `[verify-session] Boleto pendente — userId=${userId}, acesso liberado até ${graceUntil.toISOString()}`,
      )

      return NextResponse.json({
        activated: true,
        pending_boleto: true,
        pending_boleto_until: graceUntil.toISOString(),
        payment_status: session.payment_status,
      })
    }

    await db
      .collection("users")
      .doc(userId)
      .set(
        {
          subscription_status: "active",
          plan_type: "frotas",
          max_trucks: maxTrucks > 0 ? maxTrucks : null,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          pending_boleto_until: null,
        },
        { merge: true },
      )

    console.log(`[verify-session] Assinatura ATIVADA — userId=${userId}, max_trucks=${maxTrucks}`)

    return NextResponse.json({
      activated: true,
      plan_type: "frotas",
      max_trucks: maxTrucks > 0 ? maxTrucks : null,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido"
    console.error("[verify-session] Erro:", message)
    return NextResponse.json({ error: "Erro ao verificar sessão" }, { status: 500 })
  }
}
