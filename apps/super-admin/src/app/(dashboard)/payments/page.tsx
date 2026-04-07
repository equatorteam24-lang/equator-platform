import { createClient } from '@/lib/supabase'
import type { Organization } from '@equator/db/types'

const paymentBadge: Record<string, { label: string; color: string }> = {
  paid:    { label: 'Оплачено',    color: 'bg-green-100 text-green-700' },
  unpaid:  { label: 'Не оплачено', color: 'bg-red-100 text-red-700' },
  overdue: { label: 'Прострочено', color: 'bg-orange-100 text-orange-700' },
  trial:   { label: 'Пробний',     color: 'bg-gray-100 text-gray-600' },
}

export default async function PaymentsPage() {
  const supabase = await createClient()
  const { data: orgsRaw } = await supabase
    .from('organizations')
    .select('*')
    .order('paid_until', { ascending: true, nullsFirst: true })
  const orgs = orgsRaw as Organization[] | null

  const overdue = orgs?.filter(o => o.payment_status === 'overdue') ?? []
  const unpaid  = orgs?.filter(o => o.payment_status === 'unpaid')  ?? []
  const paid    = orgs?.filter(o => o.payment_status === 'paid')    ?? []
  const trial   = orgs?.filter(o => o.payment_status === 'trial')   ?? []

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Оплати</h1>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Прострочено" count={overdue.length} color="text-orange-600" />
        <SummaryCard label="Не оплачено" count={unpaid.length}  color="text-red-600" />
        <SummaryCard label="Оплачено"    count={paid.length}    color="text-green-600" />
        <SummaryCard label="Пробний"     count={trial.length}   color="text-gray-500" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-500">Сайт</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Статус оплати</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Оплачено до</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Тариф</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orgs?.map((org: Organization) => {
              const badge = paymentBadge[org.payment_status]
              const isExpiringSoon = org.paid_until
                ? new Date(org.paid_until) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                : false
              return (
                <tr key={org.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{org.name}</p>
                    <p className="text-xs text-gray-400">{org.domain ?? org.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.color}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className={`px-4 py-3 ${isExpiringSoon ? 'text-orange-600 font-medium' : 'text-gray-600'}`}>
                    {org.paid_until
                      ? new Date(org.paid_until).toLocaleDateString('uk-UA')
                      : '—'}
                    {isExpiringSoon && ' ⚠'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{org.plan ?? '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SummaryCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{count}</p>
    </div>
  )
}
