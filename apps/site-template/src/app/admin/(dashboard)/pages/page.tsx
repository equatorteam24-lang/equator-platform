import { createClient } from '@/lib/supabase'
import { ORG_ID } from '@/lib/org'
import Link from 'next/link'
import DeletePageButton from './DeletePageButton'

export default async function PagesPage() {
  const supabase = await createClient()
  const { data: pages } = await supabase
    .from('pages')
    .select('id, slug, title, status, updated_at')
    .eq('org_id', ORG_ID)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Сторінки</h1>
        <Link href="/admin/pages/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition">
          + Нова сторінка
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-500">Назва</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">URL</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Статус</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Оновлено</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pages?.map(page => (
              <tr key={page.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{page.title}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{page.slug}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    page.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {page.status === 'published' ? 'Опубліковано' : 'Чернетка'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400">{new Date(page.updated_at).toLocaleDateString('uk-UA')}</td>
                <td className="px-4 py-3 flex gap-3 justify-end">
                  <Link href={`/admin/pages/${page.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                    Редагувати
                  </Link>
                  <DeletePageButton pageId={page.id} />
                </td>
              </tr>
            ))}
            {!pages?.length && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">Сторінок ще немає</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
