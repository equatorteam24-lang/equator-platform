import { NextRequest, NextResponse } from 'next/server'
import { buildPaymentParams, getPayUrl } from '@/lib/wayforpay'
import { requireOrgId } from '@/lib/org'
import { randomUUID } from 'crypto'

export async function GET(req: NextRequest) {
  const orgId = requireOrgId()
  const orderId = `${orgId.slice(0, 8)}-${randomUUID().slice(0, 8)}-${Date.now()}`
  const origin = 'https://www.equator-app.com'
  const params = buildPaymentParams('monthly', orderId, `${origin}/api/billing/return`, `${origin}/api/billing/webhook`)
  return NextResponse.json({
    payUrl: getPayUrl(),
    params,
    env: {
      domain: process.env.WAYFORPAY_MERCHANT_DOMAIN,
      account: process.env.WAYFORPAY_MERCHANT_ACCOUNT,
      secretLen: process.env.WAYFORPAY_MERCHANT_SECRET?.length,
    }
  })
}
