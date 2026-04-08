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

// Persistent visitor ID (survives sessions, localStorage)
function getOrCreateVisitorId(): string {
  let vid = localStorage.getItem('eq_vid')
  if (!vid) {
    vid = crypto.randomUUID()
    localStorage.setItem('eq_vid', vid)
  }
  return vid
}

function getDevice(): string {
  const w = window.innerWidth
  if (w < 768) return 'mobile'
  if (w < 1024) return 'tablet'
  return 'desktop'
}

function getBrowser(): string {
  const ua = navigator.userAgent
  if (ua.includes('Edg/'))    return 'Edge'
  if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera'
  if (ua.includes('Chrome/')) return 'Chrome'
  if (ua.includes('Firefox/')) return 'Firefox'
  if (ua.includes('Safari/')) return 'Safari'
  return 'Other'
}

function getUtmParams(): { utm_source?: string; utm_medium?: string; utm_campaign?: string } {
  const sp = new URLSearchParams(window.location.search)
  const result: { utm_source?: string; utm_medium?: string; utm_campaign?: string } = {}
  const src = sp.get('utm_source')
  const med = sp.get('utm_medium')
  const cam = sp.get('utm_campaign')
  if (src) result.utm_source = src
  if (med) result.utm_medium = med
  if (cam) result.utm_campaign = cam
  return result
}

function sendEvent(payload: Record<string, unknown>) {
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {})
}

export function useAnalytics() {
  const pathname = usePathname()
  const prevPath = useRef<string | null>(null)
  const pageStartTime = useRef<number>(Date.now())

  // Send duration for previous page before tracking new pageview
  useEffect(() => {
    if (prevPath.current !== null && prevPath.current !== pathname) {
      const duration = Math.round((Date.now() - pageStartTime.current) / 1000)
      sendEvent({
        session_id: getOrCreateSessionId(),
        visitor_id: getOrCreateVisitorId(),
        event:      'page_leave',
        page:       prevPath.current,
        device:     getDevice(),
        duration,
      })
    }

    if (prevPath.current === pathname) return
    prevPath.current = pathname
    pageStartTime.current = Date.now()

    sendEvent({
      session_id:   getOrCreateSessionId(),
      visitor_id:   getOrCreateVisitorId(),
      event:        'pageview',
      page:         pathname,
      referrer:     document.referrer,
      device:       getDevice(),
      browser:      getBrowser(),
      ...getUtmParams(),
    })
  }, [pathname])

  // Send duration on tab close / hide
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        const duration = Math.round((Date.now() - pageStartTime.current) / 1000)
        sendEvent({
          session_id: getOrCreateSessionId(),
          visitor_id: getOrCreateVisitorId(),
          event:      'page_leave',
          page:       window.location.pathname,
          device:     getDevice(),
          duration,
        })
        pageStartTime.current = Date.now()
      } else {
        pageStartTime.current = Date.now()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])
}

// Track custom events (e.g. button clicks, form submissions)
export function trackEvent(event: string, page?: string) {
  sendEvent({
    session_id: getOrCreateSessionId(),
    visitor_id: getOrCreateVisitorId(),
    event,
    page:       page ?? window.location.pathname,
    referrer:   document.referrer,
    device:     getDevice(),
    browser:    getBrowser(),
    ...getUtmParams(),
  })
}
