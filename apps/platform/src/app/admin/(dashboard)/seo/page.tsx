import { createClient } from '@/lib/supabase'
import { getCurrentOrgId } from '@/lib/org'
import SeoEditor from './SeoEditor'
import type { PageSeo } from '@equator/db/types'

export default async function SeoPage() {
  const orgId = await getCurrentOrgId()
  const supabase = await createClient()

  const [{ data: pages }, { data: homeRow }] = await Promise.all([
    supabase
      .from('pages')
      .select('id, title, slug, seo, status')
      .eq('org_id', orgId)
      .order('created_at'),
    supabase
      .from('site_content')
      .select('content')
      .eq('org_id', orgId)
      .eq('section', 'seo')
      .single(),
  ])

  // Virtual homepage entry — SEO stored in site_content
  const homepageSeo = (homeRow?.content ?? {}) as PageSeo
  const homepage = {
    id:         'homepage',
    title:      'Головна сторінка',
    slug:       '/',
    seo:        homepageSeo,
    status:     'published',
    isHomepage: true,
  }

  const allPages = [homepage, ...(pages ?? [])]

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">SEO</h1>
        <p className="text-sm text-gray-400 mt-0.5">Мета-теги для кожної сторінки</p>
      </div>
      <SeoEditor pages={allPages} />
    </div>
  )
}
