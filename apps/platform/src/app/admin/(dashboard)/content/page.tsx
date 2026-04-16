import { createClient } from '@/lib/supabase'
import { getCurrentOrgId } from '@/lib/org'
import { mergeWithDefaults } from '@/lib/content'
import ContentEditor from './ContentEditor'

export default async function ContentPage() {
  const orgId = await getCurrentOrgId()
  const supabase = await createClient()

  const [{ data: siteRows }, { data: pages }] = await Promise.all([
    supabase
      .from('site_content')
      .select('section, content')
      .eq('org_id', orgId),
    supabase
      .from('pages')
      .select('id, title, slug')
      .eq('org_id', orgId)
      .order('created_at'),
  ])

  const dbMap: Record<string, unknown> = {}
  for (const row of siteRows ?? []) dbMap[row.section] = row.content

  const content = mergeWithDefaults(dbMap)

  return <ContentEditor initialContent={content} extraPages={pages ?? []} />
}
