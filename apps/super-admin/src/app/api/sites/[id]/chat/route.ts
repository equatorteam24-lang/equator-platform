import { createServiceClient } from '@/lib/service'
import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { message } = body

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Повідомлення обов\'язкове' }, { status: 400 })
  }

  const service = createServiceClient()

  // Get project
  const { data: project, error: fetchErr } = await service
    .from('site_projects')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !project) {
    return NextResponse.json({ error: 'Проект не знайдено' }, { status: 404 })
  }

  // Update status to revising
  await service.from('site_projects')
    .update({ status: 'revising', updated_at: new Date().toISOString() })
    .eq('id', id)

  // Add user message to chat history
  const chatHistory = [...(project.chat_history || []), { role: 'user', content: message, timestamp: new Date().toISOString() }]

  try {
    const { query } = await import('@anthropic-ai/claude-agent-sdk')
    const path = await import('path')
    const projectDir = path.join(process.cwd(), '..', '..', 'tmp-sites', id)

    let assistantResponse = ''

    const queryOptions: any = {
      cwd: projectDir,
      model: project.form_data?.model || 'claude-sonnet-4-6',
      allowedTools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
      permissionMode: 'bypassPermissions',
      maxTurns: 15,
    }

    // Resume session if available
    if (project.session_id) {
      queryOptions.resume = project.session_id
    }

    const chatPrompt = `
# КОНТЕКСТ
Ти — агент-конструктор сайтів Equator Agency. Ти працюєш над сайтом клієнта.

## БЕЗПЕКА
⛔ Працюй ВИКЛЮЧНО в папці проекту: ${projectDir}
⛔ Заборонено: доступ поза проектом, батьківські директорії, системні команди, .env файли
✅ Дозволено: читати/писати файли в ${projectDir}, встановлювати npm пакети локально, build/dev команди

## ЗАПИТ ВІД ДИЗАЙНЕРА/МЕНЕДЖЕРА
${message}

## ЩО РОБИТИ
- Якщо запит стосується дизайну — відредагуй src/App.jsx відповідно
- Якщо запит стосується нових функцій (Google Maps, слайдер, калькулятор тощо) — можеш встановити npm пакет і підключити
- Якщо запит про ЕТАП 2 (адмінка, Supabase, CRM, аналітика, SEO, Telegram) — підключи відповідну інтеграцію:
  - Адмін-панель: зроби щоб весь контент на сайті можна було редагувати через /admin
  - CRM: форми відправляють дані в Supabase таблицю leads
  - Аналітика: трекінг page views і подій
  - SEO: мета-теги, Open Graph, structured data
- Після змін — підтверди що саме було змінено

Дій зараз.
`

    for await (const msg of query({
      prompt: chatPrompt,
      options: queryOptions,
    })) {
      if (msg.type === 'assistant' && msg.message?.content) {
        for (const block of msg.message.content) {
          if ('text' in block) assistantResponse += block.text
        }
      }
      // Capture new session ID
      if (msg.type === 'system' && (msg as any).session_id) {
        await service.from('site_projects')
          .update({ session_id: (msg as any).session_id })
          .eq('id', id)
      }
    }

    // Re-build and re-deploy
    const { execSync } = await import('child_process')
    let newUrl = project.vercel_url
    try {
      execSync('npx vite build', { cwd: projectDir, timeout: 60000 })
      const deployOutput = execSync(
        'npx --yes vercel deploy --prod --yes 2>&1',
        { cwd: projectDir, timeout: 120000, encoding: 'utf-8' }
      )
      const urlMatch = deployOutput.match(/https:\/\/[^\s]+\.vercel\.app/)
      if (urlMatch) newUrl = urlMatch[0]
    } catch (e: any) {
      assistantResponse += '\n\n⚠️ Білд або деплой зазнав помилки. Перевірте код.'
    }

    // Update chat history and status
    chatHistory.push({ role: 'assistant', content: assistantResponse, timestamp: new Date().toISOString() })

    const fs = await import('fs/promises')
    let generatedCode = project.generated_code
    try {
      generatedCode = await fs.readFile(path.join(projectDir, 'src', 'App.jsx'), 'utf-8')
    } catch {}

    await service.from('site_projects').update({
      status: 'review',
      chat_history: chatHistory,
      generated_code: generatedCode,
      vercel_url: newUrl,
      updated_at: new Date().toISOString(),
    }).eq('id', id)

    return NextResponse.json({
      response: assistantResponse,
      vercel_url: newUrl,
    })
  } catch (err: any) {
    // Restore status on error
    chatHistory.push({ role: 'assistant', content: `Помилка: ${err.message}`, timestamp: new Date().toISOString() })
    await service.from('site_projects').update({
      status: 'review',
      chat_history: chatHistory,
      updated_at: new Date().toISOString(),
    }).eq('id', id)

    return NextResponse.json({ error: err.message, response: `Помилка агента: ${err.message}` }, { status: 500 })
  }
}
