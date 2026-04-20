'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/organizations', label: 'Сайти клієнтів', icon: '🌐' },
  { href: '/sites',         label: 'Конструктор',     icon: '🏗' },
  { href: '/payments',      label: 'Оплати',          icon: '💳' },
  { href: '/settings',      label: 'Налаштування',     icon: '⚙️' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
      <div className="px-5 py-5 border-b border-gray-200">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Equator</p>
        <p className="text-sm font-bold text-gray-900">Super Admin</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-200">
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors text-left"
          >
            Вийти
          </button>
        </form>
      </div>
    </aside>
  )
}
