import type { Metadata } from 'next'
import { Onest, Montserrat } from 'next/font/google'
import { AnalyticsProvider } from '@/components/AnalyticsProvider'
import ThirdPartyScripts from '@/components/ThirdPartyScripts'
import ModalProvider from '@/components/ModalProvider'
import { createClient } from '@/lib/supabase'
import { ORG_ID } from '@/lib/org'
import type { OrganizationSettings } from '@equator/db/types'
import './globals.css'

const onest = Onest({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-onest',
  display: 'swap',
})

const montserrat = Montserrat({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-montserrat',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { template: '%s | Roofing Work', default: 'Roofing Work — Професійні покрівельні роботи' },
  description: 'Фальцева покрівля, металочерепиця, профнастил — монтаж під ключ в Івано-Франківській та Львівській областях.',
  robots: { index: true, follow: true },
  openGraph: { type: 'website' },
}

async function getOrgSettings(): Promise<OrganizationSettings> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', ORG_ID)
      .single()
    return (data?.settings as OrganizationSettings) ?? {}
  } catch {
    return {}
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getOrgSettings()

  return (
    <html lang="uk" className={`scroll-smooth ${onest.variable} ${montserrat.variable}`}>
      <body className="font-body antialiased">
        <AnalyticsProvider>
          <ModalProvider>
            {children}
          </ModalProvider>
        </AnalyticsProvider>
        <ThirdPartyScripts settings={settings} />
      </body>
    </html>
  )
}
