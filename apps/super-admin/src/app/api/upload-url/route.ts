import { createServiceClient } from '@/lib/service'
import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { url, folder } = await req.json()
  if (!url?.trim()) return NextResponse.json({ error: 'URL обов\'язковий' }, { status: 400 })

  try {
    // Download the image
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/*,*/*',
      },
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) {
      return NextResponse.json({ error: `Не вдалося завантажити: ${res.status} ${res.statusText}` }, { status: 400 })
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg'
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'URL не є зображенням' }, { status: 400 })
    }

    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.length > MAX_SIZE) {
      return NextResponse.json({ error: 'Зображення перевищує 10MB' }, { status: 400 })
    }

    // Determine extension from content type
    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/svg+xml': 'svg',
    }
    const ext = extMap[contentType] || 'jpg'

    // Extract a readable name from URL
    const urlPath = new URL(url).pathname
    const originalName = urlPath.split('/').pop()?.split('?')[0] || 'image'
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60)
    const timestamp = Date.now()
    const fileName = safeName.includes('.') ? safeName : `${safeName}.${ext}`
    const storagePath = `sites/tmp/${folder || 'materials'}/${timestamp}-${fileName}`

    const service = createServiceClient()
    const { error: uploadError } = await service.storage
      .from('site-assets')
      .upload(storagePath, buffer, {
        contentType,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: `Помилка збереження: ${uploadError.message}` }, { status: 500 })
    }

    const { data: urlData } = service.storage.from('site-assets').getPublicUrl(storagePath)

    return NextResponse.json({
      file: {
        name: fileName,
        url: urlData.publicUrl,
        size: buffer.length,
        type: contentType,
      },
    })
  } catch (err: any) {
    if (err.name === 'TimeoutError') {
      return NextResponse.json({ error: 'Таймаут завантаження (30с)' }, { status: 408 })
    }
    return NextResponse.json({ error: `Помилка: ${err.message}` }, { status: 500 })
  }
}
