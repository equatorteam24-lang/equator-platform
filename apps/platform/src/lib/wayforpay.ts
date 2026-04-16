import crypto from 'crypto'

const MERCHANT_ACCOUNT = process.env.WAYFORPAY_MERCHANT_ACCOUNT!
const MERCHANT_SECRET  = process.env.WAYFORPAY_MERCHANT_SECRET!
const MERCHANT_DOMAIN  = process.env.WAYFORPAY_MERCHANT_DOMAIN!
const WFP_API_URL      = 'https://api.wayforpay.com/api'
const WFP_PAY_URL      = 'https://secure.wayforpay.com/pay'

// Prices in USD — converted to UAH at current rate before charging
export const PLANS_USD = {
  monthly: { usd: 15,  label: 'Місячна підписка' },
  annual:  { usd: 100, label: 'Річна підписка'   },
} as const

export type Plan = keyof typeof PLANS_USD

function hmac(str: string): string {
  return crypto.createHmac('md5', MERCHANT_SECRET).update(str).digest('hex')
}

// ─── Create hosted payment form params ────────────────────────────────────────
// amountUah — calculated from current exchange rate by the caller
export function buildPaymentParams(
  plan: Plan,
  orderId: string,
  returnUrl: string,
  serviceUrl: string,
  amountUah: number,
): Record<string, string> {
  const { label } = PLANS_USD[plan]
  const currency = 'UAH'
  const orderDate = Math.floor(Date.now() / 1000)

  // Signature string per WayForPay docs:
  // merchantAccount;merchantDomainName;orderReference;orderDate;amount;currency;productName;productCount;productPrice
  const sigString = [
    MERCHANT_ACCOUNT,
    MERCHANT_DOMAIN,
    orderId,
    orderDate,
    amountUah,
    currency,
    label,
    1,
    amountUah,
  ].join(';')

  return {
    merchantAccount:    MERCHANT_ACCOUNT,
    merchantDomainName: MERCHANT_DOMAIN,
    merchantTransactionSecureType: 'AUTO',
    merchantSignature:  hmac(sigString),
    orderReference:     orderId,
    orderDate:          String(orderDate),
    amount:             String(amountUah),
    currency,
    productName:        label,
    productCount:       '1',
    productPrice:       String(amountUah),
    returnUrl,
    serviceUrl,
    language:           'UA',
  }
}

export function getPayUrl(): string {
  return WFP_PAY_URL
}

// ─── Verify incoming webhook signature ────────────────────────────────────────
export function verifyWebhookSignature(data: Record<string, unknown>): boolean {
  // WayForPay signs: merchantAccount;orderReference;amount;currency;authCode;cardPan;transactionStatus;reasonCode
  const sigString = [
    data.merchantAccount,
    data.orderReference,
    data.amount,
    data.currency,
    data.authCode,
    data.cardPan,
    data.transactionStatus,
    data.reasonCode,
  ].join(';')

  return hmac(sigString) === data.merchantSignature
}

// ─── Build webhook response ───────────────────────────────────────────────────
export function buildWebhookResponse(orderReference: string, status: 'accept' | 'decline') {
  const time = Math.floor(Date.now() / 1000)
  const sigString = `${orderReference};${status};${time}`
  return {
    orderReference,
    status,
    time,
    signature: hmac(sigString),
  }
}

// ─── Charge recurring payment ──────────────────────────────────────────────────
export async function chargeRecurring(
  recToken: string,
  orderId: string,
  plan: Plan,
  amountUah: number,
): Promise<{ success: boolean; transactionId?: string; reason?: string }> {
  const { label } = PLANS_USD[plan]
  const currency = 'UAH'
  const orderDate = Math.floor(Date.now() / 1000)

  const sigString = [
    MERCHANT_ACCOUNT,
    MERCHANT_DOMAIN,
    orderId,
    orderDate,
    amountUah,
    currency,
    label,
    1,
    amountUah,
  ].join(';')

  const body = {
    transactionType:    'CHARGE',
    merchantAccount:    MERCHANT_ACCOUNT,
    merchantDomainName: MERCHANT_DOMAIN,
    orderReference:     orderId,
    orderDate,
    amount:             amountUah,
    currency,
    productName:        [label],
    productCount:       [1],
    productPrice:       [amountUah],
    recToken,
    merchantSignature:  hmac(sigString),
    apiVersion:         1,
  }

  const res = await fetch(WFP_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const json = await res.json() as Record<string, unknown>

  if (json.transactionStatus === 'Approved') {
    return { success: true, transactionId: String(json.transactionId ?? '') }
  }

  return { success: false, reason: String(json.reason ?? json.reasonCode ?? 'unknown') }
}
