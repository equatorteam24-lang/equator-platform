import { createClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import UpdatePaymentForm from './UpdatePaymentForm'
import ResetPasswordForm from './ResetPasswordForm'
import UpdateDomainForm from './UpdateDomainForm'
import type { Organization, Lead } from '@equator/db/types'

export default async function OrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [orgResult, leadsResult, leadsCountResult] = await Promise.all([
    supabase.from('organizations').select('*').eq('id', id).single(),
    supabase.from('leads').select('*').eq('org_id', id).order('created_at', { ascending: false }).limit(10),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('org_id', id),
  ])

  const org = orgResult.data as Organization | null
  const leads = leadsResult.data as Lead[] | null
  const leadsCount = leadsCountResult.count

  if (!org) notFound()

  const siteUrl = org.domain ? `https://${org.domain}` : null

  return (
    <div className="p-8 max-w-5xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{org.name}</h1>
          <p className="text-sm text-gray-400">{org.domain ?? `slug: ${org.slug}`}</p>
        </div>
        <div className="flex gap-2">
          {siteUrl && (
            <>
              <a href={siteUrl} target="_blank" rel="noopener noreferrer"
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                Переглянути сайт ↗
              </a>
              <a href={`${siteUrl}/admin`} target="_blank" rel="noopener noreferrer"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition">
                Відкрити адмінку клієнта ↗
              </a>
            </>
          )}
          {!siteUrl && (
            <span className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-400">
              Домен не підключено
            </span>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Заявок всього" value={String(leadsCount ?? 0)} />
        <StatCard label="Статус оплати" value={org.payment_status} />
        <StatCard label="Оплачено до" value={org.paid_until ? new Date(org.paid_until).toLocaleDateString('uk-UA') : '—'} />
      </div>

      {/* Domain */}
      <UpdateDomainForm orgId={org.id} domain={org.domain} />

      {/* Payment management */}
      <UpdatePaymentForm org={org} />

      {/* Client access */}
      <ResetPasswordForm orgId={org.id} />

      {/* Recent leads */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Останні заявки</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-2 text-left font-medium text-gray-500">Ім'я</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Email / Телефон</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Статус</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Дата</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {leads?.map(lead => (
              <tr key={lead.id}>
                <td className="px-4 py-2 font-medium text-gray-900">{lead.name}</td>
                <td className="px-4 py-2 text-gray-500">{lead.email ?? lead.phone ?? '—'}</td>
                <td className="px-4 py-2 text-gray-500">{lead.status}</td>
                <td className="px-4 py-2 text-gray-400">{new Date(lead.created_at).toLocaleDateString('uk-UA')}</td>
              </tr>
            ))}
            {!leads?.length && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">Заявок ще немає</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
