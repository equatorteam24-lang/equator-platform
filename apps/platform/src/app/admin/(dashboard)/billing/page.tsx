import { createClient } from '@/lib/supabase'
import { getCurrentOrgId } from '@/lib/org'
import { getUsdRate, usdToUah } from '@/lib/exchange-rate'
import { PLANS_USD } from '@/lib/wayforpay'
import PayButton from './PayButton'
import CancelButton from './CancelButton'

const statusLabel: Record<string, { text: string; color: string }> = {
  active:    { text: 'Активна',     color: 'bg-green-100 text-green-700' },
  trial:     { text: 'Пробний',     color: 'bg-blue-100 text-blue-700'   },
  expired:   { text: 'Прострочено', color: 'bg-red-100 text-red-700'     },
  cancelled: { text: 'Скасовано',   color: 'bg-gray-100 text-gray-500'   },
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: qStatus } = await searchParams
  const supabase = await createClient()
  const orgId = await getCurrentOrgId()

  const [{ data: sub }, { data: payments }, rate] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('*')
      .eq('org_id', orgId)
      .single(),
    supabase
      .from('payment_history')
      .select('id, plan, amount, currency, status, is_recurring, created_at, wayforpay_reason')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(20),
    getUsdRate(),
  ])

  const monthlyUah = usdToUah(PLANS_USD.monthly.usd, rate)
  const annualUah  = usdToUah(PLANS_USD.annual.usd,  rate)

  const planLabel: Record<string, string> = {
    monthly: `Місячна (${monthlyUah} грн/міс)`,
    annual:  `Річна (${annualUah} грн/рік)`,
  }

  const badge = statusLabel[sub?.status ?? 'trial'] ?? statusLabel.trial

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Підписка та оплата</h1>

      {/* Payment result banner */}
      {qStatus === 'done' && (
        <div className="mb-6 rounded-xl bg-green-50 border border-green-200 px-5 py-3 text-sm text-green-700">
          Дякуємо! Платіж отримано. Статус підписки оновиться протягом хвилини.
        </div>
      )}

      {/* Current plan */}
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">Поточний план</p>
            <p className="text-lg font-bold text-gray-900">
              {sub?.plan ? planLabel[sub.plan] : 'Пробний період'}
            </p>
            {sub?.next_billing_date && (
              <p className="text-sm text-gray-500 mt-1">
                Наступне списання: {new Date(sub.next_billing_date).toLocaleDateString('uk-UA')}
              </p>
            )}
            {sub?.trial_ends_at && sub.status === 'trial' && (
              <p className="text-sm text-gray-500 mt-1">
                Пробний до: {new Date(sub.trial_ends_at).toLocaleDateString('uk-UA')}
              </p>
            )}
          </div>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.color}`}>
            {badge.text}
          </span>
        </div>
        {sub?.status === 'active' && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <CancelButton />
          </div>
        )}
      </div>

      {/* Plan selection */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <PlanCard
          plan="monthly"
          title="Місячна підписка"
          price={`${monthlyUah} грн`}
          usdHint={`$${PLANS_USD.monthly.usd} · курс ${rate.toFixed(1)} грн/$`}
          period="на місяць"
          description="Автопродовження кожен місяць"
          current={sub?.plan === 'monthly' && sub?.status === 'active'}
        />
        <PlanCard
          plan="annual"
          title="Річна підписка"
          price={`${annualUah} грн`}
          usdHint={`$${PLANS_USD.annual.usd} · курс ${rate.toFixed(1)} грн/$`}
          period="на рік"
          description={`Економія ${monthlyUah * 12 - annualUah} грн порівняно з місячною`}
          current={sub?.plan === 'annual' && sub?.status === 'active'}
          highlight
        />
      </div>

      {/* Payment history */}
      {!!payments?.length && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Історія платежів</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Дата</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Тариф</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Сума</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.map(p => (
                <tr key={p.id}>
                  <td className="px-4 py-2.5 text-gray-600">
                    {new Date(p.created_at).toLocaleDateString('uk-UA')}
                    {p.is_recurring && <span className="ml-1 text-xs text-gray-400">(авто)</span>}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">
                    {p.plan ? planLabel[p.plan] : '—'}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-gray-900">
                    {p.amount} грн
                  </td>
                  <td className="px-4 py-2.5">
                    <PaymentStatusBadge status={p.status} reason={p.wayforpay_reason} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function PlanCard({
  plan, title, price, usdHint, period, description, current, highlight,
}: {
  plan: 'monthly' | 'annual'
  title: string
  price: string
  usdHint?: string
  period: string
  description: string
  current?: boolean
  highlight?: boolean
}) {
  return (
    <div className={`rounded-xl border-2 px-5 py-5 flex flex-col gap-3 ${
      highlight ? 'border-blue-500' : 'border-gray-200'
    } bg-white`}>
      <div>
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-gray-900">{price}</span>
        <span className="text-sm text-gray-400">/{period}</span>
      </div>
      {usdHint && <p className="text-xs text-gray-400">{usdHint} за поточним курсом</p>}
      {current ? (
        <div className="rounded-lg bg-green-50 px-4 py-2 text-center text-sm font-medium text-green-700">
          Поточний план
        </div>
      ) : (
        <PayButton plan={plan} label={`Оплатити ${price}`} highlight={highlight} />
      )}
    </div>
  )
}

function PaymentStatusBadge({ status, reason }: { status: string; reason?: string | null }) {
  const map: Record<string, string> = {
    approved: 'bg-green-100 text-green-700',
    pending:  'bg-yellow-100 text-yellow-700',
    declined: 'bg-red-100 text-red-700',
    refunded: 'bg-gray-100 text-gray-500',
  }
  const labels: Record<string, string> = {
    approved: 'Успішно',
    pending:  'Очікує',
    declined: 'Відхилено',
    refunded: 'Повернуто',
  }
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-500'}`}
      title={reason ?? undefined}
    >
      {labels[status] ?? status}
    </span>
  )
}
