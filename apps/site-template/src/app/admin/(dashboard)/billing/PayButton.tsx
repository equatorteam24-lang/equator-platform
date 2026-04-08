'use client'

import { useState } from 'react'

export default function PayButton({
  plan,
  label,
  highlight,
}: {
  plan: 'monthly' | 'annual'
  label: string
  highlight?: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/billing/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Помилка сервера')
      }

      const { payUrl, params } = await res.json() as {
        payUrl: string
        params: Record<string, string>
      }

      // Auto-submit form to WayForPay hosted page
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = payUrl

      for (const [key, value] of Object.entries(params)) {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = value
        form.appendChild(input)
      }

      document.body.appendChild(form)
      form.submit()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handlePay}
        disabled={loading}
        className={`w-full rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
          highlight
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-900 text-white hover:bg-gray-700'
        }`}
      >
        {loading ? 'Перенаправлення...' : label}
      </button>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  )
}
