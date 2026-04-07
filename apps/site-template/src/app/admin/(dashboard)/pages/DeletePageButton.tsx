'use client'

import { createClient } from '@/lib/client'
import { useRouter } from 'next/navigation'

export default function DeletePageButton({ pageId }: { pageId: string }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('Видалити цю сторінку?')) return
    const supabase = createClient()
    await supabase.from('pages').delete().eq('id', pageId)
    router.refresh()
  }

  return (
    <button onClick={handleDelete} className="text-red-400 hover:text-red-600 font-medium">
      Видалити
    </button>
  )
}
