'use client'

import { useState } from 'react'
import { createClient } from '@/lib/client'
import { useRouter } from 'next/navigation'
import type { Page } from '@equator/db/types'

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID!

export default function PageEditor({ page }: { page?: Page }) {
  const router = useRouter()
  const isNew = !page

  const [title, setTitle]   = useState(page?.title ?? '')
  const [slug, setSlug]     = useState(page?.slug ?? '/')
  const [status, setStatus] = useState<Page['status']>(page?.status ?? 'draft')
  const [body, setBody]     = useState(
    typeof page?.content === 'object' && 'html' in (page?.content as unknown as Record<string, unknown>)
      ? String((page.content as unknown as Record<string, unknown>).html)
      : ''
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  async function save() {
    if (!title.trim() || !slug.trim()) return
    setSaving(true)
    const supabase = createClient()

    if (isNew) {
      const { data } = await supabase.from('pages').insert({
        org_id:  ORG_ID,
        title,
        slug,
        status,
        content: { html: body, blocks: [] },
        seo:     {},
      }).select('id').single()
      if (data) router.replace(`/admin/pages/${data.id}`)
    } else {
      await supabase.from('pages').update({
        title, slug, status,
        content: { ...(page.content as object), html: body },
      }).eq('id', page.id)
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">{isNew ? 'Нова сторінка' : 'Редагування'}</h1>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-green-600">Збережено ✓</span>}
          <select value={status} onChange={e => setStatus(e.target.value as Page['status'])}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
            <option value="draft">Чернетка</option>
            <option value="published">Опубліковано</option>
          </select>
          <button onClick={save} disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition">
            {saving ? 'Збереження...' : 'Зберегти'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Назва сторінки</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Про нас"
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">URL (slug)</label>
            <input value={slug} onChange={e => setSlug(e.target.value)}
              placeholder="/about"
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Контент (HTML)</label>
          <textarea value={body} onChange={e => setBody(e.target.value)}
            rows={20} placeholder="<h2>Заголовок</h2><p>Текст...</p>"
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none" />
        </div>
      </div>
    </div>
  )
}
