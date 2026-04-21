import { createServiceClient } from '@/lib/service'
import { createClient } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const BRIDGE_URL = process.env.BRIDGE_URL || 'http://localhost:3001'
const BRIDGE_SECRET = process.env.BRIDGE_SECRET || 'equator-bridge-secret-change-me'

const CHAT_SYSTEM_PROMPT = `Ти — дизайн-консультант веб-агентства Equator. Ти допомагаєш клієнту з правками на сайті.

Твоя роль:
- Відповідай коротко і по суті (2-4 речення)
- Допомагай з вибором кольорів, шрифтів, компонування, UX
- Пропонуй конкретні варіанти коли питають пораду
- Якщо клієнт описує правку — підтверди що зрозумів і запропонуй уточнення якщо потрібно
- Коли клієнт готовий — нагадай натиснути кнопку «Внести правки» щоб застосувати зміни

Спілкуйся українською. Будь дружнім і професійним.
Ти НЕ вносиш правки сам — тільки консультуєш. Правки вносить окремий агент після натискання кнопки.`

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { message, attachments, apply } = body as {
    message?: string
    attachments?: { name: string; url: string }[]
    apply?: boolean
  }

  const service = createServiceClient()

  // Get project
  const { data: project, error: fetchErr } = await service
    .from('site_projects')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !project) {
    return NextResponse.json({ error: 'Проект не знайдено' }, { status: 404 })
  }

  let chatHistory = [...(project.chat_history || [])]

  // If there's a message, add it to chat history
  if (message?.trim() || attachments?.length) {
    const userMsg: Record<string, any> = { role: 'user', content: message || '', timestamp: new Date().toISOString() }
    if (attachments?.length) userMsg.attachments = attachments
    chatHistory.push(userMsg)

    await service.from('site_projects')
      .update({ chat_history: chatHistory, updated_at: new Date().toISOString() })
      .eq('id', id)
  }

  // === Apply mode: send to bridge ===
  if (apply) {
    return handleApply(id, chatHistory, service)
  }

  // === Chat mode: get AI response ===
  if (message?.trim() || attachments?.length) {
    try {
      const aiReply = await getChatReply(chatHistory, project)

      chatHistory.push({ role: 'assistant', content: aiReply, timestamp: new Date().toISOString() })
      await service.from('site_projects')
        .update({ chat_history: chatHistory, updated_at: new Date().toISOString() })
        .eq('id', id)

      return NextResponse.json({ status: 'replied', reply: aiReply })
    } catch (err: any) {
      console.error('AI chat error:', err)
      const errorMsg = err?.error?.error?.message || err?.message || 'Невідома помилка AI'
      const reply = `Не вдалося отримати відповідь: ${errorMsg}`
      chatHistory.push({ role: 'assistant', content: reply, timestamp: new Date().toISOString() })
      await service.from('site_projects')
        .update({ chat_history: chatHistory, updated_at: new Date().toISOString() })
        .eq('id', id)
      return NextResponse.json({ status: 'replied', reply })
    }
  }

  return NextResponse.json({ status: 'saved' })
}

async function getChatReply(chatHistory: any[], project: any): Promise<string> {
  const anthropic = new Anthropic()

  // Build messages for Claude (last 20 messages for context)
  const recentHistory = chatHistory.slice(-20)
  const messages: Anthropic.MessageParam[] = recentHistory.map((msg: any) => {
    const content: Anthropic.ContentBlockParam[] = []

    if (msg.content) {
      content.push({ type: 'text', text: msg.content })
    }

    // Include attachment URLs as text context
    if (msg.attachments?.length) {
      content.push({
        type: 'text',
        text: `[Прикріплено ${msg.attachments.length} зображень: ${msg.attachments.map((a: any) => a.name).join(', ')}]`,
      })
    }

    if (content.length === 0) {
      content.push({ type: 'text', text: '(порожнє повідомлення)' })
    }

    return {
      role: msg.role as 'user' | 'assistant',
      content,
    }
  })

  // Ensure messages start with user and alternate properly
  const cleaned: Anthropic.MessageParam[] = []
  for (const msg of messages) {
    if (cleaned.length === 0 && msg.role !== 'user') continue
    if (cleaned.length > 0 && cleaned[cleaned.length - 1].role === msg.role) {
      // Merge consecutive same-role messages
      const prev = cleaned[cleaned.length - 1]
      const prevContent = Array.isArray(prev.content) ? prev.content : [{ type: 'text' as const, text: String(prev.content) }]
      const curContent = Array.isArray(msg.content) ? msg.content : [{ type: 'text' as const, text: String(msg.content) }]
      prev.content = [...prevContent, ...curContent]
      continue
    }
    cleaned.push({ ...msg })
  }

  if (cleaned.length === 0) {
    return 'Привіт! Чим можу допомогти з сайтом?'
  }

  const systemContext = `${CHAT_SYSTEM_PROMPT}\n\nІнформація про проект:\n- Назва: ${project.name || 'Без назви'}\n- Компанія: ${project.form_data?.companyName || 'Невідомо'}\n- Статус: ${project.status}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    system: systemContext,
    messages: cleaned,
  })

  const textBlock = response.content.find((b: any) => b.type === 'text')
  return textBlock ? (textBlock as Anthropic.TextBlock).text : 'Не вдалося отримати відповідь.'
}

async function handleApply(id: string, chatHistory: any[], service: any) {
  // Update status to revising
  await service.from('site_projects')
    .update({ status: 'revising', updated_at: new Date().toISOString() })
    .eq('id', id)

  // Collect all unprocessed user messages since the last assistant message with type 'bridge'
  // (regular assistant chat replies don't count — we want messages since last bridge response)
  const unprocessedMessages: string[] = []
  for (let i = chatHistory.length - 1; i >= 0; i--) {
    const msg = chatHistory[i]
    if (msg.role === 'assistant' && msg.source === 'bridge') break
    if (msg.role === 'user') {
      let text = msg.content || ''
      if (msg.attachments?.length) {
        text += '\n\n📎 Прикріплені файли:\n' + msg.attachments.map((a: any) => `- ${a.name}: ${a.url}`).join('\n')
        text += '\n\n⚠️ Використай ці зображення на сайті в <img src="URL">.'
      }
      unprocessedMessages.unshift(text)
    }
  }

  const bridgeMessage = unprocessedMessages.join('\n\n---\n\n')

  try {
    const bridgeRes = await fetch(`${BRIDGE_URL}/chat/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BRIDGE_SECRET}`,
      },
      body: JSON.stringify({ message: bridgeMessage }),
    })

    if (!bridgeRes.ok) {
      const err = await bridgeRes.json().catch(() => ({}))
      throw new Error(err.error || 'Bridge error')
    }

    const { jobId } = await bridgeRes.json()

    pollChatJob(jobId, id, chatHistory, service)

    return NextResponse.json({ status: 'revising', jobId })
  } catch (err: any) {
    chatHistory.push({ role: 'assistant', content: `Помилка: ${err.message}`, source: 'bridge', timestamp: new Date().toISOString() })
    await service.from('site_projects').update({
      status: 'review',
      chat_history: chatHistory,
      updated_at: new Date().toISOString(),
    }).eq('id', id)

    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function pollChatJob(jobId: string, projectId: string, chatHistory: any[], service: any) {
  let consecutiveFailures = 0
  const MAX_FAILURES = 30

  const interval = setInterval(async () => {
    try {
      const res = await fetch(`${BRIDGE_URL}/job/${jobId}`, {
        headers: { 'Authorization': `Bearer ${BRIDGE_SECRET}` },
        signal: AbortSignal.timeout(8000),
      })

      if (!res.ok) {
        consecutiveFailures++
        if (consecutiveFailures >= MAX_FAILURES) clearInterval(interval)
        return
      }

      consecutiveFailures = 0
      const job = await res.json()

      if (job.status === 'done') {
        clearInterval(interval)
        chatHistory.push({
          role: 'assistant',
          content: job.output || 'Зміни застосовано.',
          source: 'bridge',
          timestamp: new Date().toISOString(),
        })
        await service.from('site_projects').update({
          status: 'review',
          chat_history: chatHistory,
          generated_code: job.generatedCode || undefined,
          vercel_url: job.vercelUrl || undefined,
          updated_at: new Date().toISOString(),
        }).eq('id', projectId)
      } else if (job.status === 'error') {
        clearInterval(interval)
        chatHistory.push({
          role: 'assistant',
          content: `Помилка: ${job.error}`,
          source: 'bridge',
          timestamp: new Date().toISOString(),
        })
        await service.from('site_projects').update({
          status: 'review',
          chat_history: chatHistory,
          updated_at: new Date().toISOString(),
        }).eq('id', projectId)
      }
    } catch {
      consecutiveFailures++
      if (consecutiveFailures >= MAX_FAILURES) clearInterval(interval)
    }
  }, 5000)

  setTimeout(() => clearInterval(interval), 900000)
}
