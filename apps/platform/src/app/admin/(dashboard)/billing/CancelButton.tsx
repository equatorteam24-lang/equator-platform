'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CancelButton() {
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const router = useRouter()

  async function handleCancel() {
    setLoading(true)
    await fetch('/api/billing/cancel', { method: 'POST' })
    router.refresh()
    setLoading(false)
    setConfirm(false)
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Ви впевнені?</span>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
        >
          {loading ? 'Скасовую...' : 'Так, скасувати'}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          Ні
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="text-sm text-gray-400 hover:text-red-600 transition"
    >
      Скасувати підписку
    </button>
  )
}
