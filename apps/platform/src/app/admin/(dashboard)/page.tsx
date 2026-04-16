import { createClient } from '@/lib/supabase'
import { ORG_ID } from '@/lib/org'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()

  const [
    { count: totalLeads },
    { count: newLeads },
    { count: monthVisits },
    { data: recentLeads },
  ] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('org_id', ORG_ID),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('org_id', ORG_ID).eq('status', 'new'),
    supabase.from('analytics_events').select('*', { count: 'exact', head: true })
      .eq('org_id', ORG_ID).eq('event', 'pageview').gte('created_at', monthStart),
    supabase.from('leads').select('name, email, phone, status, created_at, source_page')
      .eq('org_id', ORG_ID).order('created_at', { ascending: false }).limit(5),
  ])

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Дашборд</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Нових заявок" value={String(newLeads ?? 0)} note="очікують відповіді" color="text-blue-600" />
        <StatCard label="Всього заявок" value={String(totalLeads ?? 0)} />
        <StatCard label="Візитів цього місяця" value={String(monthVisits ?? 0)} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Останні заявки</h2>
          <a href="/admin/leads" className="text-sm text-blue-600 hover:text-blue-800">Всі заявки →</a>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Ім'я</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Контакт</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Сторінка</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Дата</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {recentLeads?.map((lead, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium text-gray-900">{lead.name}</td>
                <td className="px-4 py-2.5 text-gray-500">{lead.email ?? lead.phone ?? '—'}</td>
                <td className="px-4 py-2.5 text-gray-400 text-xs">{lead.source_page ?? '—'}</td>
                <td className="px-4 py-2.5 text-gray-400">{new Date(lead.created_at).toLocaleDateString('uk-UA')}</td>
              </tr>
            ))}
            {!recentLeads?.length && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Заявок ще немає</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatCard({ label, value, note, color }: { label: string; value: string; note?: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color ?? 'text-gray-900'}`}>{value}</p>
      {note && <p className="text-xs text-gray-400 mt-0.5">{note}</p>}
    </div>
  )
}
