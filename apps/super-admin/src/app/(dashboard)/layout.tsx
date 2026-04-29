import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { canAccessDashboard } from '@/lib/roles'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Verify superadmin or team role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null }

  if (!canAccessDashboard(profile?.role)) {
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={profile!.role} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
