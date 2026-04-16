import { createClient } from '@/lib/supabase'
import { ORG_ID } from '@/lib/org'
import SettingsForm from './SettingsForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', ORG_ID)
    .single()

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Налаштування</h1>
      {org ? <SettingsForm org={org} /> : <p className="text-gray-400">Організацію не знайдено</p>}
    </div>
  )
}
