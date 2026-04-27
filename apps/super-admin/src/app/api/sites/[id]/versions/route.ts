import { getBridgeUrl, BRIDGE_SECRET } from '@/lib/bridge'
import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bridgeUrl = await getBridgeUrl()
  try {
    const res = await fetch(`${bridgeUrl}/versions/${id}`, {
      headers: { 'Authorization': `Bearer ${BRIDGE_SECRET}` },
      signal: AbortSignal.timeout(5000),
    })
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
  if (profile?.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const bridgeUrl = await getBridgeUrl()
  const body = await req.json()
  const { action, commit, label } = body as { action: 'save' | 'rollback'; commit?: string; label?: string }

  if (action === 'save') {
    // Save a named snapshot (git tag-like commit)
    try {
      const res = await fetch(`${bridgeUrl}/snapshot/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BRIDGE_SECRET}`,
        },
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
      const res = await fetch(`${bridgeUrl}/rollback/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BRIDGE_SECRET}`,
        },
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
