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
  const { message, attachments } = body as { message?: string; attachments?: { name: string; url: string }[] }

  if (!message?.trim() && (!attachments || !attachments.length)) {
    return NextResponse.json({ error: 'Повідомлення або файл обов\'язкові' }, { status: 400 })
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

  // Update status to revising
  await service.from('site_projects')
    .update({ status: 'revising', updated_at: new Date().toISOString() })
    .eq('id', id)

  // Add user message to chat history
  const userMsg: Record<string, any> = { role: 'user', content: message || '', timestamp: new Date().toISOString() }
  if (attachments?.length) userMsg.attachments = attachments
  const chatHistory = [...(project.chat_history || []), userMsg]

  // Save chat history immediately
  await service.from('site_projects')
    .update({ chat_history: chatHistory })
    .eq('id', id)

  try {
    // Build message for bridge (include attachment URLs so the agent can use them)
    let bridgeMessage = message || ''
    if (attachments?.length) {
      bridgeMessage += '\n\n📎 Прикріплені файли:\n' + attachments.map(a => `- ${a.name}: ${a.url}`).join('\n')
      bridgeMessage += '\n\n⚠️ Використай ці зображення на сайті в <img src="URL">.'
    }

    // Send to bridge
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

    // Poll for completion
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

  // Stop after 15 minutes
  setTimeout(() => clearInterval(interval), 900000)
}
