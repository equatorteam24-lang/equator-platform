'use client'

import { useState } from 'react'
import { useLeadForm } from '@/hooks/useLeadForm'

export default function ContactForm() {
  const { submit, isLoading, isSuccess, error } = useLeadForm()
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await submit(form)
  }

  if (isSuccess) {
    return (
      <div className="w-full max-w-md rounded-2xl bg-green-50 border border-green-200 px-8 py-10 text-center">
        <p className="text-2xl mb-2">✓</p>
        <p className="font-semibold text-green-800">Заявку отримано!</p>
        <p className="text-sm text-green-600 mt-1">Ми зв'яжемось з вами найближчим часом.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <input
        name="name"
        type="text"
        required
        placeholder="Ваше ім'я"
        value={form.name}
        onChange={handleChange}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
      />
      <input
        name="phone"
        type="tel"
        placeholder="Телефон"
        value={form.phone}
        onChange={handleChange}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
      />
      <input
        name="email"
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
      />
      <textarea
        name="message"
        placeholder="Повідомлення (необов'язково)"
        value={form.message}
        onChange={handleChange}
        rows={3}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition resize-none"
      />
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {isLoading ? 'Надсилання...' : 'Відправити заявку'}
      </button>
    </form>
  )
}
