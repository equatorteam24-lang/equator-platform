// Runtime org resolution — multi-tenant (Model 2).
// Determines which organization a request belongs to based on the Host header,
// with an in-memory cache (TTL 60s) to avoid hammering the DB.

import { headers } from 'next/headers'
import { createServiceClient } from './service'

export type Org = {
  id: string
  slug: string
  domain: string | null
}

type CacheEntry = { org: Org; expires: number }

const TTL_MS = 60_000
const cache = new Map<string, CacheEntry>()

function normalizeHost(host: string): string {
  return host.toLowerCase().replace(/^www\./, '').split(':')[0]
}

export async function resolveOrgFromHost(rawHost: string): Promise<Org> {
  const host = normalizeHost(rawHost)
  const now = Date.now()
  const cached = cache.get(host)
  if (cached && cached.expires > now) return cached.org

  const db = createServiceClient()
  const { data, error } = await db
    .from('organizations')
    .select('id, slug, domain')
    .eq('domain', host)
    .maybeSingle()

  if (error || !data) {
    throw new Error(`Organization not found for host: ${rawHost}`)
  }

  const org = data as Org
  cache.set(host, { org, expires: now + TTL_MS })
  return org
}

export async function getCurrentOrg(): Promise<Org> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? ''
  if (!host) throw new Error('Missing Host header — cannot resolve organization')
  return resolveOrgFromHost(host)
}

export async function getCurrentOrgId(): Promise<string> {
  return (await getCurrentOrg()).id
}
