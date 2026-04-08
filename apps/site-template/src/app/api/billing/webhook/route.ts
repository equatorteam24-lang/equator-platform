import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/service'
import {
  verifyWebhookSignature,
  buildWebhookResponse,
  type Plan,
} from '@/lib/wayforpay'

function addMonths(date: Date, n: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + n)
  return d
}

export async function POST(req: NextRequest) {
  let data: Record<string, unknown>
  try { data = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Verify signature
  if (!verifyWebhookSignature(data)) {
    console.error('[billing/webhook] Invalid signature', { orderReference: data.orderReference })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const orderId        = String(data.orderReference ?? '')
  const transactionStatus = String(data.transactionStatus ?? '')
  const transactionId  = String(data.transactionId ?? '')
  const recToken       = data.recToken ? String(data.recToken) : null
  const recTokenLifetime = data.recTokenLifetime ? String(data.recTokenLifetime) : null
  const reason         = data.reason ? String(data.reason) : null

  const db = createServiceClient()

  // Find the pending payment record
  const { data: payment } = await db
    .from('payment_history')
    .select('id, org_id, subscription_id, plan')
    .eq('wayforpay_order_id', orderId)
    .single()

  if (!payment) {
    console.error('[billing/webhook] Payment record not found', { orderId })
    return NextResponse.json(buildWebhookResponse(orderId, 'accept'))
  }

  const approved = transactionStatus === 'Approved'
  const plan = payment.plan as Plan

  // Update payment record
  await db.from('payment_history').update({
    status:                   approved ? 'approved' : 'declined',
    wayforpay_transaction_id: transactionId,
    wayforpay_reason:         reason,
    wayforpay_rec_token:      recToken,
  }).eq('id', payment.id)

  if (approved) {
    const now = new Date()
    const nextBilling = plan === 'annual'
      ? addMonths(now, 12)
      : addMonths(now, 1)

    // Upsert subscription
    await db.from('subscriptions').upsert({
      org_id:             payment.org_id,
      plan,
      status:             'active',
      amount:             plan === 'annual' ? 100 : 15,
      currency:           'USD',
      rec_token:          recToken,
      rec_token_lifetime: recTokenLifetime
        ? new Date(Number(recTokenLifetime) * 1000).toISOString().slice(0, 10)
        : null,
      next_billing_date:  nextBilling.toISOString().slice(0, 10),
    }, { onConflict: 'org_id' })
  }

  return NextResponse.json(buildWebhookResponse(orderId, 'accept'))
}
