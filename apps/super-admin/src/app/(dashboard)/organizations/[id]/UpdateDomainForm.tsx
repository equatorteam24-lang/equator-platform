'use client'

import { useState } from 'react'
import { createClient } from '@/lib/client'
import { useRouter } from 'next/navigation'

export default function UpdateDomainForm({ orgId, domain }: { orgId: string; domain: string | null }) {
  const router = useRouter()
  const [value, setValue] = useState(domain ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('organizations').update({ domain: value.trim() || null }).eq('id', orgId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
      <h2 className="font-semibold text-gray-900 mb-4">Домен сайту</h2>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex rounded-lg border border-gray-300 overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
            <span className="px-3 py-2.5 bg-gray-50 text-sm text-gray-400 border-r border-gray-300">https://</span>
            <input
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="example.com"
              className="flex-1 px-3 py-2.5 text-sm outline-none"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Вказуйте після деплою на Vercel і підключення домену</p>
        </div>
        <button onClick={save} disabled={saving}
          className="rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-900 disabled:opacity-50 transition whitespace-nowrap">
          {saving ? 'Збереження...' : 'Зберегти'}
        </button>
        {saved && <span className="text-sm text-green-600">✓</span>}
      </div>
    </div>
  )
}
