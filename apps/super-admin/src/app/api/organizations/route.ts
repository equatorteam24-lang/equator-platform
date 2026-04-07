import { createServiceClient } from '@/lib/service'
import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Verify caller is superadmin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { orgName, orgSlug, clientEmail, clientPassword, clientName, plan } = body

  if (!orgName || !orgSlug || !clientEmail || !clientPassword) {
    return NextResponse.json({ error: 'Заповніть всі обов\'язкові поля' }, { status: 400 })
  }

  // Use service client to bypass RLS
  const service = createServiceClient()

  // 1. Create organization
  const { data: org, error: orgError } = await service
    .from('organizations')
    .insert({ name: orgName, slug: orgSlug, plan: plan || null, status: 'active', payment_status: 'trial' })
    .select('id')
    .single()

  if (orgError) {
    const msg = orgError.message.includes('unique') ? 'Slug вже зайнятий' : orgError.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // 2. Create client user in Supabase Auth
  const { data: authData, error: authError } = await service.auth.admin.createUser({
    email: clientEmail,
    password: clientPassword,
    email_confirm: true,
    user_metadata: { full_name: clientName },
  })

  if (authError) {
    // Rollback org
    await service.from('organizations').delete().eq('id', org.id)
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // 3. Assign user to org with admin role
  const { error: profileError } = await service
    .from('profiles')
    .update({ org_id: org.id, role: 'admin', full_name: clientName || null })
    .eq('id', authData.user.id)

  if (profileError) {
    // Rollback
    await service.auth.admin.deleteUser(authData.user.id)
    await service.from('organizations').delete().eq('id', org.id)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, orgId: org.id, userId: authData.user.id })
}
