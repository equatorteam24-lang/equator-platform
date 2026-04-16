import { createServiceClient } from '@/lib/service'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentOrgId } from '@/lib/org'

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const sessionId   = String(body.session_id   ?? '').trim()
  const event       = String(body.event         ?? 'pageview').trim()
  const page        = String(body.page          ?? '/').trim()
  const referrer    = String(body.referrer      ?? '')
  const device      = String(body.device        ?? '')
  const browser     = String(body.browser       ?? '')
  const visitorId   = String(body.visitor_id    ?? '')
  const utmSource   = String(body.utm_source    ?? '')
  const utmMedium   = String(body.utm_medium    ?? '')
  const utmCampaign = String(body.utm_campaign  ?? '')
  const duration    = typeof body.duration === 'number' ? body.duration : null

  if (!sessionId) {
    return NextResponse.json({ error: 'session_id required' }, { status: 400 })
  }

  const country = req.headers.get('cf-ipcountry') ?? req.headers.get('x-vercel-ip-country') ?? null

  const orgId    = await getCurrentOrgId()
  const supabase = createServiceClient()
  const { error } = await supabase.from('analytics_events').insert({
    org_id:       orgId,
    session_id:   sessionId,
    visitor_id:   visitorId || null,
    event,
    page,
    referrer:     referrer  || null,
    country,
    device:       device    || null,
    browser:      browser   || null,
    utm_source:   utmSource   || null,
    utm_medium:   utmMedium   || null,
    utm_campaign: utmCampaign || null,
    duration,
  })

  if (error) {
    console.error('[analytics] insert failed', { event, page, error: error.message })
  }

  return NextResponse.json({ ok: true })
}
