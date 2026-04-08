import { createClient } from '@/lib/supabase'
import { ORG_ID } from '@/lib/org'
import { DEFAULT_CONTENT, mergeWithDefaults } from '@/lib/content'
import ContentEditor from './ContentEditor'

export default async function ContentPage() {
  const supabase = await createClient()

  const [{ data: siteRows }, { data: pages }] = await Promise.all([
    supabase
      .from('site_content')
      .select('section, content')
      .eq('org_id', ORG_ID),
    supabase
      .from('pages')
      .select('id, title, slug')
      .eq('org_id', ORG_ID)
      .order('created_at'),
  ])

  const dbMap: Record<string, unknown> = {}
  for (const row of siteRows ?? []) dbMap[row.section] = row.content

  const content = mergeWithDefaults(dbMap)

  return <ContentEditor initialContent={content} extraPages={pages ?? []} />
}
