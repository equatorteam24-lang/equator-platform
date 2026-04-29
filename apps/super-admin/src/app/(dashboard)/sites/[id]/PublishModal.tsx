'use client'

import { useState } from 'react'

function generatePassword(length = 12): string {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%'
  let result = ''
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length]
  }
  return result
}

interface PublishResult {
  orgId: string
  orgSlug: string
  userId: string
  adminUrl: string
  siteUrl: string
}

interface PublishModalProps {
  projectId: string
  open: boolean
  onClose: () => void
  onPublished: (result: PublishResult) => void
}

export default function PublishModal({ projectId, open, onClose, onPublished }: PublishModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState(() => generatePassword())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<PublishResult | null>(null)
  const [copied, setCopied] = useState(false)

  if (!open) return null

  async function handlePublish() {
    if (!email.trim()) {
      setError('Введіть email кліє��та')
      return
    }
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`/api/sites/${projectId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Помилка публіка��ії')
        return
      }

      const publishResult: PublishResult = {
        orgId: data.orgId,
        orgSlug: data.orgSlug,
        userId: data.userId,
        adminUrl: data.adminUrl,
        siteUrl: data.siteUrl,
      }
      setResult(publishResult)
      onPublished(publishResult)
    } catch {
      setError('Помилка з\'єднання з сервером')
    } finally {
      setLoading(false)
    }
  }

  function handleCopyAll() {
    if (!result) return
    const text = [
      `Сайт: ${result.siteUrl}`,
      `Адмінка: ${result.adminUrl}`,
      `Email: ${email}`,
      `Пароль: ${password}`,
    ].join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleClose() {
    if (loading) return
    setEmail('')
    setPassword(generatePassword())
    setError('')
    setResult(null)
    setCopied(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {!result ? (
          <>
            <div className="px-6 pt-6 pb-4">
              <h2 className="text-lg font-semibold text-gray-900">Опублікувати сайт</h2>
              <p className="mt-1 text-sm text-gray-500">
                Створення доступу до адмінки для клієнта
              </p>
            </div>

            <div className="px-6 pb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email клієнта
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Пароль (згенеровано)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setPassword(generatePassword())}
                    disabled={loading}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition"
                    title="Згенерувати новий"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={handleClose}
                disabled={loading}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
              >
                Скасувати
              </button>
              <button
                onClick={handlePublish}
                disabled={loading}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-50"
              >
                {loading ? 'Публікація...' : 'Опу��лікувати'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-900">Сайт опубліковано!</h2>
              </div>
            </div>

            <div className="px-6 pb-6 space-y-3">
              <div className="rounded-lg bg-gray-50 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Сайт:</span>
                  <a href={result.siteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {result.siteUrl}
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Адмінка:</span>
                  <a href={result.adminUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {result.adminUrl}
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email:</span>
                  <span className="font-mono">{email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Пароль:</span>
                  <span className="font-mono">{password}</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={handleCopyAll}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
              >
                {copied ? 'Скопійовано!' : 'Копіювати все'}
              </button>
              <button
                onClick={handleClose}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition"
              >
                Закрити
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
