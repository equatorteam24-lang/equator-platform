'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewOrganizationPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    orgName: '', orgSlug: '', plan: '',
    clientName: '', clientEmail: '', clientPassword: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm(prev => {
      const next = { ...prev, [name]: value }
      // Auto-generate slug from org name
      if (name === 'orgName') {
        next.orgSlug = value.toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
      }
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const json = await res.json()
    if (!res.ok) { setError(json.error); setLoading(false); return }

    router.push(`/organizations/${json.orgId}`)
    router.refresh()
  }

  return (
    <div className="p-8 max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/organizations" className="text-gray-400 hover:text-gray-600 text-sm">← Назад</Link>
        <h1 className="text-xl font-bold text-gray-900">Новий сайт</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Organization */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Організація</h2>

          <Field label="Назва сайту *">
            <input name="orgName" required value={form.orgName} onChange={handleChange}
              placeholder="ТОВ Ромашка" className={input} />
          </Field>

          <Field label="Slug (унікальний ідентифікатор) *" hint="Тільки латиниця, цифри, дефіс">
            <input name="orgSlug" required value={form.orgSlug} onChange={handleChange}
              placeholder="romashka" className={`${input} font-mono`} />
          </Field>

          <Field label="Тариф">
            <select name="plan" value={form.plan} onChange={handleChange} className={input}>
              <option value="">— не вибрано —</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
            </select>
          </Field>
        </div>

        {/* Client credentials */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Доступ клієнта</h2>
          <p className="text-xs text-gray-400">Клієнт буде використовувати ці дані для входу в адмінку свого сайту</p>

          <Field label="Ім'я клієнта">
            <input name="clientName" value={form.clientName} onChange={handleChange}
              placeholder="Іван Іванов" className={input} />
          </Field>

          <Field label="Email *">
            <input name="clientEmail" type="email" required value={form.clientEmail} onChange={handleChange}
              placeholder="client@example.com" className={input} />
          </Field>

          <Field label="Пароль *" hint="Мінімум 8 символів. Передайте клієнту особисто або через захищений канал">
            <input name="clientPassword" type="password" required minLength={8}
              value={form.clientPassword} onChange={handleChange}
              placeholder="••••••••" className={input} />
          </Field>
        </div>

        <button type="submit" disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition">
          {loading ? 'Створення...' : 'Створити сайт і акаунт клієнта'}
        </button>
      </form>
    </div>
  )
}

const input = 'w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}
