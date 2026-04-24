import { createServiceClient } from '@/lib/service'
import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

const BRIDGE_URL = process.env.BRIDGE_URL || 'http://localhost:3001'
const BRIDGE_SECRET = process.env.BRIDGE_SECRET || 'uniframe-bridge-secret-change-me'
const STALE_THRESHOLD_MS = 2 * 60 * 1000 // 2 minutes

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data: project, error } = await service
    .from('site_projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !project) {
    return NextResponse.json({ error: 'Проект не знайдено' }, { status: 404 })
  }

  // Self-healing: if stuck in generating/revising too long, check bridge directly
  if (project.status === 'generating' || project.status === 'revising') {
    const age = Date.now() - new Date(project.updated_at || project.created_at).getTime()
    if (age > STALE_THRESHOLD_MS) {
      const synced = await syncFromBridge(id, project, service)
      if (synced) return NextResponse.json(synced)
    }
  }

  return NextResponse.json(project)
}

async function syncFromBridge(projectId: string, project: any, service: any) {
  try {
    // For chat revisions, extract jobId from the last status message in chat_history
    let storedJobId: string | undefined
    if (project.status === 'revising' && project.chat_history?.length) {
      for (let i = project.chat_history.length - 1; i >= 0; i--) {
        const msg = project.chat_history[i]
        if (msg.source === 'status' && msg.tab === 'revisions' && msg.jobId) {
          storedJobId = msg.jobId
          break
        }
      }
    }
    const jobIds = project.status === 'revising'
      ? [storedJobId, projectId].filter(Boolean)
      : [projectId]

    for (const jobId of jobIds) {
      try {
        const res = await fetch(`${BRIDGE_URL}/job/${jobId}`, {
          headers: { 'Authorization': `Bearer ${BRIDGE_SECRET}` },
          signal: AbortSignal.timeout(5000),
        })
        if (!res.ok) continue

        const job = await res.json()

        if (job.status === 'done') {
          const updates: Record<string, any> = {
            status: 'review',
            updated_at: new Date().toISOString(),
          }
          if (job.generatedCode) updates.generated_code = job.generatedCode
          if (job.vercelUrl) updates.vercel_url = job.vercelUrl

          // For chat jobs, append output to chat history
          if (project.status === 'revising' && job.output) {
            const chatHistory = [...(project.chat_history || [])]
            chatHistory.push({
              role: 'assistant',
              content: job.output,
              tab: 'revisions',
              source: 'bridge',
              timestamp: new Date().toISOString(),
            })
            updates.chat_history = chatHistory
          }

          const { data } = await service.from('site_projects')
            .update(updates)
            .eq('id', projectId)
            .select()
            .single()

          console.log(`Self-healed project ${projectId}: ${project.status} → review`)
          return data
        }

        if (job.status === 'error') {
          const { data } = await service.from('site_projects')
            .update({ status: 'draft', updated_at: new Date().toISOString() })
            .eq('id', projectId)
            .select()
            .single()

          console.log(`Self-healed project ${projectId}: ${project.status} → draft (error: ${job.error})`)
          return data
        }

        // Still running — don't change anything
        return null
      } catch {
        continue
      }
    }
  } catch {
    // Bridge unreachable — can't self-heal yet
  }
  return null
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const service = createServiceClient()

  // 1. Get project to find vercel_url
  const { data: project } = await service.from('site_projects').select('*').eq('id', id).single()
  if (!project) return NextResponse.json({ error: 'Проект не знайдено' }, { status: 404 })

  // 2. Delete from Vercel (if deployed)
  if (project.vercel_url) {
    try {
      // Extract project name from vercel_url
      const vercelProjectName = id
      const vercelToken = process.env.VERCEL_TOKEN
      if (vercelToken) {
        await fetch(`https://api.vercel.com/v9/projects/${vercelProjectName}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${vercelToken}` },
        })
      }
    } catch (err) {
      console.error('Vercel delete error:', err)
    }
  }

  // 3. Delete files from bridge (tmp-sites folder)
  try {
    await fetch(`${BRIDGE_URL}/delete-project/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${BRIDGE_SECRET}` },
    })
  } catch (err) {
    console.error('Bridge delete error:', err)
  }

  // 4. Delete from Supabase
  const { error } = await service.from('site_projects').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function PATCH(
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
  const allowedFields = ['status', 'name', 'vercel_url', 'production_url']
  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  for (const key of allowedFields) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  const service = createServiceClient()
  const { data, error } = await service
    .from('site_projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
