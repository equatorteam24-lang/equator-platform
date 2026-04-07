'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

function getOrCreateSessionId(): string {
  let sid = sessionStorage.getItem('eq_sid')
  if (!sid) {
    sid = crypto.randomUUID()
    sessionStorage.setItem('eq_sid', sid)
  }
  return sid
}

function getDevice(): string {
  const w = window.innerWidth
  if (w < 768) return 'mobile'
  if (w < 1024) return 'tablet'
  return 'desktop'
}

export function useAnalytics() {
  const pathname = usePathname()
  const prevPath = useRef<string | null>(null)

  useEffect(() => {
    if (prevPath.current === pathname) return
    prevPath.current = pathname

    const payload = {
      session_id: getOrCreateSessionId(),
      event:      'pageview',
      page:       pathname,
      referrer:   document.referrer,
      device:     getDevice(),
    }

    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {})
  }, [pathname])
}

// Track custom events (e.g. button clicks, form submissions)
export function trackEvent(event: string, page?: string) {
  const payload = {
    session_id: getOrCreateSessionId(),
    event,
    page:       page ?? window.location.pathname,
    referrer:   document.referrer,
    device:     getDevice(),
  }

  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {})
}
