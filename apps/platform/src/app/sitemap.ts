import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase'
import { ORG_ID } from '@/lib/org'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!

  // Static pages
  const routes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), priority: 1 },
  ]

  // Dynamic pages from CMS
  try {
    const supabase = await createClient()
    const { data: pages } = await supabase
      .from('pages')
      .select('slug, updated_at')
      .eq('org_id', ORG_ID)
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
