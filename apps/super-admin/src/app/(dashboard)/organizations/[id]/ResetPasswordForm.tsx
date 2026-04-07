'use client'

import { useState } from 'react'

export default function ResetPasswordForm({ orgId }: { orgId: string }) {
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ ok?: boolean; error?: string } | null>(null)

  async function save() {
    if (password.length < 8) { setResult({ error: 'Мінімум 8 символів' }); return }
    setSaving(true)
    setResult(null)
    const res = await fetch(`/api/organizations/${orgId}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword: password }),
    })
    const json = await res.json()
    setResult(json)
    setSaving(false)
    if (json.ok) setPassword('')
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
      <h2 className="font-semibold text-gray-900 mb-4">Доступ клієнта</h2>
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">Новий пароль для клієнта</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Мінімум 8 символів"
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
        </div>
        <button onClick={save} disabled={saving}
          className="rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-900 disabled:opacity-50 transition">
          {saving ? 'Збереження...' : 'Змінити пароль'}
        </button>
      </div>
      {result?.ok    && <p className="text-sm text-green-600 mt-2">Пароль змінено ✓</p>}
      {result?.error && <p className="text-sm text-red-600 mt-2">{result.error}</p>}
    </div>
  )
}
