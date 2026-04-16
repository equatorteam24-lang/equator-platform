import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase'
import { getCurrentOrgId } from '@/lib/org'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? ''
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const baseUrl = `${proto}://${host}`

  const routes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), priority: 1 },
  ]

  try {
    const orgId = await getCurrentOrgId()
    const supabase = await createClient()
    const { data: pages } = await supabase
      .from('pages')
      .select('slug, updated_at')
      .eq('org_id', orgId)
      .eq('status', 'published')
      .neq('slug', '/')

    pages?.forEach(page => {
      routes.push({
        url: `${baseUrl}${page.slug}`,
        lastModified: new Date(page.updated_at),
        priority: 0.8,
      })
    })
  } catch {}

  return routes
}
