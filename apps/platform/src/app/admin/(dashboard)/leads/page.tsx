import { createClient } from '@/lib/supabase'
import { getCurrentOrgId } from '@/lib/org'
import LeadsTable from './LeadsTable'

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  const { status, q } = await searchParams
  const orgId = await getCurrentOrgId()
  const supabase = await createClient()

  let query = supabase
    .from('leads')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (status && status !== 'all') query = query.eq('status', status)
  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)

  const { data: leads } = await query

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Заявки</h1>
          <p className="text-sm text-gray-400 mt-0.5">{leads?.length ?? 0} результатів</p>
        </div>
      </div>
      <LeadsTable leads={leads ?? []} currentStatus={status} currentQ={q} />
    </div>
  )
}
