'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const nav = [
  { href: '/organizations', label: 'Сайти клієнтів', icon: '🌐' },
  { href: '/sites',         label: 'Конструктор',     icon: '🏗' },
  { href: '/brief',         label: 'Бриф → Промпт',   icon: '📋' },
  { href: '/payments',      label: 'Оплати',          icon: '💳' },
  { href: '/settings',      label: 'Налаштування',     icon: '⚙️' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`flex-shrink-0 border-r border-gray-200 bg-white flex flex-col transition-all duration-200 ${collapsed ? 'w-14' : 'w-56'}`}>
      <div className={`flex items-center border-b border-gray-200 ${collapsed ? 'justify-center py-4' : 'justify-between px-5 py-5'}`}>
        {!collapsed && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Uniframe</p>
            <p className="text-sm font-bold text-gray-900">Super Admin</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-gray-600 transition"
          title={collapsed ? 'Розгорнути' : 'Згорнути'}
        >
          <svg className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
      </div>

      <nav className={`flex-1 py-4 space-y-0.5 ${collapsed ? 'px-1.5' : 'px-3'}`}>
        {nav.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center rounded-lg text-sm font-medium transition-colors ${
                collapsed ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-3 py-2'
              } ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className={collapsed ? 'text-base' : ''}>{item.icon}</span>
              {!collapsed && item.label}
            </Link>
          )
        })}
      </nav>

      <div className={`py-4 border-t border-gray-200 ${collapsed ? 'px-1.5' : 'px-3'}`}>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            title={collapsed ? 'Вийти' : undefined}
            className={`w-full rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors ${
              collapsed ? 'py-2.5 text-center' : 'px-3 py-2 text-left'
            }`}
          >
            {collapsed ? '🚪' : 'Вийти'}
          </button>
        </form>
      </div>
    </aside>
  )
}
