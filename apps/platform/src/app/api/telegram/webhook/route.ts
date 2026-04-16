import { NextRequest, NextResponse } from 'next/server'

const TOKEN = process.env.TELEGRAM_BOT_TOKEN!

async function sendMessage(chatId: number | string, text: string) {
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

export async function POST(req: NextRequest) {
  if (!TOKEN) return NextResponse.json({ ok: false })

  let update: Record<string, unknown>
  try {
    update = await req.json()
  } catch {
    return NextResponse.json({ ok: false })
  }

  const message = update.message as Record<string, unknown> | undefined
  if (!message) return NextResponse.json({ ok: true })

  const chatId   = (message.chat as Record<string, unknown>)?.id
  const text     = String(message.text ?? '')
  const firstName = String((message.from as Record<string, unknown>)?.first_name ?? '')

  if (text === '/start' || text.startsWith('/start ')) {
    await sendMessage(
      chatId as string,
      `Привіт${firstName ? `, ${firstName}` : ''}! 👋\n\n` +
      `Ваш <b>Chat ID</b>:\n<code>${chatId}</code>\n\n` +
      `Скопіюйте це число та вставте в адмінці сайту:\n` +
      `<i>Налаштування → Сповіщення → Telegram Chat ID</i>`,
    )
  }

  return NextResponse.json({ ok: true })
}
