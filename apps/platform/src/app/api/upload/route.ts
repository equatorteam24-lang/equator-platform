import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/service'
import { createClient } from '@/lib/supabase'
import { ORG_ID } from '@/lib/org'

export async function POST(req: NextRequest) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const ext      = file.name.split('.').pop() ?? 'jpg'
  const fileName = `${ORG_ID}/${Date.now()}.${ext}`
  const buffer   = await file.arrayBuffer()

  const supabase = createServiceClient()
  const { error } = await supabase.storage
    .from('media')
    .upload(fileName, buffer, { contentType: file.type, upsert: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(fileName)
  return NextResponse.json({ url: publicUrl })
}
