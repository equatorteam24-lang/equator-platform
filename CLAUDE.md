# Equator Platform — CLAUDE.md

## Що це

Multi-tenant SaaS платформа для створення сайтів клієнтів.
Одна платформа, багато сайтів. Кожен сайт — це "тенант" (org).

## Структура монорепо

```
equator-platform/
├── apps/
│   ├── super-admin/        # admin.equator.agency — тільки для нас
│   └── site-template/      # Шаблон клієнтського сайту (копіюється per-client)
├── packages/
│   ├── db/                 # Supabase типи, client, server клієнти
│   ├── ui/                 # Shared UI компоненти (Hero, Navbar, Forms тощо)
│   └── config/             # Shared TS/Tailwind/ESLint конфіги
└── supabase/
    └── migrations/         # SQL міграції (застосовувати в Supabase Dashboard)
```

## Стек

- **Next.js 16** (App Router) — і super-admin, і site-template
- **Tailwind CSS v4** — стилізація
- **Supabase** — PostgreSQL + Auth + RLS + Storage
- **pnpm workspaces + Turborepo** — монорепо
- **Vercel** — деплой

## База даних (Supabase)

Таблиці:
- `organizations` — клієнтські сайти (тенанти)
- `profiles` — юзери (прив'язані до org через org_id; superadmin має org_id = null)
- `pages` — CMS, контент сторінок
- `leads` — CRM, заявки з форм
- `analytics_events` — трекінг подій
- `audit_logs` — лог дій
- `subscriptions` — підписки клієнтів (monthly/annual)
- `payment_history` — історія платежів WayForPay
- `site_content` — контент сайту (редагується через /admin/content)

Ролі: `superadmin` | `admin` | `editor`

RLS: кожен клієнт бачить тільки свої дані. Superadmin бачить все.
Публічний anon ключ: може тільки INSERT в leads та analytics_events.

## Env змінні

Дивись `.env.example`. Потрібні для кожного app:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (тільки server-side)
- `NEXT_PUBLIC_ORG_ID` — унікальний UUID організації клієнта
- `NEXT_PUBLIC_APP_URL` — публічний URL сайту
- `WAYFORPAY_MERCHANT_ACCOUNT`, `WAYFORPAY_MERCHANT_SECRET`, `WAYFORPAY_MERCHANT_DOMAIN`
- `CRON_SECRET` — для захисту Vercel Cron (billing/cron)
- `TELEGRAM_BOT_TOKEN` — токен бота @LeadFromWebsiteBot

## Команди

```bash
pnpm dev:super-admin     # запустити super-admin локально
pnpm dev:site-template   # запустити site-template локально
pnpm build               # збілдити все
```

## Модулі client admin (в site-template)

- `/admin` — дашборд
- `/admin/leads` — CRM (заявки)
- `/admin/analytics` — аналітика (перегляди, конверсія, UTM, браузери, час)
- `/admin/content` — редактор контенту сайту (всі секції)
- `/admin/pages` — список сторінок (read-only, без створення)
- `/admin/seo` — SEO налаштування (включно з головною)
- `/admin/billing` — підписка та платежі
- `/admin/settings` — налаштування (Telegram, GA, FB Pixel, скрипти)

---

## ═══ ІНСТРУКЦІЯ: СТВОРЕННЯ НОВОГО КЛІЄНТСЬКОГО САЙТУ ═══

Коли отримую: назву компанії + Figma URL (+ опційно домен, email) —
**роблю ВСЕ сам через API без участі користувача.**

### Крок 1 — Створити org у Supabase

```bash
# POST /rest/v1/organizations
curl -X POST "https://dlsauceqpbkweuzxuvfc.supabase.co/rest/v1/organizations" \
  -H "apikey: SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "name": "Назва компанії",
    "slug": "company-slug",
    "domain": "company.com",
    "status": "active"
  }'
```
→ Зберегти `id` (org_id)

### Крок 2 — Створити адмін-юзера

```bash
# POST /auth/v1/admin/users
curl -X POST "https://dlsauceqpbkweuzxuvfc.supabase.co/auth/v1/admin/users" \
  -H "apikey: SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "згенерований-пароль",
    "email_confirm": true
  }'
```
→ Зберегти `id` (user_id)

### Крок 3 — Прив'язати профіль до org

```bash
# PATCH /rest/v1/profiles?id=eq.{user_id}
curl -X PATCH "https://dlsauceqpbkweuzxuvfc.supabase.co/rest/v1/profiles?id=eq.USER_ID" \
  -H "apikey: SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"org_id": "ORG_ID", "role": "admin", "full_name": "Admin"}'
```

### Крок 4 — Прочитати Figma макет

```
mcp__plugin_figma_figma__get_design_context(fileKey, nodeId)
mcp__plugin_figma_figma__get_screenshot(fileKey, nodeId)
```

Аналізую:
- Кольорова схема (primary, secondary, accent)
- Шрифти (heading, body)
- Секції сторінки (hero, services, about, process, gallery, contacts тощо)
- Логотип та зображення

### Крок 5 — Зверстати сайт

**Редагую `apps/site-template/src/`:**

1. **`app/globals.css`** — оновити CSS змінні: `--color-primary`, шрифти
2. **`app/layout.tsx`** — оновити шрифти (next/font), metadata title/description
3. **`lib/content.ts`** — оновити `DEFAULT_CONTENT` з реальними текстами клієнта
4. **`app/page.tsx`** — верстка головної сторінки за Figma макетом
5. **Компоненти** — Navbar, CTAButton, форми — адаптувати під дизайн

**Завантаження зображень:**
- Завантажити зображення в Supabase Storage: `media/{slug}/assets/`
- Використовувати постійні Supabase URLs (не temp Figma URLs)

**Форми:**
- Всі CTA кнопки → відкривають модальну форму → POST `/api/leads`
- Передавати `source_page`, `utm_*` параметри

### Крок 6 — Створити Vercel проект

```bash
# Створити проект
curl -X POST "https://api.vercel.com/v10/projects" \
  -H "Authorization: Bearer VERCEL_TOKEN" \
  -d '{
    "name": "client-slug",
    "framework": "nextjs",
    "gitRepository": {
      "type": "github",
      "repo": "equatorteam24-lang/equator-platform"
    },
    "rootDirectory": "apps/site-template"
  }'
```

### Крок 7 — Встановити env vars у Vercel

Через Vercel API (`POST /v10/projects/{id}/env`) встановити:

| Змінна | Значення |
|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://dlsauceqpbkweuzxuvfc.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key з пам'яті |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key з пам'яті |
| `NEXT_PUBLIC_ORG_ID` | org_id зі Кроку 1 |
| `NEXT_PUBLIC_APP_URL` | `https://client-domain.com` |
| `WAYFORPAY_MERCHANT_ACCOUNT` | з налаштувань WayForPay |
| `WAYFORPAY_MERCHANT_SECRET` | з налаштувань WayForPay |
| `WAYFORPAY_MERCHANT_DOMAIN` | `www.client-domain.com` |
| `CRON_SECRET` | згенерувати: `openssl rand -hex 32` |
| `TELEGRAM_BOT_TOKEN` | `8605013350:AAGEX6zW-rIrL0puWO1NQLqH7K0u1Ss57HA` |

### Крок 8 — Задеплоїти

```bash
git add . && git commit -m "feat: [Client Name] — initial site"
git push origin main

# Trigger deployment via Vercel API
curl -X POST "https://api.vercel.com/v13/deployments?projectId=PROJECT_ID" \
  -H "Authorization: Bearer VERCEL_TOKEN" \
  -d '{"name":"client-slug","gitSource":{"type":"github","repoId":"1203879591","ref":"main"}}'
```

Слідкувати за статусом до `READY`.

### Крок 9 — Підключити домен

```bash
curl -X POST "https://api.vercel.com/v10/projects/{id}/domains" \
  -H "Authorization: Bearer VERCEL_TOKEN" \
  -d '{"name": "client-domain.com"}'
```

Клієнт прописує CNAME/A-record до Vercel.

### Крок 10 — Зареєструвати Telegram webhook

```bash
curl "https://api.telegram.org/bot{TOKEN}/setWebhook?url=https://client-domain.com/api/telegram/webhook"
```

### Крок 11 — Фінальна перевірка

- [ ] Сайт відкривається на домені
- [ ] Форма відправляє заявку → з'являється в `/admin/leads`
- [ ] Авторизація в `/admin/login` з email/паролем
- [ ] SEO заголовки підтягуються (перевірити через DevTools)
- [ ] Мобільна версія відповідає макету

### Крок 12 — Передати клієнту

Повідомити користувача:
```
✅ Сайт: https://client-domain.com
🔐 Адмінка: https://client-domain.com/admin
📧 Email: admin@company.com
🔑 Пароль: згенерований-пароль
🆔 Org ID: ORG_ID
```

---

## Безпека

- RLS на всіх таблицях (увімкнено в міграції 002)
- Service role key — тільки в server actions, НІКОЛИ в браузері
- Middleware (proxy.ts) перевіряє auth на всіх dashboard роутах
- Superadmin перевірка в dashboard layout (роль з profiles)
- Rate limiting на форми (5 запитів/год на IP)
- Підписка блокує сайт якщо expired/cancelled (крім /admin)

## Важливі особливості

- **Next.js 16** — middleware називається `proxy.ts` (не middleware.ts)
- **`NEXT_PUBLIC_ORG_ID`** — build-time змінна, потрібен новий білд після зміни
- **WayForPay** — `returnUrl` повинен бути через `/api/billing/return` (303 redirect) бо WayForPay шле POST
- **Домен WayForPay** — обов'язково `www.` перед доменом
- **Recurring payments** — потребує окремого дозволу від WayForPay підтримки
