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

async function sendTelegram(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  }).catch(() => {})
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

  const name       = String(body.name       ?? '').trim()
  const email      = String(body.email      ?? '').trim()
  const phone      = String(body.phone      ?? '').trim()
  const message    = String(body.message    ?? '').trim()
  const sourcePage = String(body.source_page ?? '').trim()

  if (!name) {
    return NextResponse.json({ error: "Ім'я обов'язкове" }, { status: 400 })
  }
  if (!email && !phone) {
    return NextResponse.json({ error: 'Потрібен email або телефон' }, { status: 400 })
  }

  const url          = new URL(req.url)
  const utmSource    = url.searchParams.get('utm_source')   ?? String(body.utm_source   ?? '')
  const utmMedium    = url.searchParams.get('utm_medium')   ?? String(body.utm_medium   ?? '')
  const utmCampaign  = url.searchParams.get('utm_campaign') ?? String(body.utm_campaign ?? '')

  const orgId  = requireOrgId()
  const db     = createServiceClient()

  // Insert lead + fetch org settings in parallel
  const [{ error }, { data: org }] = await Promise.all([
    db.from('leads').insert({
      org_id:       orgId,
      name,
      email:        email    || null,
      phone:        phone    || null,
      message:      message  || null,
      source_page:  sourcePage || null,
      utm_source:   utmSource  || null,
      utm_medium:   utmMedium  || null,
      utm_campaign: utmCampaign || null,
      status:       'new',
    }),
    db.from('organizations').select('settings').eq('id', orgId).single(),
  ])

  if (error) {
    console.error('Lead insert error:', error)
    return NextResponse.json({ error: 'Помилка сервера' }, { status: 500 })
  }

  // Telegram notification
  const settings = (org?.settings ?? {}) as Record<string, string>
  if (settings.telegram_chat_id) {
    const lines = [
      '🔔 <b>Нова заявка!</b>',
      '',
      `👤 <b>Ім'я:</b> ${name}`,
      phone   ? `📞 <b>Телефон:</b> ${phone}`   : null,
      email   ? `📧 <b>Email:</b> ${email}`      : null,
      message ? `💬 <b>Повідомлення:</b> ${message}` : null,
      sourcePage ? `📍 <b>Сторінка:</b> ${sourcePage}` : null,
    ].filter(Boolean).join('\n')

    await sendTelegram(settings.telegram_chat_id, lines)
  }

  return NextResponse.json({ ok: true })
}
