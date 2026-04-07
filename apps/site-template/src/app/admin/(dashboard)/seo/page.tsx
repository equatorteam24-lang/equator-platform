import { createClient } from '@/lib/supabase'
import { ORG_ID } from '@/lib/org'
import SeoEditor from './SeoEditor'

export default async function SeoPage() {
  const supabase = await createClient()
  const { data: pages } = await supabase
    .from('pages')
    .select('id, title, slug, seo, status')
    .eq('org_id', ORG_ID)
    .order('created_at')

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">SEO</h1>
        <p className="text-sm text-gray-400 mt-0.5">Мета-теги для кожної сторінки</p>
      </div>
      <SeoEditor pages={pages ?? []} />
    </div>
  )
}
