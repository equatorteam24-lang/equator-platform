import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  // Verify superadmin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { description } = await req.json()
  if (!description?.trim()) {
    return NextResponse.json({ error: 'Опис обов\'язковий' }, { status: 400 })
  }

  try {
    const client = new Anthropic()

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Ти — помічник веб-агентства Equator. Тобі дали вільний опис проекту від менеджера або клієнта. Розбери його на структуровані поля для форми створення сайту.

Опис проекту:
"""
${description}
"""

Верни JSON (без markdown, тільки чистий JSON) з такими полями (пропускай поле якщо інформації немає):

{
  "name": "Назва проекту (коротка, для внутрішнього використання)",
  "companyName": "Назва компанії",
  "companyDescription": "Опис діяльності компанії (2-3 речення)",
  "siteType": "one-page | multi-page | landing",
  "theme": "light | dark | auto",
  "designStyle": "minimalist | corporate | creative | premium",
  "structure": "Структура сайту — список секцій, кожна з нового рядка з номером",
  "primaryColor": "#hex основний колір",
  "secondaryColor": "#hex додатковий колір",
  "phone": "телефон",
  "email": "email",
  "address": "адреса",
  "socials": "соцмережі",
  "extraWishes": "все що не ввійшло в інші поля — особливі побажання, анімації, функціонал"
}

Важливо:
- Кольори підбирай по опису (напр. "синій" → "#2563eb", "зелений" → "#16a34a")
- Якщо згадано стиль (мінімалізм, сучасний, luxury) — обери відповідний designStyle
- Якщо згадано "темна тема" / "dark" → theme: "dark"
- structure — пиши детально, з описом кожної секції
- extraWishes — збери сюди всі деталі що не вписуються в інші поля (конкретні функції, анімації, приклади тощо)`,
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Не вдалося розібрати відповідь' }, { status: 500 })
    }

    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json(parsed)
  } catch (err: any) {
    console.error('Parse brief error:', err.message, err.status, err.error)
    return NextResponse.json({
      error: `Помилка AI: ${err.message || 'невідома'}`,
    }, { status: 500 })
  }
}
