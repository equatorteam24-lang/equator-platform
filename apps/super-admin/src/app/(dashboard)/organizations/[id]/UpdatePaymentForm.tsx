'use client'

import { useState } from 'react'
import { createClient } from '@/lib/client'
import { useRouter } from 'next/navigation'
import type { Organization } from '@equator/db/types'

export default function UpdatePaymentForm({ org }: { org: Organization }) {
  const router = useRouter()
  const [status, setStatus] = useState(org.payment_status)
  const [paidUntil, setPaidUntil] = useState(org.paid_until ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const supabase = createClient()
    await supabase
      .from('organizations')
      .update({ payment_status: status, paid_until: paidUntil || null })
      .eq('id', org.id)
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
      <h2 className="font-semibold text-gray-900 mb-4">Управління оплатою</h2>
      <div className="flex items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Статус оплати</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value as Organization['payment_status'])}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="trial">Пробний</option>
            <option value="paid">Оплачено</option>
            <option value="unpaid">Не оплачено</option>
            <option value="overdue">Прострочено</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Оплачено до</label>
          <input
            type="date"
            value={paidUntil}
            onChange={e => setPaidUntil(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {saving ? 'Збереження...' : 'Зберегти'}
        </button>
      </div>
    </div>
  )
}
