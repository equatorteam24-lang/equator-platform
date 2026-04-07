import { createClient } from '@/lib/supabase'
import { ORG_ID } from '@/lib/org'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const now = new Date()
  const day30ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalVisits },
    { count: uniqueSessions },
    { data: topPages },
    { data: byDevice },
    { data: byDay },
  ] = await Promise.all([
    supabase.from('analytics_events').select('*', { count: 'exact', head: true })
      .eq('org_id', ORG_ID).eq('event', 'pageview').gte('created_at', day30ago),

    supabase.rpc('count_unique_sessions', { p_org_id: ORG_ID, p_from: day30ago })
      .select('*', { count: 'exact', head: true }),

    supabase.from('analytics_events').select('page')
      .eq('org_id', ORG_ID).eq('event', 'pageview').gte('created_at', day30ago),

    supabase.from('analytics_events').select('device')
      .eq('org_id', ORG_ID).eq('event', 'pageview').gte('created_at', day30ago).not('device', 'is', null),

    supabase.from('analytics_events').select('created_at')
      .eq('org_id', ORG_ID).eq('event', 'pageview').gte('created_at', day30ago),
  ])

  // Aggregate top pages
  const pageCount: Record<string, number> = {}
  topPages?.forEach(e => { pageCount[e.page] = (pageCount[e.page] ?? 0) + 1 })
  const sortedPages = Object.entries(pageCount).sort((a, b) => b[1] - a[1]).slice(0, 10)

  // Aggregate by device
  const deviceCount: Record<string, number> = {}
  byDevice?.forEach(e => { if (e.device) deviceCount[e.device] = (deviceCount[e.device] ?? 0) + 1 })

  // Aggregate visits by day (last 14 days)
  const dayCount: Record<string, number> = {}
  byDay?.forEach(e => {
    const d = new Date(e.created_at).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' })
    dayCount[d] = (dayCount[d] ?? 0) + 1
  })
  const days = Object.entries(dayCount).slice(-14)
  const maxDay = Math.max(...days.map(d => d[1]), 1)

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Аналітика</h1>
      <p className="text-sm text-gray-400 -mt-4">Останні 30 днів</p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Переглядів сторінок" value={String(totalVisits ?? 0)} />
        <StatCard label="Унікальних сесій" value={String(uniqueSessions ?? '—')} />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Відвідуваність по днях</h2>
        {days.length > 0 ? (
          <div className="flex items-end gap-1 h-32">
            {days.map(([date, count]) => (
              <div key={date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-blue-500 rounded-t opacity-80 transition-all"
                  style={{ height: `${(count / maxDay) * 100}%`, minHeight: 2 }} />
                <span className="text-[10px] text-gray-400 rotate-45 origin-left">{date}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">Даних поки немає</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Top pages */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Топ сторінки</h2>
          <div className="space-y-2">
            {sortedPages.length > 0 ? sortedPages.map(([page, count]) => (
              <div key={page} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 truncate max-w-[180px]">{page}</span>
                <span className="text-gray-400 font-medium">{count}</span>
              </div>
            )) : <p className="text-sm text-gray-400">Немає даних</p>}
          </div>
        </div>

        {/* By device */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Пристрої</h2>
          <div className="space-y-2">
            {Object.entries(deviceCount).length > 0
              ? Object.entries(deviceCount).map(([device, count]) => {
                  const total = Object.values(deviceCount).reduce((a, b) => a + b, 0)
                  return (
                    <div key={device}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 capitalize">{device}</span>
                        <span className="text-gray-400">{Math.round(count / total * 100)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${count / total * 100}%` }} />
                      </div>
                    </div>
                  )
                })
              : <p className="text-sm text-gray-400">Немає даних</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
