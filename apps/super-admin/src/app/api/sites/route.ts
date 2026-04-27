import { bridgeFetch } from '@/lib/bridge'
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

  // Build prompt
  const prompt = buildPrompt(formData, project.id)

  // Launch generation via bridge (non-blocking)
  bridgeFetch('/generate-site', {
    method: 'POST',
    body: JSON.stringify({
      projectId: project.id,
      formData,
      prompt,
    }),
  }).then(async (res) => {
    if (!res.ok) {
      console.error('Bridge generate error:', await res.text())
      await service.from('site_projects').update({ status: 'draft' }).eq('id', project.id)
    } else {
      // Start polling bridge for job completion
      pollJob(project.id, service)
    }
  }).catch(err => {
    console.error('Bridge connection error:', err.message)
    service.from('site_projects').update({ status: 'draft' }).eq('id', project.id)
  })

  return NextResponse.json({ id: project.id, status: 'generating' })
}

// Poll bridge for job completion and update DB
async function pollJob(projectId: string, service: any) {
  let consecutiveFailures = 0
  const MAX_FAILURES = 30 // 30 failures × 10s = 5 min of bridge downtime tolerated

  const interval = setInterval(async () => {
    try {
      const res = await bridgeFetch(`/job/${projectId}`, { method: 'GET' }, 8000)

      if (!res.ok) {
        consecutiveFailures++
        console.warn(`Poll ${projectId}: bridge returned ${res.status} (fail ${consecutiveFailures}/${MAX_FAILURES})`)
        if (consecutiveFailures >= MAX_FAILURES) {
          clearInterval(interval)
          console.error(`Poll ${projectId}: giving up after ${MAX_FAILURES} consecutive failures`)
        }
        return
      }

      consecutiveFailures = 0
      const job = await res.json()

      if (job.status === 'done') {
        clearInterval(interval)
        await service.from('site_projects').update({
          status: 'review',
          generated_code: job.generatedCode || null,
          vercel_url: job.vercelUrl || null,
          updated_at: new Date().toISOString(),
        }).eq('id', projectId)
        console.log(`Poll ${projectId}: done, DB updated to review`)
      } else if (job.status === 'error') {
        clearInterval(interval)
        await service.from('site_projects').update({
          status: 'draft',
          updated_at: new Date().toISOString(),
        }).eq('id', projectId)
        console.log(`Poll ${projectId}: error, DB reverted to draft`)
      }
    } catch (err) {
      consecutiveFailures++
      console.warn(`Poll ${projectId}: fetch error (fail ${consecutiveFailures}/${MAX_FAILURES})`, (err as Error).message)
      if (consecutiveFailures >= MAX_FAILURES) {
        clearInterval(interval)
        console.error(`Poll ${projectId}: giving up after ${MAX_FAILURES} consecutive failures`)
      }
    }
  }, 10000)

  // Stop polling after 20 minutes
  setTimeout(() => clearInterval(interval), 1200000)
}

function buildPrompt(formData: any, projectId: string): string {
  const systemContext = `
# ТИ — АГЕНТ-КОНСТРУКТОР САЙТІВ UNIFRAME

## Хто ми
Uniframe — це веб-агентство що створює преміальні сайти для бізнесу.
Ти — AI-агент всередині нашої платформи.

## БЕЗПЕКА
⛔ Працюй ВИКЛЮЧНО в поточній папці проекту.
⛔ ЗАБОРОНЕНО:
- Читати, писати, видаляти файли ПОЗА поточною папкою
- Переходити в батьківські директорії (cd .., ../../)
- Доступ до /home, /etc, змінних середовища, .env файлів
- Виконувати команди що впливають на систему (rm -rf, kill, etc)
- Встановлювати глобальні пакети (npm i -g)
✅ ДОЗВОЛЕНО:
- Читати/писати файли ТІЛЬКИ в поточній папці
- Встановлювати npm пакети ЛОКАЛЬНО
- Запускати build/dev команди
- Шукати зображення в інтернеті

## ДИЗАЙН — ДЕЛЕГУЄТЬСЯ СКІЛУ /premium-web-design

⚠️ КРИТИЧНО: Дизайн цілком визначається скілом /premium-web-design.
НЕ використовуй generic шаблонні підходи. Скіл надає повні інструкції щодо:
- Вибору шрифтів (є blacklist — Inter, Poppins, Space Grotesk, Montserrat та інші заборонені)
- Структури сторінки (заборонено стандартний hero→features→testimonials→CTA layout)
- Анімацій (заборонено fade-in-from-below, обов'язкові clip-path reveals, scroll-driven effects)
- Кольорів (заборонено purple-to-blue градієнти, neon-on-dark cliché)
- 3D та візуальних ефектів

### Технічні обмеження:
- Один файл src/App.jsx з export default
- CSS через <style> тег (не Tailwind)
- Google Fonts через @import
- Всі тексти УКРАЇНСЬКОЮ
- React хуки: useState, useEffect, useRef
- Форми з валідацією
- НЕ використовувати Lorem ipsum

### Зображення та медіа — ТІЛЬКИ Freepik
⚠️ КРИТИЧНО: Всі зображення ОБОВ'ЯЗКОВО брати з Freepik.
- Використовуй WebSearch для пошуку: site:freepik.com {запит англійською}
- Потім WebFetch щоб отримати сторінку Freepik і знайти прямий URL зображення
- URL формат Freepik: https://img.freepik.com/free-photo/{slug}.jpg або https://img.freepik.com/premium-photo/{slug}.jpg
- Додавай параметри розміру: ?w=1920&q=80 або ?w=1280&q=80 для менших зображень
- ❌ ЗАБОРОНЕНО: Unsplash, Pexels, Pixabay, placeholder URLs, via.placeholder.com
- ❌ ЗАБОРОНЕНО: вигадувати URL зображень — кожен URL має бути реальним, перевіреним через WebSearch/WebFetch
- Шукай релевантні фото для кожної секції (hero, about, services тощо)
- Мінімум 5-8 різних зображень на сайт для візуального різноманіття
- Для відео: шукай відео на Freepik (site:freepik.com video {запит}) або використовуй відео-обкладинки
`

  const brief: string[] = []
  brief.push(`\n# БРИФ КЛІЄНТА\n`)

  if (formData.companyName) brief.push(`**Компанія:** ${formData.companyName}`)
  if (formData.companyDescription) brief.push(`**Опис:** ${formData.companyDescription}`)
  if (formData.siteType) brief.push(`**Тип сайту:** ${formData.siteType}`)
  if (formData.theme) brief.push(`**Тематика:** ${formData.theme}`)
  if (formData.designStyle) brief.push(`**Стиль:** ${formData.designStyle}`)
  if (formData.structure) brief.push(`\n**Структура:**\n${formData.structure}`)

  // Visual style tags
  if (formData.layoutStyle?.length) {
    brief.push(`\n**Стиль лейауту:** ${formData.layoutStyle.join(', ')}`)
  }
  if (formData.photoStyle?.length) {
    brief.push(`**Стиль фото:** ${formData.photoStyle.join(', ')}`)
  }
  if (formData.animationLevel) {
    const animLabels: Record<string, string> = {
      minimal: 'Мінімальні — subtle transitions, без складних ефектів',
      medium: 'Помірні — scroll reveals, stagger delays, clip-path',
      wow: 'WOW-ефекти — parallax, horizontal scroll, split-text, 3D transforms, scale-on-scroll',
    }
    brief.push(`**Рівень анімацій:** ${animLabels[formData.animationLevel] || formData.animationLevel}`)
  }

  if (formData.primaryColor || formData.secondaryColor || formData.bgColor || formData.textColor) {
    brief.push(`\n**Кольори (базові, агент автоматично підлаштовує контрастність на темних/світлих секціях):**`)
    brief.push(`- Акцентний: ${formData.primaryColor || 'на розсуд'}`)
    brief.push(`- Додатковий: ${formData.secondaryColor || 'на розсуд'}`)
    brief.push(`- Фон: ${formData.bgColor || '#ffffff'}`)
    brief.push(`- Текст: ${formData.textColor || '#1a1a1a'}`)
  }
  if (formData.phone || formData.email || formData.address) {
    brief.push(`\n**Контакти:** тел ${formData.phone || '—'}, email ${formData.email || '—'}, адреса ${formData.address || '—'}`)
  }
  if (formData.socials) brief.push(`**Соцмережі:** ${formData.socials}`)
  if (formData.extraWishes) brief.push(`\n**Побажання:**\n${formData.extraWishes}`)
  if (formData.freeDescription) brief.push(`\n**Вільний опис від клієнта:**\n${formData.freeDescription}`)

  if (formData.referenceImages?.length) {
    brief.push(`\n**Скріншоти референсів (дизайн-приклади):**`)
    brief.push(`⚠️ Кожен скріншот має пояснення ЩО САМЕ з нього взяти. Дотримуйся цих вказівок при дизайні відповідних секцій.`)
    for (const img of formData.referenceImages) {
      brief.push(`- ${img.name}: ${img.url}`)
      if (img.note) brief.push(`  → Що взяти: ${img.note}`)
    }
  }

  if (formData.clientMaterials?.length) {
    brief.push(`\n**Матеріали клієнта (ОБОВ'ЯЗКОВО використати на сайті замість стокових фото):**`)
    for (const mat of formData.clientMaterials) {
      brief.push(`- ${mat.name}: ${mat.url}`)
    }
    brief.push(`⚠️ Ці зображення — реальні матеріали клієнта (логотип, фото команди, продукції тощо). Використовуй їх в <img src="URL"> замість стокових фото де це доречно.`)
  }

  brief.push(`\n# ДІЙ — створи src/App.jsx з повним сайтом`)

  return systemContext + brief.join('\n')
}
