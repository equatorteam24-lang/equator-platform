import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { createServiceClient } from '@/lib/service'
import { getCurrentOrgId } from '@/lib/org'
import { buildPaymentParams, getPayUrl, PLANS_USD, type Plan } from '@/lib/wayforpay'
import { getUsdRate, usdToUah } from '@/lib/exchange-rate'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const plan = body.plan as Plan
  if (plan !== 'monthly' && plan !== 'annual') {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const orgId = await getCurrentOrgId()
  const orderId = `${orgId.slice(0, 8)}-${randomUUID().slice(0, 8)}-${Date.now()}`

  const origin = req.headers.get('origin') ?? `https://${process.env.WAYFORPAY_MERCHANT_DOMAIN}`
  const returnUrl  = `${origin}/api/billing/return`
  const serviceUrl = `${origin}/api/billing/webhook`

  // Save pending payment record
  const db = createServiceClient()
  const { data: sub } = await db
    .from('subscriptions')
    .select('id')
    .eq('org_id', orgId)
    .single()

  const rate = await getUsdRate()
  const amountUah = usdToUah(PLANS_USD[plan].usd, rate)

  await db.from('payment_history').insert({
    org_id:             orgId,
    subscription_id:    sub?.id ?? null,
    plan,
    amount:             amountUah,
    currency:           'UAH',
    status:             'pending',
    wayforpay_order_id: orderId,
    is_recurring:       false,
  })

  const params = buildPaymentParams(plan, orderId, returnUrl, serviceUrl, amountUah)

  return NextResponse.json({ payUrl: getPayUrl(), params })
}
