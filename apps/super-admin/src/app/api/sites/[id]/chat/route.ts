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
  const { message } = body

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Повідомлення обов\'язкове' }, { status: 400 })
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
  const chatHistory = [...(project.chat_history || []), { role: 'user', content: message, timestamp: new Date().toISOString() }]

  // Save chat history immediately
  await service.from('site_projects')
    .update({ chat_history: chatHistory })
    .eq('id', id)

  try {
    // Send to bridge
    const bridgeRes = await fetch(`${BRIDGE_URL}/chat/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BRIDGE_SECRET}`,
      },
      body: JSON.stringify({ message }),
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
  const interval = setInterval(async () => {
    try {
      const res = await fetch(`${BRIDGE_URL}/job/${jobId}`, {
        headers: { 'Authorization': `Bearer ${BRIDGE_SECRET}` },
      })

      if (!res.ok) { clearInterval(interval); return }

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
    } catch {}
  }, 5000)

  // Stop after 15 minutes
  setTimeout(() => clearInterval(interval), 900000)
}
