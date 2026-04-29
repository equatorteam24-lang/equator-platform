import type { Metadata } from 'next'
import { Onest, Montserrat } from 'next/font/google'
import { headers } from 'next/headers'
import { AnalyticsProvider } from '@/components/AnalyticsProvider'
import ThirdPartyScripts from '@/components/ThirdPartyScripts'
import ModalProvider from '@/components/ModalProvider'
import { createClient } from '@/lib/supabase'
import { createServiceClient } from '@/lib/service'
import { getCurrentOrgId } from '@/lib/org'
import type { OrganizationSettings } from '@uniframe/db/types'
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

async function getOrgSettings(orgId: string): Promise<OrganizationSettings> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', orgId)
      .single()
    return (data?.settings as OrganizationSettings) ?? {}
  } catch {
    return {}
  }
}

async function getSubscriptionStatus(orgId: string): Promise<'active' | 'trial' | 'expired' | 'cancelled'> {
  try {
    const db = createServiceClient()
    const { data } = await db
      .from('subscriptions')
      .select('status, trial_ends_at')
      .eq('org_id', orgId)
      .single()
    if (!data) return 'active' // no subscription record = allow access
    if (data.status === 'trial' && data.trial_ends_at) {
      return new Date(data.trial_ends_at) > new Date() ? 'trial' : 'expired'
    }
    return data.status as 'active' | 'trial' | 'expired' | 'cancelled'
  } catch {
    return 'active' // on error, allow access
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api')

  // Resolve org from Host. If host is unknown (e.g., a preview URL without a
  // client domain yet), fall back to a minimal shell without org-scoped data.
  let orgId: string | null = null
  try {
    orgId = await getCurrentOrgId()
  } catch {
    orgId = null
  }

  const [settings, subStatus] = await Promise.all([
    orgId ? getOrgSettings(orgId) : Promise.resolve({} as OrganizationSettings),
    orgId && !isAdminRoute ? getSubscriptionStatus(orgId) : Promise.resolve('active' as const),
  ])

  const isBlocked = !isAdminRoute && (subStatus === 'expired' || subStatus === 'cancelled')

  return (
    <html lang="uk" className={`scroll-smooth ${onest.variable} ${montserrat.variable}`}>
      <body className="font-body antialiased">
        <AnalyticsProvider>
          <ModalProvider>
            {isBlocked ? <SubscriptionExpired /> : children}
          </ModalProvider>
        </AnalyticsProvider>
        <ThirdPartyScripts settings={settings} />
      </body>
    </html>
  )
}

function SubscriptionExpired() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Сайт тимчасово недоступний</h1>
        <p className="text-gray-500 mb-6">
          Термін дії підписки закінчився. Будь ласка, зверніться до адміністратора для поновлення.
        </p>
        <a
          href="/admin/billing"
          className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
        >
          Поновити підписку
        </a>
      </div>
    </div>
  )
}
