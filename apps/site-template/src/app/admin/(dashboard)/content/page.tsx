import { createClient } from '@/lib/supabase'
import { ORG_ID } from '@/lib/org'
import { DEFAULT_CONTENT, mergeWithDefaults } from '@/lib/content'
import ContentEditor from './ContentEditor'

export default async function ContentPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('site_content')
    .select('section, content')
    .eq('org_id', ORG_ID)

  // Build merged content: defaults + DB overrides
  const dbMap: Record<string, unknown> = {}
  for (const row of data ?? []) {
    dbMap[row.section] = row.content
  }

  const content = mergeWithDefaults(dbMap)

  return <ContentEditor initialContent={content} />
}
