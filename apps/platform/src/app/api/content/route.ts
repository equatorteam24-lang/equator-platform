import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/service'
import { createClient } from '@/lib/supabase'
import { getCurrentOrgId } from '@/lib/org'
import { DEFAULT_CONTENT } from '@/lib/content'

// GET /api/content — returns merged content for this org
export async function GET() {
  const orgId = await getCurrentOrgId()
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('site_content')
    .select('section, content')
    .eq('org_id', orgId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Merge all sections into one object
  const merged = structuredClone(DEFAULT_CONTENT) as unknown as Record<string, unknown>
  for (const row of data ?? []) {
    if (row.content && typeof row.content === 'object') {
      merged[row.section] = { ...(merged[row.section] as object ?? {}), ...row.content }
    }
  }

  return NextResponse.json(merged)
}

// POST /api/content — save one section
export async function POST(req: NextRequest) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { section, content } = await req.json()
  if (!section || !content) return NextResponse.json({ error: 'Missing section or content' }, { status: 400 })

  const orgId = await getCurrentOrgId()
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('site_content')
    .upsert({ org_id: orgId, section, content, updated_at: new Date().toISOString() }, { onConflict: 'org_id,section' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
