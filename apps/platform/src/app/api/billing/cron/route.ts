import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/service'
import { chargeRecurring, PLANS_USD, type Plan } from '@/lib/wayforpay'
import { getUsdRate, usdToUah } from '@/lib/exchange-rate'
import { randomUUID } from 'crypto'

// Called daily by Vercel Cron: 0 9 * * *
// Charges subscriptions due today or already overdue
export async function GET(req: NextRequest) {
  // Protect with CRON_SECRET
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServiceClient()
  const today = new Date().toISOString().slice(0, 10)

  // Find active subscriptions due for renewal
  const { data: dueSubs } = await db
    .from('subscriptions')
    .select('id, org_id, plan, rec_token, next_billing_date, amount, currency')
    .eq('status', 'active')
    .lte('next_billing_date', today)
    .not('rec_token', 'is', null)

  if (!dueSubs?.length) {
    return NextResponse.json({ charged: 0 })
  }

  let charged = 0
  let failed = 0

  for (const sub of dueSubs) {
    const orderId = `rec-${sub.org_id.slice(0, 8)}-${randomUUID().slice(0, 8)}-${Date.now()}`
    const plan = sub.plan as Plan

    const rate = await getUsdRate()
    const amountUah = usdToUah(PLANS_USD[plan].usd, rate)
    const result = await chargeRecurring(sub.rec_token, orderId, plan, amountUah)

    if (result.success) {
      const now = new Date()
      const nextBilling = plan === 'annual'
        ? new Date(now.setMonth(now.getMonth() + 12))
        : new Date(now.setMonth(now.getMonth() + 1))

      await Promise.all([
        db.from('subscriptions').update({
          next_billing_date: nextBilling.toISOString().slice(0, 10),
        }).eq('id', sub.id),

        db.from('payment_history').insert({
          org_id:                   sub.org_id,
          subscription_id:          sub.id,
          plan,
          amount:                   sub.amount,
          currency:                 sub.currency,
          status:                   'approved',
          wayforpay_order_id:       orderId,
          wayforpay_transaction_id: result.transactionId,
          is_recurring:             true,
        }),
      ])
      charged++
    } else {
      // Mark subscription expired after failed charge
      await Promise.all([
        db.from('subscriptions').update({ status: 'expired' }).eq('id', sub.id),

        db.from('payment_history').insert({
          org_id:             sub.org_id,
          subscription_id:    sub.id,
          plan,
          amount:             sub.amount,
          currency:           sub.currency,
          status:             'declined',
          wayforpay_order_id: orderId,
          wayforpay_reason:   result.reason,
          is_recurring:       true,
        }),
      ])
      console.error('[billing/cron] Recurring charge failed', {
        org_id: sub.org_id, reason: result.reason,
      })
      failed++
    }
  }

  return NextResponse.json({ charged, failed })
}
