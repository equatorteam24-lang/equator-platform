'use client'

import { useState, useEffect } from 'react'
import { useLeadForm } from '@/hooks/useLeadForm'

interface LeadModalProps {
  onClose: () => void
}

export default function LeadModal({ onClose }: LeadModalProps) {
  const { submit, state, error } = useLeadForm()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    submit({ name, phone, message })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-[24px] w-full max-w-[500px] p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-[#f4f5f9] hover:bg-gray-200 transition-colors text-gray-600"
          aria-label="Закрити"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M1 1l14 14M15 1L1 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {state === 'success' ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-[#fe4f18] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M5 14l7 7L23 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="font-heading font-semibold text-2xl text-[#090909] mb-2">Дякуємо!</h3>
            <p className="text-[#9c9c9c]">Ми зв'яжемося з вами найближчим часом.</p>
            <button
              onClick={onClose}
              className="mt-6 bg-[#fe4f18] text-white px-8 py-3 rounded-full font-medium hover:bg-[#e0400e] transition-colors"
            >
              Закрити
            </button>
          </div>
        ) : (
          <>
            <h3 className="font-heading font-semibold text-2xl text-[#090909] mb-2">Залишити заявку</h3>
            <p className="text-[#9c9c9c] text-sm mb-6">Зв'яжемося з вами та проконсультуємо безкоштовно.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Ваше ім'я *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-[#e5e5e5] rounded-[12px] px-4 py-3 text-[#090909] placeholder-[#9c9c9c] outline-none focus:border-[#fe4f18] transition-colors"
              />
              <input
                type="tel"
                placeholder="Номер телефону *"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full border border-[#e5e5e5] rounded-[12px] px-4 py-3 text-[#090909] placeholder-[#9c9c9c] outline-none focus:border-[#fe4f18] transition-colors"
              />
              <textarea
                placeholder="Опишіть ваш проект (необов'язково)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full border border-[#e5e5e5] rounded-[12px] px-4 py-3 text-[#090909] placeholder-[#9c9c9c] outline-none focus:border-[#fe4f18] transition-colors resize-none"
              />

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={state === 'loading'}
                className="bg-[#fe4f18] text-white rounded-full py-4 font-medium text-base hover:bg-[#e0400e] transition-colors disabled:opacity-60 mt-2"
              >
                {state === 'loading' ? 'Відправляємо...' : 'Відправити заявку'}
              </button>

              <p className="text-center text-xs text-[#9c9c9c]">
                Натискаючи кнопку, ви погоджуєтесь з обробкою персональних даних
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
