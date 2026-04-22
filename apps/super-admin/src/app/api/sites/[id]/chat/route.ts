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
  const { message, attachments, apply, tab } = body as {
    message?: string
    attachments?: { name: string; url: string }[]
    apply?: boolean
    tab?: 'discuss' | 'revisions'
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
    const userMsg: Record<string, any> = { role: 'user', content: message || '', tab: tab || 'discuss', timestamp: new Date().toISOString() }
    if (attachments?.length) userMsg.attachments = attachments
    chatHistory.push(userMsg)

    await service.from('site_projects')
      .update({ chat_history: chatHistory, updated_at: new Date().toISOString() })
      .eq('id', id)
  }

  // === Apply mode: send to bridge for code changes ===
  if (apply) {
    return handleApply(id, chatHistory, service)
  }

  // === Revisions mode: just save, no reply ===
  if (tab === 'revisions') {
    return NextResponse.json({ status: 'saved' })
  }

  // === Discuss mode: get reply from bridge agent ===
  if (message?.trim() || attachments?.length) {
    try {
      // Build recent discuss history for context
      const discussHistory = chatHistory
        .filter((m: any) => !m.tab || m.tab === 'discuss')
        .slice(-10)
        .map((m: any) => {
          let content = m.content || ''
          if (m.attachments?.length) {
            content += '\n\n📎 Прикріплені файли:\n' + m.attachments.map((a: any) => `- ${a.name}: ${a.url}`).join('\n')
          }
          return { role: m.role, content }
        })

      const siteContext = {
        name: project.name,
        companyName: project.form_data?.companyName,
        companyDescription: project.form_data?.companyDescription,
        siteType: project.form_data?.siteType,
        designStyle: project.form_data?.designStyle,
        structure: project.form_data?.structure,
        primaryColor: project.form_data?.primaryColor,
        secondaryColor: project.form_data?.secondaryColor,
        theme: project.form_data?.theme,
        extraWishes: project.form_data?.extraWishes,
        status: project.status,
        vercelUrl: project.vercel_url,
      }

      // Include attachments in the current message text sent to bridge
      let bridgeMessage = message || ''
      if (attachments?.length) {
        bridgeMessage += '\n\n📎 Прикріплені файли:\n' + attachments.map((a) => `- ${a.name}: ${a.url}`).join('\n')
      }

      const bridgeRes = await fetch(`${BRIDGE_URL}/discuss/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BRIDGE_SECRET}`,
        },
        body: JSON.stringify({ message: bridgeMessage, history: discussHistory, siteContext }),
        signal: AbortSignal.timeout(90000),
      })

      if (!bridgeRes.ok) {
        const err = await bridgeRes.json().catch(() => ({}))
        throw new Error(err.error || 'Bridge error')
      }

      const { reply } = await bridgeRes.json()

      chatHistory.push({ role: 'assistant', content: reply, tab: 'discuss', timestamp: new Date().toISOString() })
      await service.from('site_projects')
        .update({ chat_history: chatHistory, updated_at: new Date().toISOString() })
        .eq('id', id)

      return NextResponse.json({ status: 'replied', reply })
    } catch (err: any) {
      console.error('Discuss error:', err)
      const errorMsg = err?.message || 'Не вдалося отримати відповідь'
      const reply = `Помилка: ${errorMsg}`
      chatHistory.push({ role: 'assistant', content: reply, tab: 'discuss', timestamp: new Date().toISOString() })
      await service.from('site_projects')
        .update({ chat_history: chatHistory, updated_at: new Date().toISOString() })
        .eq('id', id)
      return NextResponse.json({ status: 'replied', reply })
    }
  }

  return NextResponse.json({ status: 'saved' })
}

async function handleApply(id: string, chatHistory: any[], service: any) {
  // Add status message to chat
  chatHistory.push({
    role: 'assistant',
    content: 'Правки прийняті. Агент вносить зміни на сайт...',
    tab: 'revisions',
    source: 'status',
    timestamp: new Date().toISOString(),
  })

  // Update status to revising and save status message
  await service.from('site_projects')
    .update({ status: 'revising', chat_history: chatHistory, updated_at: new Date().toISOString() })
    .eq('id', id)

  // Collect unprocessed revision messages (tab === 'revisions') since last bridge response
  const revisionMsgs = chatHistory.filter((m: any) => m.tab === 'revisions')
  const unprocessedMessages: string[] = []
  for (let i = revisionMsgs.length - 1; i >= 0; i--) {
    const msg = revisionMsgs[i]
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
    chatHistory.push({ role: 'assistant', content: `Помилка: ${err.message}`, tab: 'revisions', source: 'bridge', timestamp: new Date().toISOString() })
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
          tab: 'revisions',
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
          tab: 'revisions',
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
