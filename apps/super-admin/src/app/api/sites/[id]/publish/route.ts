import { createServiceClient } from '@/lib/service'
import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

const UA_TRANSLIT: Record<string, string> = {
  а:'a',б:'b',в:'v',г:'h',ґ:'g',д:'d',е:'e',є:'ye',ж:'zh',з:'z',и:'y',
  і:'i',ї:'yi',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',
  т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ь:'',ю:'yu',я:'ya',
}

function slugify(text: string): string {
  const transliterated = text
    .toLowerCase()
    .split('')
    .map(ch => UA_TRANSLIT[ch] ?? ch)
    .join('')
  return transliterated
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params

  // Verify caller is superadmin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json({ error: 'Email та пароль обов\'язкові' }, { status: 400 })
  }

  const service = createServiceClient()

  // Fetch site project
  const { data: project, error: projectError } = await service
    .from('site_projects')
    .select('id, name, status, form_data, org_id')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    return NextResponse.json({ error: 'Проект не знайдено' }, { status: 404 })
  }

  if (project.org_id) {
    return NextResponse.json({ error: 'Проект вже опублікований' }, { status: 400 })
  }

  if (project.status !== 'review') {
    return NextResponse.json({ error: 'Публікувати можна тільки проекти зі статусом "На перевірці"' }, { status: 400 })
  }

  // Derive org name and slug from form_data or project name
  const orgName = project.form_data?.companyName || project.name
  let orgSlug = slugify(project.form_data?.companyName || project.name)

  // Fallback if slug is empty (e.g. only special characters)
  if (!orgSlug) {
    orgSlug = `site-${projectId.slice(0, 8)}`
  }

  // Ensure slug uniqueness
  const { data: existing } = await service
    .from('organizations')
    .select('slug')
    .eq('slug', orgSlug)
    .maybeSingle()

  if (existing) {
    orgSlug = `${orgSlug}-${Date.now().toString(36)}`
  }

  // 1. Create organization
  const { data: org, error: orgError } = await service
    .from('organizations')
    .insert({
      name: orgName,
      slug: orgSlug,
      status: 'active',
      payment_status: 'trial',
    })
    .select('id, slug')
    .single()

  if (orgError) {
    const msg = orgError.message.includes('unique') ? 'Slug вже зайнятий' : orgError.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // 2. Create client auth user
  const { data: authData, error: authError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: orgName },
  })

  if (authError) {
    await service.from('organizations').delete().eq('id', org.id)
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // 3. Link profile to org
  const { error: profileError } = await service
    .from('profiles')
    .update({ org_id: org.id, role: 'admin', full_name: orgName })
    .eq('id', authData.user.id)

  if (profileError) {
    await service.auth.admin.deleteUser(authData.user.id)
    await service.from('organizations').delete().eq('id', org.id)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  // 4. Update site project
  const adminUrl = `https://${org.slug}.uniframe.app/admin`
  const { error: updateError } = await service
    .from('site_projects')
    .update({
      org_id: org.id,
      status: 'published',
      production_url: `https://${org.slug}.uniframe.app`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)

  if (updateError) {
    await service.from('profiles').update({ org_id: null, role: 'editor' }).eq('id', authData.user.id)
    await service.auth.admin.deleteUser(authData.user.id)
    await service.from('organizations').delete().eq('id', org.id)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    orgId: org.id,
    orgSlug: org.slug,
    userId: authData.user.id,
    adminUrl,
    siteUrl: `https://${org.slug}.uniframe.app`,
  })
}
