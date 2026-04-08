import { NextRequest, NextResponse } from 'next/server'

// WayForPay POSTs back to returnUrl — convert to GET redirect so session cookies work
export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/admin/billing?status=done', req.url))
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
