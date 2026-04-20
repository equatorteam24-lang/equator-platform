import { createServiceClient } from '@/lib/service'
import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Verify superadmin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { name, formData } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Назва проекту обов\'язкова' }, { status: 400 })
  }

  const service = createServiceClient()

  // Create project record
  const { data: project, error: insertError } = await service
    .from('site_projects')
    .insert({
      name: name.trim(),
      status: 'generating',
      form_data: formData,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Launch agent in background (non-blocking)
  launchAgent(project.id, formData, service).catch(err => {
    console.error('Agent error:', err)
    service.from('site_projects').update({ status: 'draft' }).eq('id', project.id)
  })

  return NextResponse.json({ id: project.id, status: 'generating' })
}

async function launchAgent(projectId: string, formData: any, service: any) {
  const { query } = await import('@anthropic-ai/claude-agent-sdk')

  // Create temp working directory for the project
  const fs = await import('fs/promises')
  const path = await import('path')
  const projectDir = path.join(process.cwd(), '..', '..', 'tmp-sites', projectId)

  // Build the prompt from form data
  const prompt = buildPrompt(formData, projectDir)
  await fs.mkdir(path.join(projectDir, 'src'), { recursive: true })

  // Write minimal Vite project scaffold
  await fs.writeFile(path.join(projectDir, 'package.json'), JSON.stringify({
    name: `site-${projectId.slice(0, 8)}`,
    private: true,
    version: '1.0.0',
    type: 'module',
    scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
    dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
    devDependencies: { '@vitejs/plugin-react': '^4.3.4', vite: '^6.0.0' },
  }, null, 2))

  await fs.writeFile(path.join(projectDir, 'vite.config.js'),
    `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nexport default defineConfig({ plugins: [react()] })\n`
  )

  await fs.writeFile(path.join(projectDir, 'index.html'),
    `<!DOCTYPE html>\n<html lang="uk">\n<head>\n<meta charset="UTF-8"/>\n<meta name="viewport" content="width=device-width,initial-scale=1.0"/>\n<title>${formData.companyName || 'Site'}</title>\n</head>\n<body style="margin:0"><div id="root"></div>\n<script type="module" src="/src/main.jsx"></script>\n</body>\n</html>\n`
  )

  await fs.writeFile(path.join(projectDir, 'src', 'main.jsx'),
    `import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App.jsx'\nReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>)\n`
  )

  let sessionId = ''
  let generatedCode = ''

  // Run the agent
  for await (const message of query({
    prompt,
    options: {
      cwd: projectDir,
      model: formData.model || 'claude-sonnet-4-6',
      allowedTools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep', 'WebSearch', 'WebFetch'],
      permissionMode: 'bypassPermissions' as any,
      maxTurns: 30,
    },
  })) {
    // Capture session ID for resume
    if (message.type === 'system' && (message as any).session_id) {
      sessionId = (message as any).session_id
    }
  }

  // Read generated code
  try {
    generatedCode = await fs.readFile(path.join(projectDir, 'src', 'App.jsx'), 'utf-8')
  } catch {
    // Try alternative filenames
    const { readdirSync } = await import('fs')
    const srcFiles = readdirSync(path.join(projectDir, 'src')).filter((f: string) => f.endsWith('.jsx'))
    if (srcFiles.length > 0) {
      generatedCode = await fs.readFile(path.join(projectDir, 'src', srcFiles[0]), 'utf-8')
    }
  }

  // Build & deploy
  const { execSync } = await import('child_process')
  try {
    execSync('npm install', { cwd: projectDir, timeout: 60000 })
    execSync('npx vite build', { cwd: projectDir, timeout: 60000 })

    const deployOutput = execSync(
      'npx --yes vercel deploy --prod --yes 2>&1',
      { cwd: projectDir, timeout: 120000, encoding: 'utf-8' }
    )

    // Extract URL from deploy output
    const urlMatch = deployOutput.match(/https:\/\/[^\s]+\.vercel\.app/)
    const vercelUrl = urlMatch ? urlMatch[0] : null

    // Update project in DB
    await service.from('site_projects').update({
      status: 'review',
      generated_code: generatedCode,
      vercel_url: vercelUrl,
      session_id: sessionId,
      updated_at: new Date().toISOString(),
    }).eq('id', projectId)
  } catch (buildErr: any) {
    console.error('Build/deploy error:', buildErr.message)
    await service.from('site_projects').update({
      status: 'review',
      generated_code: generatedCode,
      session_id: sessionId,
      updated_at: new Date().toISOString(),
    }).eq('id', projectId)
  }
}

function buildPrompt(formData: any, projectDir: string): string {
  // === SYSTEM CONTEXT ===
  const systemContext = `
# ТИ — АГЕНТ-КОНСТРУКТОР САЙТІВ EQUATOR AGENCY

## Хто ми
Equator — це веб-агентство що створює преміальні сайти для бізнесу.
Ти — AI-агент всередині нашої платформи. Через тебе дизайнери та менеджери створюють сайти для клієнтів.

## БЕЗПЕКА — КРИТИЧНО ВАЖЛИВО
⛔ ТИ ПРАЦЮЄШ ВИКЛЮЧНО В ПАПЦІ ПРОЕКТУ: ${projectDir}
⛔ ЗАБОРОНЕНО:
- Читати, писати, видаляти файли ПОЗА ${projectDir}
- Переходити в батьківські директорії (cd .., ../../)
- Доступ до /home, /etc, змінних середовища, .env файлів
- Доступ до кореня монорепо, apps/, packages/, supabase/
- Виконувати команди що впливають на систему (rm -rf, kill, etc)
- Встановлювати глобальні пакети (npm i -g)
✅ ДОЗВОЛЕНО:
- Читати/писати файли ТІЛЬКИ всередині ${projectDir}
- Встановлювати npm пакети ЛОКАЛЬНО (npm install package-name) в ${projectDir}
- Запускати build/dev команди в ${projectDir}
- Шукати зображення в інтернеті (Unsplash тощо)

Якщо користувач просить щось що виходить за межі папки проекту — ВІДМОВСЯ і поясни чому.

## ТВОЯ ЗАДАЧА — ЕТАП 1: ДИЗАЙН І ВЕРСТКА

Створи преміальний one-page сайт якості Awwwards/Behance.
Ти не просто кодер — ти ДИЗАЙНЕР. Кожен піксель має бути осмисленим.

### Принципи дизайну:
- **Типографіка** — це основа. Використовуй Google Fonts. Заголовки мають бути виразними (великі, bold, можливо з letter-spacing). Тіло тексту — читабельне, з гарним line-height (1.6-1.8).
- **Whitespace** — щедро. Секції з padding 80-120px по вертикалі. Не бійся порожнього простору — він створює повітря.
- **Колірна палітра** — максимум 3-4 кольори. Primary для акцентів, neutral для тексту, light для фонів. Використовуй opacity і відтінки.
- **Фотографії** — ТІЛЬКИ реальні якісні фото з Unsplash. URL формат: https://images.unsplash.com/photo-{id}?w=1920&q=80. Підбирай тематичні фото що підходять бізнесу.
- **Hover ефекти** — на кнопках, посиланнях, картках. Плавні transitions (0.3s ease).
- **Scroll анімації** — IntersectionObserver для fade-in, slide-up при прокрутці. Не перестарайся — 2-3 типи анімацій максимум.
- **Gradient & Glass** — використовуй обережно. Subtle gradient на hero, можливо glassmorphism на картках якщо підходить стилю.
- **Мобільна версія** — обов'язково responsive. Hamburger меню на мобілці. Fluid typography через clamp().
- **Мікро-інтеракції** — hover на картках з підйомом (translateY + shadow), animated underline на посиланнях.
- **Hero секція** — повинна вражати. Великий заголовок, підзаголовок, CTA кнопка, якісне фонове зображення або цікавий layout.

### Структура компонента:
- Один файл src/App.jsx з export default
- CSS через <style> тег всередині компонента (CSS-in-JSX) або inline styles
- Google Fonts через @import в <style>
- Всі тексти УКРАЇНСЬКОЮ мовою
- React хуки: useState, useEffect, useRef
- IntersectionObserver для scroll анімацій
- Форми з валідацією (email, phone, required)

### ЩО НЕ РОБИТИ:
- Three.js, Spline, Canvas — тільки фото-based дизайн
- Tailwind CSS (не встановлений) — пиши CSS вручну
- Зовнішні UI бібліотеки — все руками
- Placeholder тексти типу "Lorem ipsum" — пиши реальний контент
- Стокові іконки замість тексту — краще emoji або SVG inline

## ЕТАП 2: ІНТЕГРАЦІЯ (буде пізніше через чат)
Після затвердження дизайну, через чат тебе попросять:
- Підключити адмін-панель (/admin) щоб весь контент редагувався
- Інтегрувати Supabase для зберігання даних
- Підключити CRM (форми → leads в Supabase)
- Додати аналітику (page views, events)
- SEO мета-теги
- Підключити Telegram бота для нотифікацій
- Інтеграція з платіжною системою якщо потрібно

Поки що зосередься ТІЛЬКИ на етапі 1 — ідеальна верстка.
`

  // === CLIENT BRIEF ===
  const brief: string[] = []
  brief.push(`\n# БРИФ КЛІЄНТА\n`)

  if (formData.companyName) brief.push(`**Компанія:** ${formData.companyName}`)
  if (formData.companyDescription) brief.push(`**Опис:** ${formData.companyDescription}`)
  if (formData.siteType) brief.push(`**Тип сайту:** ${formData.siteType}`)
  if (formData.theme) brief.push(`**Тематика:** ${formData.theme}`)
  if (formData.designStyle) brief.push(`**Стиль дизайну:** ${formData.designStyle}`)

  if (formData.structure) {
    brief.push(`\n**Структура сайту:**\n${formData.structure}`)
  }

  if (formData.referenceUrls) {
    brief.push(`\n**Референси (вивчи їх дизайн):**\n${formData.referenceUrls}`)
  }

  if (formData.primaryColor || formData.secondaryColor) {
    brief.push(`\n**Кольори:** primary ${formData.primaryColor || 'на твій розсуд'}, secondary ${formData.secondaryColor || 'на твій розсуд'}`)
  }

  if (formData.phone || formData.email || formData.address) {
    brief.push(`\n**Контакти:** телефон ${formData.phone || '—'}, email ${formData.email || '—'}, адреса ${formData.address || '—'}`)
  }

  if (formData.socials) brief.push(`**Соціальні мережі:** ${formData.socials}`)

  const enabledFeatures = Object.entries(formData.features || {})
    .filter(([, v]) => v)
    .map(([k]) => k)
  if (enabledFeatures.length) {
    brief.push(`\n**Потрібні функції:** ${enabledFeatures.join(', ')}`)
  }

  if (formData.extraWishes) brief.push(`\n**Додаткові побажання:**\n${formData.extraWishes}`)

  brief.push(`\n# ДІЙ — створи src/App.jsx з повним сайтом`)

  return systemContext + brief.join('\n')
}
