import { bridgeFetch } from '@/lib/bridge'
import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { canAccessDashboard } from '@/lib/roles'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const res = await bridgeFetch(`/versions/${id}`, { method: 'GET' }, 5000)
    if (!res.ok) return NextResponse.json({ versions: [] })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ versions: [] })
  }
}

// POST — save named snapshot or rollback
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!canAccessDashboard(profile?.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { action, commit, label } = body as { action: 'save' | 'rollback'; commit?: string; label?: string }

  if (action === 'save') {
    try {
      const res = await bridgeFetch(`/snapshot/${id}`, {
        method: 'POST',
        body: JSON.stringify({ label: label || 'manual save' }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        return NextResponse.json({ error: err.error || 'Bridge error' }, { status: 500 })
      }
      return NextResponse.json(await res.json())
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }

  if (action === 'rollback') {
    try {
      const res = await bridgeFetch(`/rollback/${id}`, {
        method: 'POST',
        body: JSON.stringify({ commit }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        return NextResponse.json({ error: err.error || 'Bridge error' }, { status: 500 })
      }
      return NextResponse.json(await res.json())
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
