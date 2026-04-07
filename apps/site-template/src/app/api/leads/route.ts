import { createServiceClient } from '@/lib/service'
import { NextRequest, NextResponse } from 'next/server'
import { requireOrgId } from '@/lib/org'

// Rate limiting: max 5 submissions per IP per hour (in-memory, resets on redeploy)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Забагато запитів' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Невірний формат' }, { status: 400 })
  }

  const name = String(body.name ?? '').trim()
  const email = String(body.email ?? '').trim()
  const phone = String(body.phone ?? '').trim()
  const message = String(body.message ?? '').trim()
  const sourcePage = String(body.source_page ?? '').trim()

  if (!name) {
    return NextResponse.json({ error: "Ім'я обов'язкове" }, { status: 400 })
  }
  if (!email && !phone) {
    return NextResponse.json({ error: 'Потрібен email або телефон' }, { status: 400 })
  }

  // Parse UTM params from referrer
  const url = new URL(req.url)
  const utmSource   = url.searchParams.get('utm_source')   ?? String(body.utm_source   ?? '')
  const utmMedium   = url.searchParams.get('utm_medium')   ?? String(body.utm_medium   ?? '')
  const utmCampaign = url.searchParams.get('utm_campaign') ?? String(body.utm_campaign ?? '')

  const supabase = createServiceClient()
  const { error } = await supabase.from('leads').insert({
    org_id:      requireOrgId(),
    name,
    email:       email || null,
    phone:       phone || null,
    message:     message || null,
    source_page: sourcePage || null,
    utm_source:  utmSource || null,
    utm_medium:  utmMedium || null,
    utm_campaign: utmCampaign || null,
    status:      'new',
  })

  if (error) {
    console.error('Lead insert error:', error)
    return NextResponse.json({ error: 'Помилка сервера' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
