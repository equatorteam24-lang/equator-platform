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

Ролі: `superadmin` | `admin` | `editor`

RLS: кожен клієнт бачить тільки свої дані. Superadmin бачить все.
Публічний anon ключ: може тільки INSERT в leads та analytics_events.

## Env змінні

Дивись `.env.example`. Потрібні для кожного app:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (тільки server-side)

## Команди

```bash
pnpm dev:super-admin     # запустити super-admin локально
pnpm dev:site-template   # запустити site-template локально
pnpm build               # збілдити все
```

## Як додати новий клієнтський сайт

1. В Super Admin → "Новий сайт" → створюється org в БД
2. Скопіювати `apps/site-template` → `apps/client-{slug}`
3. Встановити `ORG_ID` та env змінні
4. Зверстати сайт з Figma макету → деплой на Vercel

## Безпека

- RLS на всіх таблицях (увімкнено в міграції 002)
- Service role key — тільки в server actions, НІКОЛИ в браузері
- Middleware перевіряє auth на всіх dashboard роутах
- Superadmin перевірка в dashboard layout (роль з profiles)
- Audit log для всіх критичних дій
- Rate limiting на форми (реалізувати в site-template)
- CSP headers (налаштувати в next.config.ts)

## Figma → Code workflow

1. Отримую Figma URL
2. Читаю макет через Figma MCP (get_design_context)
3. Верстаю з компонентів `packages/ui`
4. Підключаю форми → leads таблиця (через anon key)
5. Налаштовую SEO поля для кожної сторінки
6. Деплой → Vercel

## Модулі client admin (в site-template)

- `/admin` — дашборд
- `/admin/leads` — CRM (заявки)
- `/admin/analytics` — аналітика
- `/admin/pages` — CMS редактор
- `/admin/seo` — SEO налаштування
- `/admin/settings` — налаштування сайту
