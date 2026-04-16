import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { createServiceClient } from '@/lib/service'
import { requireOrgId } from '@/lib/org'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = requireOrgId()
  const db = createServiceClient()

  await db
    .from('subscriptions')
    .update({ status: 'cancelled', rec_token: null, next_billing_date: null })
    .eq('org_id', orgId)

  return NextResponse.json({ ok: true })
}
