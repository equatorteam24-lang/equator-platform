import { createClient } from '@/lib/supabase'

const subStatusBadge: Record<string, { label: string; color: string }> = {
  active:    { label: 'Активна',     color: 'bg-green-100 text-green-700'  },
  trial:     { label: 'Пробний',     color: 'bg-blue-100 text-blue-700'    },
  expired:   { label: 'Прострочено', color: 'bg-red-100 text-red-700'      },
  cancelled: { label: 'Скасовано',   color: 'bg-gray-100 text-gray-500'    },
}

const planLabel: Record<string, string> = {
  monthly: 'Місячна',
  annual:  'Річна',
}

const payHistoryBadge: Record<string, { label: string; color: string }> = {
  approved: { label: 'Успішно',   color: 'bg-green-100 text-green-700' },
  declined: { label: 'Відхилено', color: 'bg-red-100 text-red-700'     },
  pending:  { label: 'Очікує',    color: 'bg-yellow-100 text-yellow-700'},
  refunded: { label: 'Повернуто', color: 'bg-gray-100 text-gray-500'   },
}

export default async function PaymentsPage() {
  const supabase = await createClient()

  const [{ data: orgs }, { data: subs }, { data: recentPayments }] = await Promise.all([
    supabase.from('organizations').select('id, name, domain, slug').order('name'),
    supabase
      .from('subscriptions')
      .select('org_id, plan, status, amount, currency, next_billing_date, trial_ends_at, rec_token'),
    supabase
      .from('payment_history')
      .select('org_id, plan, amount, currency, status, is_recurring, created_at, wayforpay_reason')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  // Index subscriptions by org_id
  const subByOrg = Object.fromEntries((subs ?? []).map(s => [s.org_id, s]))

  const active   = (subs ?? []).filter(s => s.status === 'active').length
  const trial    = (subs ?? []).filter(s => s.status === 'trial').length
  const expired  = (subs ?? []).filter(s => s.status === 'expired').length
  const noToken  = (subs ?? []).filter(s => s.status === 'active' && !s.rec_token).length

  // MRR estimate
  const mrr = (subs ?? [])
    .filter(s => s.status === 'active')
    .reduce((acc, s) => acc + (s.plan === 'annual' ? s.amount / 12 : s.amount), 0)

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Підписки та оплати</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <KpiCard label="Активних" value={active}  color="text-green-600" />
        <KpiCard label="Пробних"  value={trial}   color="text-blue-600"  />
        <KpiCard label="Прострочено" value={expired} color="text-red-600" />
        <KpiCard label="Без авторекуренту" value={noToken} color="text-orange-500" />
        <KpiCard label="MRR (≈$)" value={`$${mrr.toFixed(0)}`} color="text-gray-900" />
      </div>

      {/* Subscriptions table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Всі клієнти</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Сайт</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Статус</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Тариф</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Сума</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Наступне списання</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Авторекурент</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(orgs ?? []).map(org => {
              const sub = subByOrg[org.id]
              const badge = subStatusBadge[sub?.status ?? 'trial'] ?? subStatusBadge.trial
              const daysUntil = sub?.next_billing_date
                ? Math.ceil((new Date(sub.next_billing_date).getTime() - Date.now()) / 86400000)
                : null
              const soonClass = daysUntil !== null && daysUntil <= 3 ? 'text-orange-600 font-medium' : 'text-gray-600'

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
                  <td className="px-4 py-3 text-gray-600">
                    {sub?.plan ? planLabel[sub.plan] : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {sub ? `$${sub.amount}` : '—'}
                  </td>
                  <td className={`px-4 py-3 ${soonClass}`}>
                    {sub?.next_billing_date
                      ? new Date(sub.next_billing_date).toLocaleDateString('uk-UA')
                      : sub?.trial_ends_at
                        ? `Пробний до ${new Date(sub.trial_ends_at).toLocaleDateString('uk-UA')}`
                        : '—'}
                    {daysUntil !== null && daysUntil <= 3 && daysUntil >= 0 && ' ⚠'}
                    {daysUntil !== null && daysUntil < 0 && ' (!'}
                  </td>
                  <td className="px-4 py-3">
                    {sub?.rec_token
                      ? <span className="text-green-600">✓ є</span>
                      : <span className="text-gray-400">—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Recent payments */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Останні платежі</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Дата</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Клієнт</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Тариф</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Сума</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Тип</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(recentPayments ?? []).map((p, i) => {
              const org = (orgs ?? []).find(o => o.id === p.org_id)
              const badge = payHistoryBadge[p.status] ?? payHistoryBadge.pending
              return (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                    {new Date(p.created_at).toLocaleDateString('uk-UA')}
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-gray-800">{org?.name ?? p.org_id.slice(0, 8)}</p>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">
                    {p.plan ? planLabel[p.plan] : '—'}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-gray-900">
                    ${p.amount}
                  </td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs">
                    {p.is_recurring ? 'авто' : 'ручний'}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.color}`}
                      title={p.wayforpay_reason ?? undefined}
                    >
                      {badge.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function KpiCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}
