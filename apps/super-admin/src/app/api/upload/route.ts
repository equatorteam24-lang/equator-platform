import { createServiceClient } from '@/lib/service'
import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf']

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const formData = await req.formData()
  const files = formData.getAll('files') as File[]
  const folder = (formData.get('folder') as string) || 'general'
  const projectId = formData.get('projectId') as string

  if (!files.length) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 })
  }

  const service = createServiceClient()
  const uploaded: { name: string; url: string; size: number; type: string }[] = []

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `${file.name} перевищує 10MB` }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `${file.name}: непідтримуваний формат` }, { status: 400 })
    }

    const ext = file.name.split('.').pop() || 'bin'
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60)
    const storagePath = projectId
      ? `sites/${projectId}/${folder}/${timestamp}-${safeName}`
      : `sites/tmp/${folder}/${timestamp}-${safeName}`

    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: uploadError } = await service.storage
      .from('site-assets')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError.message)
      return NextResponse.json({ error: `Помилка завантаження ${file.name}` }, { status: 500 })
    }

    const { data: urlData } = service.storage.from('site-assets').getPublicUrl(storagePath)

    uploaded.push({
      name: file.name,
      url: urlData.publicUrl,
      size: file.size,
      type: file.type,
    })
  }

  return NextResponse.json({ files: uploaded })
}
