import { createServiceClient } from '@/lib/service'
import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

const BRIDGE_URL = process.env.BRIDGE_URL || 'http://localhost:3001'
const BRIDGE_SECRET = process.env.BRIDGE_SECRET || 'equator-bridge-secret-change-me'

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

  // If not applying — just save the message, don't trigger bridge
  if (!apply) {
    return NextResponse.json({ status: 'saved' })
  }

  // === Apply mode: send to bridge ===

  // Update status to revising
  await service.from('site_projects')
    .update({ status: 'revising', updated_at: new Date().toISOString() })
    .eq('id', id)

  // Collect all unprocessed user messages since the last assistant message
  const unprocessedMessages: string[] = []
  for (let i = chatHistory.length - 1; i >= 0; i--) {
    if (chatHistory[i].role === 'assistant') break
    if (chatHistory[i].role === 'user') {
      let text = chatHistory[i].content || ''
      if (chatHistory[i].attachments?.length) {
        text += '\n\n📎 Прикріплені файли:\n' + chatHistory[i].attachments.map((a: any) => `- ${a.name}: ${a.url}`).join('\n')
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
    chatHistory.push({ role: 'assistant', content: `Помилка: ${err.message}`, timestamp: new Date().toISOString() })
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
