import { createServiceClient } from '@/lib/service'
import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN || ''
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID || ''
const VERCEL_PROJECT_ID = process.env.VERCEL_PLATFORM_PROJECT_ID || ''

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orgId } = await params

  // Verify caller is superadmin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const domain = body.domain?.trim()?.toLowerCase()

  if (!domain) {
    return NextResponse.json({ error: 'Домен обов\'язковий' }, { status: 400 })
  }

  const service = createServiceClient()

  // Update domain in DB
  const { error: dbError } = await service
    .from('organizations')
    .update({ domain })
    .eq('id', orgId)

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  // Add domain to Vercel project
  let vercelResult = null
  if (VERCEL_TOKEN && VERCEL_PROJECT_ID) {
    try {
      const url = `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains` +
        (VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : '')

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: domain }),
      })

      const data = await res.json()

      if (res.ok) {
        vercelResult = {
          added: true,
          verified: data.verified ?? false,
        }
      } else if (data.error?.code === 'domain_already_in_use') {
        vercelResult = { added: true, verified: true, note: 'Домен вже додано' }
      } else {
        vercelResult = { added: false, error: data.error?.message || 'Помилка Vercel API' }
      }
    } catch (err) {
      vercelResult = { added: false, error: (err as Error).message }
    }
  }

  // Update production_url in linked site_projects
  await service
    .from('site_projects')
    .update({
      production_url: `https://${domain}`,
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', orgId)
    .eq('status', 'published')

  // DNS instructions
  const dns = {
    cname: { type: 'CNAME', name: domain.startsWith('www.') ? 'www' : '@', value: 'cname.vercel-dns.com' },
    a: { type: 'A', name: '@', value: '76.76.21.21' },
  }

  return NextResponse.json({
    ok: true,
    domain,
    vercel: vercelResult,
    dns,
  })
}
