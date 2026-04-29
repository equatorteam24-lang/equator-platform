import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import type { Organization } from '@uniframe/db/types'

const statusLabel: Record<string, string> = {
  active:    'Активний',
  suspended: 'Призупинений',
  trial:     'Пробний',
}

const paymentLabel: Record<string, { label: string; color: string }> = {
  paid:    { label: 'Оплачено',    color: 'bg-green-100 text-green-700' },
  unpaid:  { label: 'Не оплачено', color: 'bg-red-100 text-red-700' },
  overdue: { label: 'Прострочено', color: 'bg-orange-100 text-orange-700' },
  trial:   { label: 'Пробний',     color: 'bg-gray-100 text-gray-600' },
}

export default async function OrganizationsPage() {
  const supabase = await createClient()
  const { data: orgsRaw } = await supabase
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false })
  const orgs = orgsRaw as Organization[] | null

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Сайти клієнтів</h1>
          <p className="text-sm text-gray-500 mt-0.5">{orgs?.length ?? 0} сайтів на платформі</p>
        </div>
        <Link
          href="/organizations/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
        >
          + Новий сайт
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-500">Назва / Домен</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Статус</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Оплата</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Оплачено до</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Дата створення</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orgs?.map((org: Organization) => {
              const payment = paymentLabel[org.payment_status]
              return (
                <tr key={org.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{org.name}</p>
                    <p className="text-gray-400 text-xs">{org.domain ?? `/${org.slug}`}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{statusLabel[org.status]}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${payment.color}`}>
                      {payment.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {org.paid_until
                      ? new Date(org.paid_until).toLocaleDateString('uk-UA')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(org.created_at).toLocaleDateString('uk-UA')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/organizations/${org.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Відкрити
                    </Link>
                  </td>
                </tr>
              )
            })}
            {!orgs?.length && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  Сайтів ще немає. Створіть перший.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
