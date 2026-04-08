'use client'

import { useState } from 'react'
import { createClient } from '@/lib/client'
import { useRouter } from 'next/navigation'
import type { PageSeo } from '@equator/db/types'

type PageRow = {
  id:          string
  title:       string
  slug:        string
  seo:         PageSeo
  status:      string
  isHomepage?: boolean
}

export default function SeoEditor({ pages }: { pages: PageRow[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<PageRow>(pages[0])
  const [seo, setSeo] = useState<PageSeo>(pages[0]?.seo ?? {})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function selectPage(page: PageRow) {
    setSelected(page)
    setSeo(page.seo ?? {})
    setSaved(false)
  }

  async function save() {
    setSaving(true)

    if (selected.isHomepage) {
      // Save to site_content section='seo'
      await fetch('/api/content', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ section: 'seo', content: seo }),
      })
    } else {
      const supabase = createClient()
      await supabase.from('pages').update({ seo }).eq('id', selected.id)
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  const titleLen = (seo.meta_title ?? '').length
  const descLen  = (seo.meta_description ?? '').length

  return (
    <div className="flex gap-6">
      {/* Page list */}
      <div className="w-56 flex-shrink-0 bg-white rounded-xl border border-gray-200 overflow-hidden self-start">
        {pages.map(page => (
          <button key={page.id} onClick={() => selectPage(page)}
            className={`w-full text-left px-4 py-3 text-sm border-b border-gray-100 last:border-0 transition-colors ${
              selected?.id === page.id
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}>
            <p className="font-medium truncate">{page.title}</p>
            <p className="text-xs text-gray-400 font-mono">{page.slug}</p>
          </button>
        ))}
      </div>

      {/* SEO form */}
      {selected && (
        <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6 space-y-5 self-start">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">{selected.title}</h2>
            <div className="flex items-center gap-3">
              {saved && <span className="text-sm text-green-600">Збережено ✓</span>}
              <button onClick={save} disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition">
                {saving ? 'Збереження...' : 'Зберегти'}
              </button>
            </div>
          </div>

          <Field label={`Meta Title (${titleLen}/60)`}
            hint={titleLen > 60 ? 'Занадто довгий — буде обрізано в Google' : titleLen > 50 ? 'Оптимально' : 'Спробуйте ближче до 50-60 символів'}>
            <input value={seo.meta_title ?? ''} onChange={e => setSeo(s => ({ ...s, meta_title: e.target.value }))}
              placeholder={selected.title}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          </Field>

          <Field label={`Meta Description (${descLen}/160)`}
            hint={descLen > 160 ? 'Занадто довгий' : descLen > 120 ? 'Оптимально' : 'Рекомендовано 120-160 символів'}>
            <textarea value={seo.meta_description ?? ''} onChange={e => setSeo(s => ({ ...s, meta_description: e.target.value }))}
              rows={3} placeholder="Короткий опис сторінки для пошукових систем..."
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none" />
          </Field>

          <Field label="OG Image URL" hint="Зображення для соціальних мереж (1200×630px)">
            <input value={seo.og_image ?? ''} onChange={e => setSeo(s => ({ ...s, og_image: e.target.value }))}
              placeholder="https://..."
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          </Field>

          <Field label="Canonical URL" hint="Якщо сторінка має канонічну адресу (необов'язково)">
            <input value={seo.canonical ?? ''} onChange={e => setSeo(s => ({ ...s, canonical: e.target.value }))}
              placeholder="https://example.com/page"
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          </Field>

          <div className="flex items-center gap-3 pt-1">
            <input type="checkbox" id="noindex" checked={seo.no_index ?? false}
              onChange={e => setSeo(s => ({ ...s, no_index: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-blue-600" />
            <label htmlFor="noindex" className="text-sm text-gray-700">
              Заблокувати індексацію (noindex)
            </label>
          </div>

          {/* Google preview */}
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500 mb-3">Превью в Google</p>
            <p className="text-blue-700 text-base font-medium leading-snug truncate">
              {seo.meta_title || selected.title}
            </p>
            <p className="text-green-700 text-xs mt-0.5">
              {`example.com${selected.slug === '/' ? '' : selected.slug}`}
            </p>
            <p className="text-gray-600 text-sm mt-1 line-clamp-2">
              {seo.meta_description || 'Опис сторінки відсутній...'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}
