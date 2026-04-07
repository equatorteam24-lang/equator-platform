import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AnalyticsProvider } from '@/components/AnalyticsProvider'
import ThirdPartyScripts from '@/components/ThirdPartyScripts'
import { createClient } from '@/lib/supabase'
import { ORG_ID } from '@/lib/org'
import type { OrganizationSettings } from '@equator/db/types'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: { template: '%s | Site', default: 'Site' },
  description: '',
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
    <html lang="uk" className="scroll-smooth">
      <body className={`${inter.className} antialiased`}>
        <AnalyticsProvider>
          {children}
        </AnalyticsProvider>
        <ThirdPartyScripts settings={settings} />
      </body>
    </html>
  )
}
