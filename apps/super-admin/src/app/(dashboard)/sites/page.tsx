import { createClient } from '@/lib/supabase'
import Link from 'next/link'

const statusConfig: Record<string, { label: string; color: string }> = {
  draft:      { label: 'Чернетка',    color: 'bg-gray-100 text-gray-600' },
  generating: { label: 'Генерація...', color: 'bg-yellow-100 text-yellow-700' },
  review:     { label: 'На перевірці', color: 'bg-blue-100 text-blue-700' },
  revising:   { label: 'Правки...',    color: 'bg-orange-100 text-orange-600' },
  published:  { label: 'Опубліковано', color: 'bg-green-100 text-green-700' },
  archived:   { label: 'Архів',        color: 'bg-gray-100 text-gray-400' },
}

export default async function SitesPage() {
  const supabase = await createClient()
  const { data: projects } = await supabase
    .from('site_projects')
    .select('*')
    .order('created_at', { ascending: false })

  const active = projects?.filter(p => p.status !== 'archived') ?? []
  const archived = projects?.filter(p => p.status === 'archived') ?? []

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Конструктор сайтів</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {active.length} активних, {archived.length} в архіві
          </p>
        </div>
        <Link
          href="/sites/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
        >
          + Новий сайт
        </Link>
      </div>

      {/* Active projects */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-500">Проект</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Статус</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Preview</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Дата</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {active.map((p: any) => {
              const status = statusConfig[p.status] ?? statusConfig.draft
              return (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{p.name}</p>
                    <p className="text-gray-400 text-xs">{p.form_data?.companyName || '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.vercel_url ? (
                      <a
                        href={p.vercel_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        Переглянути ↗
                      </a>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(p.created_at).toLocaleDateString('uk-UA')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/sites/${p.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Відкрити
                    </Link>
                  </td>
                </tr>
              )
            })}
            {!active.length && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                  Проектів ще немає. Створіть перший сайт.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Archived */}
      {archived.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Архів</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden opacity-60">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {archived.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-500">{p.name}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(p.created_at).toLocaleDateString('uk-UA')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/sites/${p.id}`} className="text-gray-400 hover:text-gray-600">
                        Деталі
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
