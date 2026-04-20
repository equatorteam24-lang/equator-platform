import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

const BRIDGE_URL = process.env.BRIDGE_URL || 'http://localhost:3001'
const BRIDGE_SECRET = process.env.BRIDGE_SECRET || 'equator-bridge-secret-change-me'

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
    const res = await fetch(`${BRIDGE_URL}/parse-brief`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BRIDGE_SECRET}`,
      },
      body: JSON.stringify({ description }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json({ error: err.error || 'Bridge error' }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('Parse brief error:', err.message)
    return NextResponse.json({ error: `Помилка з\'єднання з агентом: ${err.message}` }, { status: 500 })
  }
}
