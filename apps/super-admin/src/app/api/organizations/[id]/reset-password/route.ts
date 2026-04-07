import { createServiceClient } from '@/lib/service'
import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: orgId } = await params

  // Verify superadmin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { newPassword } = await req.json()
  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'Пароль мінімум 8 символів' }, { status: 400 })
  }

  const service = createServiceClient()

  // Find client user of this org
  const { data: clientProfile } = await service
    .from('profiles')
    .select('id')
    .eq('org_id', orgId)
    .eq('role', 'admin')
    .single()

  if (!clientProfile) return NextResponse.json({ error: 'Клієнта не знайдено' }, { status: 404 })

  const { error } = await service.auth.admin.updateUserById(clientProfile.id, { password: newPassword })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
