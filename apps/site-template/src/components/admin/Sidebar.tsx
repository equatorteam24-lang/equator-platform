'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/admin',           label: 'Дашборд',      icon: '◻', exact: true },
  { href: '/admin/leads',     label: 'Заявки (CRM)', icon: '✉' },
  { href: '/admin/analytics', label: 'Аналітика',    icon: '📈' },
  { href: '/admin/pages',     label: 'Сторінки',     icon: '📄' },
  { href: '/admin/seo',       label: 'SEO',          icon: '🔍' },
  { href: '/admin/settings',  label: 'Налаштування', icon: '⚙' },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
      <div className="px-5 py-5 border-b border-gray-200">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Панель керування</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(item => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}>
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-200 space-y-1">
        <a href="/" target="_blank"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 transition-colors">
          <span>↗</span> Переглянути сайт
        </a>
        <form action="/api/auth/logout" method="POST">
          <button type="submit"
            className="w-full text-left flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 transition-colors">
            <span>→</span> Вийти
          </button>
        </form>
      </div>
    </aside>
  )
}
