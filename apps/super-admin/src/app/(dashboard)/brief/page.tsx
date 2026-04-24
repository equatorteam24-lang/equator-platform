'use client'

import { useState } from 'react'

export default function BriefPage() {
  const [brief, setBrief] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    if (!brief.trim()) {
      setError('Вставте бриф від клієнта')
      return
    }

    setLoading(true)
    setError('')
    setResult('')

    try {
      const res = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Помилка генерації')
        setLoading(false)
        return
      }

      const data = await res.json()
      setResult(data.prompt || '')
    } catch {
      setError('Мережева помилка')
    }

    setLoading(false)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Бриф → Промпт</h1>
      <p className="text-sm text-gray-500 mb-8">
        Вставте сирий бриф від клієнта — отримайте готовий промпт з структурою сайту та текстами для конструктора
      </p>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Бриф від клієнта
          </label>
          <textarea
            value={brief}
            onChange={e => setBrief(e.target.value)}
            rows={20}
            placeholder={'Вставте сюди все що є від клієнта: назва компанії, чим займаються, які послуги, контакти, побажання по дизайну, тексти...\n\nНаприклад:\nКомпанія "ТрансЛогістика" — вантажні перевезення по Україні.\nТелефон: +380 44 123 45 67\nПослуги: перевезення вантажів, складські послуги, митне оформлення.\nПотрібен сайт з формою зворотнього зв\'язку.'}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm resize-vertical focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition min-h-[480px]"
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !brief.trim()}
            className="mt-4 w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Генерую промпт...
              </span>
            ) : (
              'Згенерувати промпт'
            )}
          </button>
        </div>

        {/* Output */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Готовий промпт
            </label>
            {result && (
              <button
                onClick={handleCopy}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 transition flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Скопійовано
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                    </svg>
                    Копіювати
                  </>
                )}
              </button>
            )}
          </div>
          <div className="relative">
            <textarea
              value={result}
              readOnly
              rows={20}
              placeholder="Тут з'явиться згенерований промпт..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm resize-vertical bg-gray-50 focus:outline-none min-h-[480px] font-mono text-[13px] leading-relaxed"
            />
            {loading && (
              <div className="absolute inset-0 bg-white/60 rounded-lg flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  <span className="text-sm text-gray-500">AI обробляє бриф...</span>
                </div>
              </div>
            )}
          </div>
          {result && (
            <p className="mt-2 text-xs text-gray-400">
              Скопіюйте результат і вставте в поля "Структура сайту" та "Опис компанії" при створенні сайту в Конструкторі.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
