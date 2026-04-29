'use client'

import { useState } from 'react'
import { createClient } from '@/lib/client'
import { useRouter } from 'next/navigation'
import type { Lead } from '@uniframe/db/types'

const statusOptions = [
  { value: 'all',         label: 'Всі' },
  { value: 'new',         label: 'Нові' },
  { value: 'in_progress', label: 'В роботі' },
  { value: 'closed',      label: 'Закриті' },
  { value: 'spam',        label: 'Спам' },
]

const statusBadge: Record<string, string> = {
  new:         'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  closed:      'bg-green-100 text-green-700',
  spam:        'bg-gray-100 text-gray-500',
}

const statusLabel: Record<string, string> = {
  new: 'Новий', in_progress: 'В роботі', closed: 'Закритий', spam: 'Спам',
}

export default function LeadsTable({
  leads,
  currentStatus,
  currentQ,
}: {
  leads: Lead[]
  currentStatus?: string
  currentQ?: string
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<Lead | null>(null)
  const [updating, setUpdating] = useState(false)

  async function updateStatus(lead: Lead, status: Lead['status']) {
    setUpdating(true)
    const supabase = createClient()
    await supabase.from('leads').update({ status }).eq('id', lead.id)
    setSelected(prev => prev ? { ...prev, status } : null)
    setUpdating(false)
    router.refresh()
  }

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(window.location.search)
    if (value && value !== 'all') params.set(key, value)
    else params.delete(key)
    router.push(`/admin/leads?${params.toString()}`)
  }

  return (
    <div className="flex gap-6">
      {/* Table */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Filters */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <input
            type="search"
            placeholder="Пошук по імені, email, телефону..."
            defaultValue={currentQ}
            onChange={e => updateFilter('q', e.target.value)}
            className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
          />
          <div className="flex gap-1">
            {statusOptions.map(opt => (
              <button key={opt.value} onClick={() => updateFilter('status', opt.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  (currentStatus ?? 'all') === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Ім'я</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Контакт</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Статус</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Дата</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {leads.map(lead => (
              <tr key={lead.id}
                className={`cursor-pointer hover:bg-gray-50 transition-colors ${selected?.id === lead.id ? 'bg-blue-50' : ''}`}
                onClick={() => setSelected(selected?.id === lead.id ? null : lead)}>
                <td className="px-4 py-2.5 font-medium text-gray-900">{lead.name}</td>
                <td className="px-4 py-2.5 text-gray-500">
                  <div>{lead.email ?? ''}</div>
                  <div className="text-xs text-gray-400">{lead.phone ?? ''}</div>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[lead.status]}`}>
                    {statusLabel[lead.status]}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-gray-400">{new Date(lead.created_at).toLocaleDateString('uk-UA')}</td>
              </tr>
            ))}
            {!leads.length && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400">Заявок не знайдено</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-72 flex-shrink-0 bg-white rounded-xl border border-gray-200 p-5 space-y-4 self-start sticky top-8">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Деталі заявки</h3>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <dl className="space-y-2 text-sm">
            <Row label="Ім'я"    value={selected.name} />
            <Row label="Email"   value={selected.email} />
            <Row label="Телефон" value={selected.phone} />
            <Row label="Сторінка" value={selected.source_page} />
            {selected.message && <Row label="Повідомлення" value={selected.message} />}
            {selected.utm_source && <Row label="UTM Source" value={selected.utm_source} />}
          </dl>

          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Статус</p>
            <div className="grid grid-cols-2 gap-1.5">
              {(['new', 'in_progress', 'closed', 'spam'] as Lead['status'][]).map(s => (
                <button key={s} disabled={updating} onClick={() => updateStatus(selected, s)}
                  className={`rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                    selected.status === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {statusLabel[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="text-gray-800 mt-0.5 break-words">{value}</dd>
    </div>
  )
}
