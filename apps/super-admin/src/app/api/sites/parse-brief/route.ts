import { bridgeFetch } from '@/lib/bridge'
import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { canAccessDashboard } from '@/lib/roles'

export async function POST(req: NextRequest) {
  // Verify superadmin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!canAccessDashboard(profile?.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { description } = await req.json()
  if (!description?.trim()) {
    return NextResponse.json({ error: 'Опис обов\'язковий' }, { status: 400 })
  }

  try {
    const res = await bridgeFetch('/parse-brief', {
      method: 'POST',
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
