import { NextRequest, NextResponse } from 'next/server'

// WayForPay redirects back to returnUrl — pass through all params for debugging
export async function GET(req: NextRequest) {
  const incoming = req.nextUrl.searchParams
  const url = new URL('/admin/billing', req.url)

  // Forward all WayForPay query params
  incoming.forEach((value, key) => url.searchParams.set(key, value))

  // Ensure status is always set
  if (!url.searchParams.has('status')) {
    const txStatus = incoming.get('transactionStatus') ?? 'done'
    url.searchParams.set('status', txStatus)
  }

  console.log('[WayForPay GET return]', Object.fromEntries(incoming.entries()))
  return NextResponse.redirect(url)
}

export async function POST(req: NextRequest) {
  // Read WayForPay response body to get transaction status
  let body: Record<string, string> = {}
  try {
    const text = await req.text()
    text.split('&').forEach(pair => {
      const [k, v] = pair.split('=')
      if (k) body[decodeURIComponent(k)] = decodeURIComponent(v ?? '')
    })
  } catch { /* ignore */ }

  const status = body.transactionStatus ?? 'done'
  const reason = body.reason ?? body.reasonCode ?? ''
  const url = new URL('/admin/billing', req.url)
  url.searchParams.set('status', status)
  if (reason) url.searchParams.set('reason', reason)

  console.log('[WayForPay return]', body)

  // 303 See Other changes POST → GET so session cookies are preserved
  return NextResponse.redirect(url, 303)
}
