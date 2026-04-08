import crypto from 'crypto'

const MERCHANT_ACCOUNT = process.env.WAYFORPAY_MERCHANT_ACCOUNT!
const MERCHANT_SECRET  = process.env.WAYFORPAY_MERCHANT_SECRET!
const MERCHANT_DOMAIN  = process.env.WAYFORPAY_MERCHANT_DOMAIN!
const WFP_API_URL      = 'https://api.wayforpay.com/api'
const WFP_PAY_URL      = 'https://secure.wayforpay.com/pay'

export const PLANS = {
  monthly: { amount: 650,  currency: 'UAH', label: 'Місячна підписка' },
  annual:  { amount: 4200, currency: 'UAH', label: 'Річна підписка'   },
} as const

export type Plan = keyof typeof PLANS

function hmac(str: string): string {
  return crypto.createHmac('md5', MERCHANT_SECRET).update(str).digest('hex')
}

// ─── Create hosted payment form params ────────────────────────────────────────
// Returns the fields to POST to WFP_PAY_URL
export function buildPaymentParams(
  plan: Plan,
  orderId: string,
  returnUrl: string,
  serviceUrl: string,
): Record<string, string> {
  const { amount, currency, label } = PLANS[plan]
  const orderDate = Math.floor(Date.now() / 1000)

  // Signature string per WayForPay docs:
  // merchantAccount;merchantDomainName;orderReference;orderDate;amount;currency;productName;productCount;productPrice
  const sigString = [
    MERCHANT_ACCOUNT,
    MERCHANT_DOMAIN,
    orderId,
    orderDate,
    amount,
    currency,
    label,
    1,
    amount,
  ].join(';')

  return {
    merchantAccount:    MERCHANT_ACCOUNT,
    merchantDomainName: MERCHANT_DOMAIN,
    merchantTransactionSecureType: 'AUTO',
    merchantSignature:  hmac(sigString),
    orderReference:     orderId,
    orderDate:          String(orderDate),
    amount:             String(amount),
    currency,
    productName:        label,
    productCount:       '1',
    productPrice:       String(amount),
    returnUrl,
    serviceUrl,        // webhook URL
    // Save card token for recurring
    recToken:           'y',
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
): Promise<{ success: boolean; transactionId?: string; reason?: string }> {
  const { amount, currency, label } = PLANS[plan]
  const orderDate = Math.floor(Date.now() / 1000)

  const sigString = [
    MERCHANT_ACCOUNT,
    MERCHANT_DOMAIN,
    orderId,
    orderDate,
    amount,
    currency,
    label,
    1,
    amount,
  ].join(';')

  const body = {
    transactionType:    'CHARGE',
    merchantAccount:    MERCHANT_ACCOUNT,
    merchantDomainName: MERCHANT_DOMAIN,
    orderReference:     orderId,
    orderDate,
    amount,
    currency,
    productName:        [label],
    productCount:       [1],
    productPrice:       [amount],
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
