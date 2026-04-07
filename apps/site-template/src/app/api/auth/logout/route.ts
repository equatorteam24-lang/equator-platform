import { createClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
