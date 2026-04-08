import { NextRequest, NextResponse } from 'next/server'

// WayForPay POSTs back to returnUrl — convert to GET redirect so session cookies work
export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/admin/billing?status=done', req.url))
}

export async function POST(req: NextRequest) {
  // 303 See Other changes POST → GET, so browser re-requests with cookies intact
  return NextResponse.redirect(new URL('/admin/billing?status=done', req.url), 303)
}
