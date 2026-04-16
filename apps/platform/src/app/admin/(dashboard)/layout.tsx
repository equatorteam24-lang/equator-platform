import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ORG_ID } from '@/lib/org'
import AdminSidebar from '@/components/admin/Sidebar'

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  // Verify user belongs to this org
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, org_id')
    .eq('id', user.id)
    .single()

  const isSuperadmin = profile?.role === 'superadmin'
  const isOrgMember  = profile?.org_id === ORG_ID

  if (!isSuperadmin && !isOrgMember) {
    await supabase.auth.signOut()
    redirect('/admin/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {children}
      </main>
    </div>
  )
}
