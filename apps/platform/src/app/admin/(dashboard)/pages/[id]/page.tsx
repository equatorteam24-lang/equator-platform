import { createClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import PageEditor from '../PageEditor'

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: page } = await supabase.from('pages').select('*').eq('id', id).single()
  if (!page) notFound()
  return <PageEditor page={page} />
}
