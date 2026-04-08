import { createClient } from '@/lib/supabase'
import { requireOrgId } from '@/lib/org'

// ─── helpers ─────────────────────────────────────────────────────────────────

function pct(a: number, b: number) {
  if (!b) return '0%'
  return `${((a / b) * 100).toFixed(1)}%`
}

function referrerSource(referrer: string | null): string {
  if (!referrer) return 'Прямий'
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '')
    if (host.includes('google'))   return 'Google'
    if (host.includes('facebook') || host.includes('fb.com')) return 'Facebook'
    if (host.includes('instagram')) return 'Instagram'
    if (host.includes('t.co') || host.includes('twitter')) return 'Twitter/X'
    if (host.includes('telegram')) return 'Telegram'
    return host
  } catch {
    return 'Інше'
  }
}

const DAYS_30 = 30

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const orgId = requireOrgId()

  const since = new Date(Date.now() - DAYS_30 * 24 * 60 * 60 * 1000).toISOString()

  // Fetch events + leads in parallel
  const [{ data: events }, { data: leads }] = await Promise.all([
    supabase
      .from('analytics_events')
      .select('session_id, visitor_id, event, page, referrer, device, browser, utm_source, utm_medium, utm_campaign, duration, created_at')
      .eq('org_id', orgId)
      .gte('created_at', since)
      .order('created_at', { ascending: true }),
    supabase
      .from('leads')
      .select('id, source_page, utm_source, created_at')
      .eq('org_id', orgId)
      .gte('created_at', since),
  ])

  const pageviews = (events ?? []).filter(e => e.event === 'pageview')
  const sessions  = new Set(pageviews.map(e => e.session_id))
  const visitors  = new Set(pageviews.map(e => e.visitor_id).filter(Boolean))

  // ── Visits by day ──────────────────────────────────────────────────────────
  const dayMap: Record<string, number> = {}
  for (let i = 0; i < DAYS_30; i++) {
    const d = new Date(Date.now() - (DAYS_30 - 1 - i) * 86400000)
    dayMap[d.toISOString().slice(0, 10)] = 0
  }
  for (const e of pageviews) {
    const day = e.created_at.slice(0, 10)
    if (day in dayMap) dayMap[day]++
  }
  const days = Object.entries(dayMap)
  const maxDay = Math.max(...days.map(([, v]) => v), 1)

  // ── Conversion rate ────────────────────────────────────────────────────────
  const leadsCount = leads?.length ?? 0
  const sessionCount = sessions.size

  // ── Top pages ──────────────────────────────────────────────────────────────
  const pageCount: Record<string, number> = {}
  for (const e of pageviews) {
    pageCount[e.page] = (pageCount[e.page] ?? 0) + 1
  }
  const topPages = Object.entries(pageCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  // ── Device breakdown ──────────────────────────────────────────────────────
  const deviceCount: Record<string, number> = {}
  for (const e of pageviews) {
    const d = e.device ?? 'unknown'
    deviceCount[d] = (deviceCount[d] ?? 0) + 1
  }

  // ── Browser breakdown ─────────────────────────────────────────────────────
  const browserCount: Record<string, number> = {}
  for (const e of pageviews) {
    const b = e.browser ?? 'Other'
    browserCount[b] = (browserCount[b] ?? 0) + 1
  }
  const totalBrowser = Object.values(browserCount).reduce((a, b) => a + b, 0) || 1

  // ── Traffic sources ───────────────────────────────────────────────────────
  const sourceCount: Record<string, number> = {}
  for (const e of pageviews) {
    const src = e.utm_source
      ? e.utm_source
      : referrerSource(e.referrer)
    sourceCount[src] = (sourceCount[src] ?? 0) + 1
  }
  const totalSources = Object.values(sourceCount).reduce((a, b) => a + b, 0) || 1
  const topSources = Object.entries(sourceCount).sort((a, b) => b[1] - a[1]).slice(0, 8)

  // ── New vs returning ──────────────────────────────────────────────────────
  // Unique visitor_ids seen before the current 30-day window
  const { data: oldVisitors } = await supabase
    .from('analytics_events')
    .select('visitor_id')
    .eq('org_id', orgId)
    .lt('created_at', since)
    .not('visitor_id', 'is', null)

  const returningSet = new Set((oldVisitors ?? []).map(r => r.visitor_id))
  let newVisitors = 0
  let returningVisitors = 0
  for (const vid of visitors) {
    if (returningSet.has(vid)) returningVisitors++
    else newVisitors++
  }
  const totalVisitorCount = visitors.size || 1

  // ── Avg time on site ──────────────────────────────────────────────────────
  const durEvents = (events ?? []).filter(e => e.event === 'page_leave' && e.duration != null && e.duration > 0 && e.duration < 3600)
  const avgDuration = durEvents.length
    ? Math.round(durEvents.reduce((s, e) => s + e.duration, 0) / durEvents.length)
    : null

  // ── Popular time of day (UTC+2 Kyiv) ─────────────────────────────────────
  const hourMap: number[] = Array(24).fill(0)
  for (const e of pageviews) {
    const hour = (new Date(e.created_at).getUTCHours() + 2) % 24
    hourMap[hour]++
  }
  const maxHour = Math.max(...hourMap, 1)

  // ── Conversion by page ────────────────────────────────────────────────────
  const convPageMap: Record<string, number> = {}
  for (const l of (leads ?? [])) {
    const p = l.source_page ?? 'невідомо'
    convPageMap[p] = (convPageMap[p] ?? 0) + 1
  }
  const convByPage = Object.entries(convPageMap).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <div className="p-8 max-w-5xl space-y-8">
      <h1 className="text-xl font-bold text-gray-900">Аналітика</h1>

      {/* ── KPI row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="Перегляди" value={pageviews.length.toLocaleString('uk-UA')} sub="за 30 днів" />
        <KpiCard label="Сесії" value={sessionCount.toLocaleString('uk-UA')} sub="унікальних" />
        <KpiCard
          label="Конверсія"
          value={pct(leadsCount, sessionCount)}
          sub={`${leadsCount} заявок / ${sessionCount} сесій`}
        />
        <KpiCard
          label="Середній час"
          value={avgDuration != null ? formatDuration(avgDuration) : '—'}
          sub="на сторінці"
        />
      </div>

      {/* ── Visits by day ───────────────────────────────────────────────── */}
      <Section title="Відвідування за 30 днів">
        <div className="flex items-end gap-[2px] h-24">
          {days.map(([d, v]) => (
            <div key={d} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div
                className="w-full bg-blue-500 rounded-sm min-h-[2px] transition-all"
                style={{ height: `${(v / maxDay) * 80}px` }}
              />
              <span className="sr-only">{d}: {v}</span>
              <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none z-10">
                {new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}: {v}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-400">
          <span>{new Date(days[0][0]).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}</span>
          <span>{new Date(days[days.length - 1][0]).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}</span>
        </div>
      </Section>

      {/* ── New vs returning + Traffic sources ──────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        <Section title="Нові vs повторні відвідувачі">
          <div className="space-y-3">
            <BarRow label="Нові" value={newVisitors} total={totalVisitorCount} color="bg-blue-500" />
            <BarRow label="Повторні" value={returningVisitors} total={totalVisitorCount} color="bg-violet-500" />
          </div>
          <p className="text-xs text-gray-400 mt-3">{visitors.size} унікальних відвідувачів</p>
        </Section>

        <Section title="Джерела трафіку">
          {topSources.length ? (
            <div className="space-y-2">
              {topSources.map(([src, cnt]) => (
                <BarRow key={src} label={src} value={cnt} total={totalSources} color="bg-emerald-500" />
              ))}
            </div>
          ) : <EmptyState />}
        </Section>
      </div>

      {/* ── Popular time of day ─────────────────────────────────────────── */}
      <Section title="Популярний час (Київ)">
        <div className="flex items-end gap-[3px] h-16">
          {hourMap.map((v, h) => (
            <div key={h} className="flex-1 flex flex-col items-center group relative">
              <div
                className="w-full bg-orange-400 rounded-sm min-h-[2px]"
                style={{ height: `${(v / maxHour) * 52}px` }}
              />
              <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 pointer-events-none z-10">
                {h}:00 — {v}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-400">
          {[0, 6, 12, 18, 23].map(h => (
            <span key={h}>{h}:00</span>
          ))}
        </div>
      </Section>

      {/* ── Device + Browser ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Section title="Пристрої">
          <div className="space-y-2">
            {Object.entries(deviceCount).sort((a, b) => b[1] - a[1]).map(([d, v]) => (
              <BarRow key={d} label={deviceLabel(d)} value={v} total={pageviews.length || 1} color="bg-sky-500" />
            ))}
          </div>
        </Section>

        <Section title="Браузери">
          {Object.keys(browserCount).length ? (
            <div className="space-y-2">
              {Object.entries(browserCount).sort((a, b) => b[1] - a[1]).map(([b, v]) => (
                <BarRow key={b} label={b} value={v} total={totalBrowser} color="bg-indigo-500" />
              ))}
            </div>
          ) : <EmptyState />}
        </Section>
      </div>

      {/* ── Top pages + Conversion by page ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Section title="Топ сторінок">
          {topPages.length ? (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-50">
                {topPages.map(([p, v]) => (
                  <tr key={p}>
                    <td className="py-2 text-gray-700 truncate max-w-[180px]">{p || '/'}</td>
                    <td className="py-2 text-right font-medium text-gray-900">{v}</td>
                    <td className="py-2 pl-3 text-right text-gray-400 text-xs">{pct(v, pageviews.length)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <EmptyState />}
        </Section>

        <Section title="Конверсія по сторінках">
          {convByPage.length ? (
            <div className="space-y-2">
              {convByPage.map(([p, v]) => (
                <BarRow key={p} label={p || '/'} value={v} total={leadsCount || 1} color="bg-rose-500" />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Немає заявок за цей період</p>
          )}
        </Section>
      </div>
    </div>
  )
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDuration(s: number) {
  if (s < 60) return `${s}с`
  return `${Math.floor(s / 60)}хв ${s % 60}с`
}

function deviceLabel(d: string) {
  const m: Record<string, string> = { mobile: 'Мобільний', tablet: 'Планшет', desktop: 'Десктоп' }
  return m[d] ?? d
}

// ─── UI components ────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  )
}

function BarRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const width = Math.round((value / total) * 100)
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 w-24 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${width}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-700 w-10 text-right">{pct(value, total)}</span>
    </div>
  )
}

function EmptyState() {
  return <p className="text-sm text-gray-400">Немає даних за цей період</p>
}
