// Dynamic bridge URL resolution
// Bridge writes its tunnel URL to Supabase Storage on startup.
// We read it here with a short TTL cache so we always have the latest URL
// even after bridge/tunnel restarts — no Vercel redeploy needed.

let cachedUrl: string | null = null
let cachedAt = 0
const CACHE_TTL = 60_000 // 1 minute

export const BRIDGE_SECRET = process.env.BRIDGE_SECRET || 'uniframe-bridge-secret-change-me'

function invalidateUrlCache() {
  cachedUrl = null
  cachedAt = 0
}

export async function getBridgeUrl(): Promise<string> {
  // Env var override — only for stable URLs (localhost, custom domains)
  // Ignore trycloudflare.com URLs since they change on every tunnel restart
  const envUrl = process.env.BRIDGE_URL
  if (envUrl && !envUrl.includes('trycloudflare.com')) return envUrl

  const now = Date.now()
  if (cachedUrl && now - cachedAt < CACHE_TTL) return cachedUrl

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const res = await fetch(`${supabaseUrl}/storage/v1/object/config/bridge-url.txt`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
      },
      signal: AbortSignal.timeout(5000),
    })

    if (res.ok) {
      const url = (await res.text()).trim()
      if (url.startsWith('http')) {
        cachedUrl = url
        cachedAt = now
        return url
      }
    }
  } catch {
    // Fall through to cached or default
  }

  // Return stale cache if fresh fetch failed
  if (cachedUrl) return cachedUrl

  return 'http://localhost:3001'
}

/**
 * Fetch wrapper with retry for bridge requests.
 * On transient errors (401 unauthorized from stale tunnel, 5xx, network errors)
 * invalidates cached URL and retries with a fresh URL from Supabase Storage.
 */
export async function bridgeFetch(
  path: string,
  init: RequestInit,
  timeoutMs = 90000,
): Promise<Response> {
  const MAX_RETRIES = 2
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const bridgeUrl = await getBridgeUrl()
      const res = await fetch(`${bridgeUrl}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BRIDGE_SECRET}`,
          ...init.headers,
        },
        signal: AbortSignal.timeout(timeoutMs),
      })

      // Retryable status codes: 401 (stale tunnel auth), 502/503/504 (tunnel down)
      if ((res.status === 401 || res.status >= 502) && attempt < MAX_RETRIES) {
        invalidateUrlCache()
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)))
        continue
      }

      return res
    } catch (err: any) {
      lastError = err
      // Network errors / timeouts — retry with fresh URL
      if (attempt < MAX_RETRIES) {
        invalidateUrlCache()
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)))
      }
    }
  }

  throw lastError || new Error('Bridge unreachable after retries')
}
