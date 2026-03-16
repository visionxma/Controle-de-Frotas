import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { getAdminDb } from "@/lib/firebase-admin"
import Stripe from "stripe"

export const dynamic = "force-dynamic"

// Atualiza o documento do usuário no Firestore via Admin SDK
async function updateUserSubscription(
  userId: string,
  data: {
    subscription_status: string
    plan_type?: string | null
    max_trucks?: number | null
    stripe_customer_id?: string
    stripe_subscription_id?: string
  },
) {
  const userRef = getAdminDb().collection("users").doc(userId)
  await userRef.set(data, { merge: true })
}

// Extrai userId dos metadados de um objeto Stripe qualquer
function getUserId(metadata: Stripe.Metadata | null): string | null {
  return metadata?.userId ?? null
}

// Na API 2026-02-25.clover o campo invoice.subscription foi movido para
// invoice.parent.subscription_details.subscription. Este helper suporta ambas as versões.
function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const inv = invoice as any
  return (
    inv.parent?.subscription_details?.subscription ??
    inv.subscription ??
    null
  )
}

// billing_reason também pode estar em inv.billing_details.type nas versões mais recentes
function getInvoiceBillingReason(invoice: Stripe.Invoice): string | null {
  const inv = invoice as any
  return inv.billing_reason ?? inv.billing_details?.type ?? null
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature") ?? ""
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET não configurado")
    return NextResponse.json({ error: "Webhook secret não configurado" }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error("[webhook] Assinatura inválida:", error)
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 400 })
  }

  console.log(`[webhook] Evento recebido: ${event.type}`)

  try {
    switch (event.type) {
      // ---------------------------------------------------------------
      // Pagamento aprovado no Checkout
      // CORREÇÃO: verifica payment_status === 'paid' antes de ativar.
      // Para boleto/pix, o session.complete dispara antes do pagamento.
      // ---------------------------------------------------------------
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode !== "subscription") break

        // Aceita tanto "paid" (pagamento normal) quanto "no_payment_required"
        // (cupom 100%, período gratuito, valor zerado).
        // Adia apenas se o pagamento está genuinamente pendente (ex: boleto).
        const paymentOk =
          session.payment_status === "paid" ||
          session.payment_status === "no_payment_required"

        if (!paymentOk) {
          console.log(`[webhook] Session ${session.id} — payment_status=${session.payment_status}, aguardando invoice.paid`)
          break
        }

        const userId = getUserId(session.metadata)
        if (!userId) {
          console.error("[webhook] checkout.session.completed sem userId nos metadados")
          break
        }

        const planType = session.metadata?.planType ?? null
        const maxTrucks = parseInt(session.metadata?.maxTrucks ?? "0", 10)

        await updateUserSubscription(userId, {
          subscription_status: "active",
          plan_type: planType,
          max_trucks: maxTrucks > 0 ? maxTrucks : null,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
        })

        console.log(`[webhook] Assinatura ATIVADA — userId=${userId}, plano=${planType}, max_trucks=${maxTrucks}`)
        break
      }

      // ---------------------------------------------------------------
      // Fatura paga com sucesso (cobre renovações mensais e boleto/pix)
      // Este é o evento mais confiável para ativar/manter assinaturas.
      // ---------------------------------------------------------------
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = getInvoiceSubscriptionId(invoice)
        const billingReason = getInvoiceBillingReason(invoice)

        if (!subscriptionId || billingReason === "subscription_create") {
          // subscription_create é coberto pelo checkout.session.completed
          break
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const userId = getUserId(subscription.metadata)
        if (!userId) break

        const planType = subscription.metadata?.planType ?? null
        const maxTrucks = parseInt(subscription.metadata?.maxTrucks ?? "0", 10)

        await updateUserSubscription(userId, {
          subscription_status: "active",
          plan_type: planType,
          max_trucks: maxTrucks > 0 ? maxTrucks : null,
          stripe_subscription_id: subscription.id,
        })

        console.log(`[webhook] Renovação confirmada — userId=${userId}, plano=${planType}`)
        break
      }

      // ---------------------------------------------------------------
      // Status da subscription mudou (inadimplência, upgrade, etc.)
      // ---------------------------------------------------------------
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription

        const userId = getUserId(subscription.metadata)
        if (!userId) break

        const planType = subscription.metadata?.planType ?? null
        const maxTrucks = parseInt(subscription.metadata?.maxTrucks ?? "0", 10)

        await updateUserSubscription(userId, {
          subscription_status: subscription.status,
          plan_type: planType,
          max_trucks: maxTrucks > 0 ? maxTrucks : null,
          stripe_subscription_id: subscription.id,
        })

        console.log(`[webhook] Subscription atualizada — userId=${userId}, status=${subscription.status}`)
        break
      }

      // ---------------------------------------------------------------
      // Assinatura cancelada ou expirada
      // ---------------------------------------------------------------
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription

        const userId = getUserId(subscription.metadata)
        if (!userId) break

        await updateUserSubscription(userId, {
          subscription_status: "canceled",
          plan_type: null,
          max_trucks: null,
        })

        console.log(`[webhook] Assinatura CANCELADA — userId=${userId}`)
        break
      }

      // ---------------------------------------------------------------
      // Pagamento de fatura falhou (cartão expirado, recusado, etc.)
      // ---------------------------------------------------------------
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = getInvoiceSubscriptionId(invoice)

        if (!subscriptionId) break

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const userId = getUserId(subscription.metadata)
        if (!userId) break

        await updateUserSubscription(userId, {
          subscription_status: "past_due",
        })

        console.log(`[webhook] Pagamento FALHOU — userId=${userId}`)
        break
      }

      default:
        // Evento não tratado — ignora silenciosamente
        break
    }

    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido"
    console.error(`[webhook] Erro ao processar ${event.type}:`, message)
    return NextResponse.json({ error: "Erro ao processar evento" }, { status: 500 })
  }
}
