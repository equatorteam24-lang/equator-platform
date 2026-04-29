import { createServiceClient } from '@/lib/service'
import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const service = createServiceClient()

  // Get all team/superadmin profiles (org_id is null for internal users)
  const { data: profiles, error } = await service
    .from('profiles')
    .select('id, role, full_name, created_at')
    .is('org_id', null)
    .in('role', ['superadmin', 'team'])
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get emails from auth
  const userIds = profiles?.map((p: { id: string }) => p.id) ?? []
  const usersWithEmail = []

  for (const p of profiles ?? []) {
    const { data } = await service.auth.admin.getUserById(p.id)
    usersWithEmail.push({
      ...p,
      email: data?.user?.email ?? '—',
    })
  }

  return NextResponse.json(usersWithEmail)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { email, password, fullName, role } = body

  if (!email || !password) {
    return NextResponse.json({ error: 'Email та пароль обов\'язкові' }, { status: 400 })
  }

  if (!['superadmin', 'team'].includes(role)) {
    return NextResponse.json({ error: 'Невірна роль' }, { status: 400 })
  }

  const service = createServiceClient()

  // Create auth user
  const { data: authData, error: authError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // Update profile (trigger auto-creates it)
  const { error: profileError } = await service
    .from('profiles')
    .update({ role, full_name: fullName || null })
    .eq('id', authData.user.id)

  if (profileError) {
    await service.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, userId: authData.user.id })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId обов\'язковий' }, { status: 400 })

  // Prevent deleting yourself
  if (userId === user.id) {
    return NextResponse.json({ error: 'Не можна видалити себе' }, { status: 400 })
  }

  const service = createServiceClient()

  // Verify target is a team/superadmin user (not a client)
  const { data: targetProfile } = await service
    .from('profiles')
    .select('role, org_id')
    .eq('id', userId)
    .single()

  if (targetProfile?.org_id !== null) {
    return NextResponse.json({ error: 'Це клієнтський акаунт, видаліть через сторінку організації' }, { status: 400 })
  }

  await service.auth.admin.deleteUser(userId)

  return NextResponse.json({ ok: true })
}
