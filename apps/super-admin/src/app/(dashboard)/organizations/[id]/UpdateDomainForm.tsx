'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface DnsRecord {
  type: string
  name: string
  value: string
}

export default function UpdateDomainForm({ orgId, domain, slug }: { orgId: string; domain: string | null; slug: string }) {
  const router = useRouter()
  const [value, setValue] = useState(domain ?? '')
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{
    ok: boolean
    vercel?: { added: boolean; verified?: boolean; error?: string; note?: string }
    dns?: { cname: DnsRecord; a: DnsRecord }
    error?: string
  } | null>(null)

  async function save() {
    if (!value.trim()) return
    setSaving(true)
    setResult(null)

    try {
      const res = await fetch(`/api/organizations/${orgId}/domain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: value.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setResult({ ok: false, error: data.error })
      } else {
        setResult({ ok: true, vercel: data.vercel, dns: data.dns })
        router.refresh()
      }
    } catch {
      setResult({ ok: false, error: 'Помилка з\'єднання' })
    } finally {
      setSaving(false)
    }
  }

  const subdomainUrl = `https://${slug}.uniframe.app`

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 space-y-4">
      <h2 className="font-semibold text-gray-900">Домен сайту</h2>

      {/* Current subdomain */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500">Тимчасовий:</span>
        <a href={subdomainUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          {slug}.uniframe.app
        </a>
      </div>

      {/* Custom domain input */}
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
        </div>
        <button onClick={save} disabled={saving || !value.trim()}
          className="rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-900 disabled:opacity-50 transition whitespace-nowrap">
          {saving ? 'Підключення...' : 'Підключити домен'}
        </button>
      </div>

      {/* Result */}
      {result && !result.ok && (
        <p className="text-sm text-red-600">{result.error}</p>
      )}

      {result?.ok && (
        <div className="space-y-3">
          {/* Vercel status */}
          {result.vercel && (
            <div className={`text-sm rounded-lg px-3 py-2 ${result.vercel.added ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
              {result.vercel.added
                ? result.vercel.note || 'Домен додано у Vercel'
                : `Помилка Vercel: ${result.vercel.error}`
              }
              {result.vercel.added && !result.vercel.verified && ' (очікує верифікації DNS)'}
            </div>
          )}

          {/* DNS instructions */}
          {result.dns && (
            <div className="rounded-lg bg-gray-50 p-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">DNS налаштування (в реєстратора домену):</p>
              <div className="text-xs font-mono space-y-1 text-gray-600">
                <p>Варіант 1: <strong>CNAME</strong> {result.dns.cname.name} → {result.dns.cname.value}</p>
                <p>Варіант 2: <strong>A</strong> {result.dns.a.name} → {result.dns.a.value}</p>
              </div>
              <p className="text-xs text-gray-400">Після налаштування DNS домен запрацює протягом кількох хвилин.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
