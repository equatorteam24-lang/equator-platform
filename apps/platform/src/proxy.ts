import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

// Resolve host → client slug. Cached in-memory for 60s to avoid hitting the DB
// on every request. Middleware runs on the Edge runtime — use the Supabase JS
// client directly (no cookie handling needed for this read).
type SlugCacheEntry = { slug: string | null; expires: number }
const slugCache = new Map<string, SlugCacheEntry>()
const TTL_MS = 60_000

function normalizeHost(host: string): string {
  return host.toLowerCase().replace(/^www\./, '').split(':')[0]
}

const PLATFORM_HOST = 'uniframe.app'

function extractSubdomain(host: string): string | null {
  const normalized = normalizeHost(host)
  if (normalized.endsWith(`.${PLATFORM_HOST}`)) {
    const sub = normalized.slice(0, -(PLATFORM_HOST.length + 1))
    if (sub && !sub.includes('.')) return sub
  }
  return null
}

async function resolveSlugForHost(host: string): Promise<string | null> {
  const key = normalizeHost(host)
  const now = Date.now()
  const cached = slugCache.get(key)
  if (cached && cached.expires > now) return cached.slug

  const db = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Check if this is a subdomain of uniframe.app (e.g., acme.uniframe.app)
  const subdomain = extractSubdomain(host)

  let data
  if (subdomain) {
    ;({ data } = await db
      .from('organizations')
      .select('slug')
      .eq('slug', subdomain)
      .maybeSingle())
  } else {
    ;({ data } = await db
      .from('organizations')
      .select('slug')
      .eq('domain', key)
      .maybeSingle())
  }

  const slug = (data?.slug as string | undefined) ?? null
  slugCache.set(key, { slug, expires: now + TTL_MS })
  return slug
}

export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAll: (cookiesToSet: { name: string; value: string; options?: any }[]) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — keeps cookies alive after external redirects (e.g. WayForPay)
  await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // /admin and /api resolve org from host inside handlers — pass through.
  // Only public site routes get rewritten to the per-client (sites)/{slug}/ folder.
  const isPassthrough =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/favicon.ico'

  if (!isPassthrough) {
    const host = request.headers.get('host') ?? ''
    const slug = await resolveSlugForHost(host)

    if (slug) {
      // Avoid double-rewrite if the path already begins with the slug.
      if (!pathname.startsWith(`/${slug}`)) {
        const url = request.nextUrl.clone()
        url.pathname = `/${slug}${pathname === '/' ? '' : pathname}`
        const rewritten = NextResponse.rewrite(url, { request })
        supabaseResponse.cookies.getAll().forEach(c =>
          rewritten.cookies.set(c.name, c.value)
        )
        rewritten.headers.set('x-pathname', pathname)
        return rewritten
      }
    }
    // If no slug found, fall through — Next.js will 404 (desired for
    // unconfigured domains).
  }

  // Pass pathname to server components via header (used by root layout for
  // route-type detection)
  supabaseResponse.headers.set('x-pathname', pathname)

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
