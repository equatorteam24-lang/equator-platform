import { createServiceClient } from '@/lib/service'
import { NextRequest, NextResponse } from 'next/server'
import { requireOrgId } from '@/lib/org'

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const sessionId = String(body.session_id ?? '').trim()
  const event     = String(body.event     ?? 'pageview').trim()
  const page      = String(body.page      ?? '/').trim()
  const referrer  = String(body.referrer  ?? '')
  const device    = String(body.device    ?? '')

  if (!sessionId) {
    return NextResponse.json({ error: 'session_id required' }, { status: 400 })
  }

  // Get country from CF header (Vercel/Cloudflare) or skip
  const country = req.headers.get('cf-ipcountry') ?? req.headers.get('x-vercel-ip-country') ?? null

  const supabase = createServiceClient()
  await supabase.from('analytics_events').insert({
    org_id:     requireOrgId(),
    session_id: sessionId,
    event,
    page,
    referrer:   referrer || null,
    country,
    device:     device || null,
  })

  return NextResponse.json({ ok: true })
}
