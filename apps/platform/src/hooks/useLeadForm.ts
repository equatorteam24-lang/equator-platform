'use client'

import { useState } from 'react'
import { trackEvent } from './useAnalytics'

interface LeadFormData {
  name: string
  email?: string
  phone?: string
  message?: string
}

type FormState = 'idle' | 'loading' | 'success' | 'error'

export function useLeadForm() {
  const [state, setState] = useState<FormState>('idle')
  const [error, setError] = useState<string | null>(null)

  async function submit(data: LeadFormData) {
    setState('loading')
    setError(null)

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          source_page: window.location.pathname,
        }),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? 'Помилка')
      }

      trackEvent('form_submit')
      setState('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка сервера')
      setState('error')
    }
  }

  return { submit, state, error, isLoading: state === 'loading', isSuccess: state === 'success' }
}
