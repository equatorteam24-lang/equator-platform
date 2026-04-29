import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'Uniframe Super Admin',
  description: 'Platform management dashboard',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className="h-full antialiased">
      <body className={`${inter.className} min-h-full flex flex-col bg-gray-50 text-gray-900`}>
        {children}
      </body>
    </html>
  )
}
