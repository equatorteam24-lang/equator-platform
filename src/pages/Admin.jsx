import { useState, useEffect } from 'react'
import { getApplications, getStats, updateApplicationStatus, deleteApplication } from '../store.js'
import { getContent, saveContent, resetContent } from '../content.js'

const STATUS_LABELS = {
  new: { label: 'Нова', color: '#FF696F', bg: '#FFF0F1' },
  contacted: { label: 'Contacted', color: '#FF8C42', bg: '#FFF4EC' },
  enrolled: { label: 'Зарахована', color: '#A9D13D', bg: '#F3FBEA' },
}

export default function Admin() {
  const [tab, setTab] = useState('dashboard')
  const [apps, setApps] = useState([])
  const [stats, setStats] = useState({})
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [authed, setAuthed] = useState(false)
  const [pwd, setPwd] = useState('')
  const [pwdError, setPwdError] = useState(false)

  useEffect(() => {
    refresh()
  }, [])

  function refresh() {
    setApps(getApplications())
    setStats(getStats())
  }

  function handleLogin(e) {
    e.preventDefault()
    if (pwd === 'admin123') {
      setAuthed(true)
      setPwdError(false)
    } else {
      setPwdError(true)
    }
  }

  function handleStatusChange(id, status) {
    updateApplicationStatus(id, status)
    refresh()
    if (selected?.id === id) setSelected({ ...selected, status })
  }

  function handleDelete(id) {
    if (confirm('Видалити заявку?')) {
      deleteApplication(id)
      refresh()
      setSelected(null)
    }
  }

  const filteredApps = apps.filter(a => {
    const matchSearch = !search || [a.name, a.phone, a.childName, a.program].some(f => f?.toLowerCase().includes(search.toLowerCase()))
    const matchStatus = statusFilter === 'all' || a.status === statusFilter
    return matchSearch && matchStatus
  })

  if (!authed) return <LoginScreen pwd={pwd} setPwd={setPwd} onLogin={handleLogin} error={pwdError} />

  return (
    <div style={adm.root}>
      {/* Sidebar */}
      <aside style={adm.sidebar}>
        <div style={adm.logo}>
          <span style={{ fontSize: 24 }}>🏫</span>
          <div>
            <div style={adm.logoTitle}>Адмін панель</div>
            <div style={adm.logoSub}>Дочки та Синочки</div>
          </div>
        </div>
        <nav style={adm.nav}>
          {[
            { key: 'dashboard', icon: '📊', label: 'Дашборд' },
            { key: 'applications', icon: '📋', label: 'Заявки', count: stats.new },
            { key: 'analytics', icon: '📈', label: 'Аналітика' },
            { key: 'content', icon: '✏️', label: 'Контент сайту' },
          ].map(item => (
            <button key={item.key} style={{ ...adm.navBtn, ...(tab === item.key ? adm.navBtnActive : {}) }} onClick={() => setTab(item.key)}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span>{item.label}</span>
              {item.count > 0 && <span style={adm.badge}>{item.count}</span>}
            </button>
          ))}
        </nav>
        <div style={adm.sideFooter}>
          <a href="/" style={adm.backLink}>← На сайт</a>
          <button onClick={() => setAuthed(false)} style={adm.logoutBtn}>Вийти</button>
        </div>
      </aside>

      {/* Main */}
      <main style={adm.main}>
        <div style={adm.topBar}>
          <h1 style={adm.pageTitle}>
            {{ dashboard: 'Дашборд', applications: 'Заявки', analytics: 'Аналітика', content: 'Контент сайту' }[tab]}
          </h1>
          <div style={adm.adminInfo}>
            <div style={adm.adminAvatar}>A</div>
            <span style={{ fontSize: 14, color: '#374151' }}>Адміністратор</span>
          </div>
        </div>

        {tab === 'dashboard' && <Dashboard stats={stats} apps={apps} onTabChange={setTab} />}
        {tab === 'applications' && (
          <Applications
            apps={filteredApps}
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            selected={selected}
            setSelected={setSelected}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        )}
        {tab === 'analytics' && <Analytics apps={apps} stats={stats} />}
        {tab === 'content' && <ContentEditor />}
      </main>
    </div>
  )
}

/* ===================== LOGIN ===================== */
function LoginScreen({ pwd, setPwd, onLogin, error }) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #7B6EF6 0%, #9FA7FF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 24, padding: 48, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏫</div>
          <h2 style={{ fontFamily: 'Onest, sans-serif', fontSize: 26, fontWeight: 700 }}>Адмін панель</h2>
          <p style={{ color: '#6B7280', marginTop: 8, fontSize: 14 }}>Дочки та Синочки</p>
        </div>
        <form onSubmit={onLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontWeight: 600, fontSize: 13, color: '#374151', display: 'block', marginBottom: 6 }}>Пароль</label>
            <input
              type="password"
              value={pwd}
              onChange={e => setPwd(e.target.value)}
              placeholder="Введіть пароль"
              style={{ width: '100%', padding: '14px 16px', border: `1.5px solid ${error ? '#FF696F' : '#E5E7EB'}`, borderRadius: 12, fontFamily: 'Manrope, sans-serif', fontSize: 15, outline: 'none' }}
            />
            {error && <p style={{ color: '#FF696F', fontSize: 13, marginTop: 6 }}>Невірний пароль. Спробуйте: admin123</p>}
          </div>
          <button type="submit" className="btn-yellow" style={{ justifyContent: 'center', width: '100%', marginTop: 8 }}>
            Увійти →
          </button>
        </form>
        <p style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', marginTop: 24 }}>Пароль: admin123</p>
      </div>
    </div>
  )
}

/* ===================== DASHBOARD ===================== */
function Dashboard({ stats, apps, onTabChange }) {
  const recent = apps.slice(0, 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
        {[
          { label: 'Всього заявок', value: stats.total, icon: '📋', color: '#7B6EF6', bg: '#F3F0FF' },
          { label: 'Нові заявки', value: stats.new, icon: '🆕', color: '#FF696F', bg: '#FFF0F1' },
          { label: 'Опрацьовані', value: stats.contacted, icon: '📞', color: '#FF8C42', bg: '#FFF4EC' },
          { label: 'Зараховані', value: stats.enrolled, icon: '✅', color: '#A9D13D', bg: '#F3FBEA' },
        ].map(card => (
          <div key={card.label} style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ background: card.bg, borderRadius: 12, padding: '10px 12px', fontSize: 22 }}>{card.icon}</div>
            </div>
            <div style={{ fontFamily: 'Onest, sans-serif', fontSize: 36, fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.value}</div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 14, color: '#6B7280', marginTop: 6 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* This month */}
      <div style={{ background: 'linear-gradient(135deg, #7B6EF6, #9FA7FF)', borderRadius: 20, padding: 28, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 8 }}>📅 Цього місяця</div>
          <div style={{ fontFamily: 'Onest, sans-serif', fontSize: 44, fontWeight: 800 }}>{stats.thisMonth}</div>
          <div style={{ opacity: 0.8, marginTop: 4, fontSize: 15 }}>нових заявок</div>
        </div>
        <div style={{ fontSize: 80, opacity: 0.3 }}>🎉</div>
      </div>

      {/* Recent applications */}
      <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'Onest, sans-serif', fontSize: 18, fontWeight: 700 }}>Останні заявки</h3>
          <button onClick={() => onTabChange('applications')} style={{ background: 'none', border: 'none', color: '#7B6EF6', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>Всі заявки →</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Батьки', 'Дитина', 'Телефон', 'Дата', 'Статус'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 12, color: '#9CA3AF', fontWeight: 600, borderBottom: '1px solid #F3F4F6' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent.map(app => (
              <tr key={app.id} style={{ borderBottom: '1px solid #F9FAFB' }}>
                <td style={tCell}>{app.name}</td>
                <td style={tCell}>{app.childName || '—'} {app.childAge && <span style={{ color: '#9CA3AF', fontSize: 12 }}>({app.childAge})</span>}</td>
                <td style={tCell}>{app.phone}</td>
                <td style={tCell}>{formatDate(app.date)}</td>
                <td style={tCell}><StatusBadge status={app.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ===================== APPLICATIONS ===================== */
function Applications({ apps, search, setSearch, statusFilter, setStatusFilter, selected, setSelected, onStatusChange, onDelete }) {
  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      {/* List */}
      <div style={{ flex: 1 }}>
        {/* Filters */}
        <div style={{ background: 'white', borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Пошук по імені, телефону..."
            style={{ flex: 1, padding: '10px 16px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontFamily: 'Manrope, sans-serif', fontSize: 14, outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            {[['all', 'Всі'], ['new', 'Нові'], ['contacted', 'Опрацьовані'], ['enrolled', 'Зараховані']].map(([val, label]) => (
              <button key={val} onClick={() => setStatusFilter(val)} style={{ padding: '8px 14px', border: '1.5px solid', borderColor: statusFilter === val ? '#7B6EF6' : '#E5E7EB', borderRadius: 8, background: statusFilter === val ? '#7B6EF6' : 'white', color: statusFilter === val ? 'white' : '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Manrope, sans-serif' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#F9FAFB' }}>
              <tr>
                {['Батьки / Дитина', 'Телефон', 'Програма', 'Дата', 'Статус', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, color: '#9CA3AF', fontWeight: 600, borderBottom: '1px solid #F3F4F6' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apps.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 15 }}>Заявок не знайдено</td></tr>
              )}
              {apps.map(app => (
                <tr
                  key={app.id}
                  onClick={() => setSelected(app)}
                  style={{ borderBottom: '1px solid #F9FAFB', cursor: 'pointer', background: selected?.id === app.id ? '#F5F3FF' : 'white', transition: 'background 0.1s' }}
                >
                  <td style={tCell}>
                    <div style={{ fontWeight: 600 }}>{app.name}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>{app.childName || '—'} {app.childAge && `• ${app.childAge}`}</div>
                  </td>
                  <td style={tCell}>{app.phone}</td>
                  <td style={tCell}><span style={{ fontSize: 13 }}>{app.program}</span></td>
                  <td style={tCell}>{formatDate(app.date)}</td>
                  <td style={tCell}><StatusBadge status={app.status} /></td>
                  <td style={tCell} onClick={e => e.stopPropagation()}>
                    <select value={app.status} onChange={e => onStatusChange(app.id, e.target.value)} style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: '4px 8px', fontSize: 12, cursor: 'pointer', background: 'white' }}>
                      <option value="new">Нова</option>
                      <option value="contacted">Опрацьована</option>
                      <option value="enrolled">Зарахована</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div style={{ width: 320, background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', flexShrink: 0, position: 'sticky', top: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'Onest, sans-serif', fontSize: 16, fontWeight: 700 }}>Деталі заявки</h3>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9CA3AF' }}>✕</button>
          </div>
          <StatusBadge status={selected.status} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
            <Detail label="Батьки" value={selected.name} />
            <Detail label="Телефон" value={selected.phone} />
            <Detail label="Дитина" value={`${selected.childName || '—'} (${selected.childAge || '?'})`} />
            <Detail label="Програма" value={selected.program} />
            <Detail label="Дата" value={formatDate(selected.date)} />
            {selected.message && <Detail label="Коментар" value={selected.message} />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
            <p style={{ fontWeight: 600, fontSize: 13, color: '#374151' }}>Змінити статус:</p>
            {[['new', 'Нова 🆕'], ['contacted', 'Опрацьована 📞'], ['enrolled', 'Зарахована ✅']].map(([val, label]) => (
              <button key={val} onClick={() => onStatusChange(selected.id, val)} style={{ padding: '10px', borderRadius: 10, border: `2px solid ${selected.status === val ? '#7B6EF6' : '#E5E7EB'}`, background: selected.status === val ? '#7B6EF6' : 'white', color: selected.status === val ? 'white' : '#374151', fontWeight: 600, cursor: 'pointer', fontSize: 13, transition: 'all 0.2s' }}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={() => onDelete(selected.id)} style={{ marginTop: 16, width: '100%', padding: 10, borderRadius: 10, border: '2px solid #FF696F', background: 'none', color: '#FF696F', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
            🗑 Видалити заявку
          </button>
        </div>
      )}
    </div>
  )
}

/* ===================== ANALYTICS ===================== */
function Analytics({ apps, stats }) {
  // Count by program
  const byProgram = {}
  apps.forEach(a => { byProgram[a.program] = (byProgram[a.program] || 0) + 1 })
  const programData = Object.entries(byProgram).sort((a, b) => b[1] - a[1])
  const max = programData[0]?.[1] || 1

  // Count by month (last 6 months)
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('uk-UA', { month: 'short' })
    const count = apps.filter(a => a.date.startsWith(key)).length
    months.push({ label, count })
  }
  const maxMonth = Math.max(...months.map(m => m.count), 1)

  // Status distribution
  const statusDist = [
    { label: 'Нові', value: stats.new, color: '#FF696F' },
    { label: 'Опрацьовані', value: stats.contacted, color: '#FF8C42' },
    { label: 'Зараховані', value: stats.enrolled, color: '#A9D13D' },
  ]
  const totalDist = stats.total || 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        <KpiCard label="Конверсія в зарахування" value={`${stats.total ? Math.round((stats.enrolled / stats.total) * 100) : 0}%`} icon="🎯" color="#7B6EF6" />
        <KpiCard label="Нові цього місяця" value={stats.thisMonth} icon="📅" color="#A9D13D" />
        <KpiCard label="Потребують контакту" value={stats.new} icon="📞" color="#FF696F" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Monthly bar chart */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontFamily: 'Onest, sans-serif', fontSize: 16, fontWeight: 700, marginBottom: 24 }}>Заявки по місяцях</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160 }}>
            {months.map(m => (
              <div key={m.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{m.count}</span>
                <div style={{ width: '100%', background: '#7B6EF6', borderRadius: '6px 6px 0 0', height: `${(m.count / maxMonth) * 100}%`, minHeight: m.count ? 8 : 4, transition: 'height 0.3s' }} />
                <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'Manrope, sans-serif' }}>{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status distribution */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontFamily: 'Onest, sans-serif', fontSize: 16, fontWeight: 700, marginBottom: 24 }}>Розподіл статусів</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {statusDist.map(item => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 14, color: '#374151' }}>{item.label}</span>
                  <span style={{ fontFamily: 'Onest, sans-serif', fontWeight: 700, color: item.color }}>{item.value}</span>
                </div>
                <div style={{ height: 10, background: '#F3F4F6', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(item.value / totalDist) * 100}%`, background: item.color, borderRadius: 5, transition: 'width 0.5s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Programs breakdown */}
      <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h3 style={{ fontFamily: 'Onest, sans-serif', fontSize: 16, fontWeight: 700, marginBottom: 24 }}>Популярність програм</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {programData.map(([prog, count], i) => (
            <div key={prog}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 14, color: '#374151' }}>{prog}</span>
                <span style={{ fontFamily: 'Onest, sans-serif', fontWeight: 700, color: '#7B6EF6' }}>{count}</span>
              </div>
              <div style={{ height: 12, background: '#F3F4F6', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(count / max) * 100}%`, background: ['#7B6EF6', '#FF696F', '#A9D13D', '#FF8C42', '#6BB8FF', '#FFD600'][i % 6], borderRadius: 6, transition: 'width 0.5s' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, icon, color }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ background: color + '15', borderRadius: 14, padding: '12px 14px', fontSize: 28 }}>{icon}</div>
      <div>
        <div style={{ fontFamily: 'Onest, sans-serif', fontSize: 32, fontWeight: 800, color }}>{value}</div>
        <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: '#6B7280', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, color: '#374151', fontFamily: 'Manrope, sans-serif' }}>{value}</div>
    </div>
  )
}

function StatusBadge({ status }) {
  const s = STATUS_LABELS[status] || STATUS_LABELS.new
  return (
    <span style={{ background: s.bg, color: s.color, fontWeight: 700, fontSize: 12, padding: '4px 10px', borderRadius: 20, fontFamily: 'Manrope, sans-serif', whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/* ===================== CONTENT EDITOR ===================== */
function ContentEditor() {
  const [content, setContent] = useState(() => getContent())
  const [activeSection, setActiveSection] = useState('hero')
  const [saved, setSaved] = useState(false)

  function update(path, value) {
    const keys = path.split('.')
    setContent(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      let obj = next
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]]
      obj[keys[keys.length - 1]] = value
      return next
    })
    setSaved(false)
  }

  function updateListItem(section, index, field, value) {
    setContent(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      next[section].items[index][field] = value
      return next
    })
    setSaved(false)
  }

  function addListItem(section, template) {
    setContent(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      next[section].items.push({ ...template })
      return next
    })
    setSaved(false)
  }

  function removeListItem(section, index) {
    setContent(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      next[section].items.splice(index, 1)
      return next
    })
    setSaved(false)
  }

  function updateStat(index, field, value) {
    setContent(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      next.about.stats[index][field] = value
      return next
    })
    setSaved(false)
  }

  function handleSave() {
    saveContent(content)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function handleReset() {
    if (confirm('Скинути весь контент до початкових значень?')) {
      const def = resetContent()
      setContent(def)
      setSaved(false)
    }
  }

  const sections = [
    { key: 'hero', label: '🦸 Героя секція' },
    { key: 'about', label: '🏫 Про садочок' },
    { key: 'whyUs', label: '✅ Чому нас обирають' },
    { key: 'programs', label: '📚 Програми' },
    { key: 'reviews', label: '⭐ Відгуки' },
    { key: 'contact', label: '📞 Контакти' },
    { key: 'header', label: '🔝 Хедер' },
    { key: 'footer', label: '🔻 Футер' },
  ]

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      {/* Section nav */}
      <div style={{ width: 220, background: 'white', borderRadius: 16, padding: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', flexShrink: 0, position: 'sticky', top: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', padding: '4px 8px 12px', letterSpacing: 0.5 }}>Секції сайту</p>
        {sections.map(s => (
          <button key={s.key} onClick={() => setActiveSection(s.key)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 10, border: 'none', background: activeSection === s.key ? '#F5F3FF' : 'none', color: activeSection === s.key ? '#7B6EF6' : '#374151', fontWeight: activeSection === s.key ? 700 : 500, fontSize: 14, cursor: 'pointer', fontFamily: 'Manrope, sans-serif', marginBottom: 2 }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Editor panel */}
      <div style={{ flex: 1 }}>
        {/* Top bar */}
        <div style={{ background: 'white', borderRadius: 16, padding: '16px 24px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 14, color: '#6B7280' }}>Зміни зберігаються в браузері та одразу відображаються на сайті</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleReset} style={{ padding: '10px 18px', border: '1.5px solid #E5E7EB', borderRadius: 10, background: 'none', color: '#6B7280', fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'Manrope, sans-serif' }}>
              ↺ Скинути
            </button>
            <a href="/" target="_blank" style={{ padding: '10px 18px', border: '1.5px solid #7B6EF6', borderRadius: 10, background: 'none', color: '#7B6EF6', fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'Manrope, sans-serif', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              👁 Переглянути
            </a>
            <button onClick={handleSave} style={{ padding: '10px 24px', border: 'none', borderRadius: 10, background: saved ? '#A9D13D' : '#7B6EF6', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'Manrope, sans-serif', transition: 'background 0.3s' }}>
              {saved ? '✓ Збережено!' : '💾 Зберегти'}
            </button>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 16, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {activeSection === 'hero' && <HeroEditor data={content.hero} update={(f, v) => update(`hero.${f}`, v)} />}
          {activeSection === 'about' && <AboutEditor data={content.about} update={(f, v) => update(`about.${f}`, v)} updateStat={updateStat} />}
          {activeSection === 'whyUs' && <ListEditor title="Причини обирати нас" data={content.whyUs} section="whyUs" update={(f, v) => update(`whyUs.${f}`, v)} updateItem={(i, f, v) => updateListItem('whyUs', i, f, v)} addItem={() => addListItem('whyUs', { icon: '🌟', title: 'Нова причина', text: 'Опис...' })} removeItem={(i) => removeListItem('whyUs', i)} fields={['icon', 'title', 'text']} fieldLabels={['Emoji', 'Заголовок', 'Опис']} fieldTypes={['text', 'text', 'textarea']} />}
          {activeSection === 'programs' && <ProgramsEditor data={content.programs} update={(f, v) => update(`programs.${f}`, v)} updateItem={(i, f, v) => updateListItem('programs', i, f, v)} addItem={() => addListItem('programs', { emoji: '📖', title: 'Нова програма', age: '3–6', color: '#7B6EF6', desc: 'Опис програми...' })} removeItem={(i) => removeListItem('programs', i)} />}
          {activeSection === 'reviews' && <ListEditor title="Відгуки батьків" data={content.reviews} section="reviews" update={(f, v) => update(`reviews.${f}`, v)} updateItem={(i, f, v) => updateListItem('reviews', i, f, v)} addItem={() => addListItem('reviews', { name: 'Ім\'я', child: '4 роки', stars: 5, text: 'Відгук...' })} removeItem={(i) => removeListItem('reviews', i)} fields={['name', 'child', 'stars', 'text']} fieldLabels={['Ім\'я', 'Вік дитини', 'Зірки (1-5)', 'Текст відгуку']} fieldTypes={['text', 'text', 'number', 'textarea']} />}
          {activeSection === 'contact' && <SimpleEditor title="Контакти" fields={[['tag', 'Тег (підпис)', 'text'], ['title', 'Заголовок (\\n = новий рядок)', 'text'], ['subtitle', 'Підзаголовок', 'textarea'], ['address', 'Адреса', 'text'], ['phone', 'Телефон', 'text'], ['email', 'Email', 'text'], ['hours', 'Графік роботи', 'text']]} data={content.contact} update={(f, v) => update(`contact.${f}`, v)} />}
          {activeSection === 'header' && <SimpleEditor title="Хедер" fields={[['phone', 'Телефон', 'text'], ['telegramUrl', 'Посилання Telegram', 'text'], ['callbackBtnText', 'Текст кнопки зворотного дзвінка', 'text']]} data={content.header} update={(f, v) => update(`header.${f}`, v)} />}
          {activeSection === 'footer' && <SimpleEditor title="Футер" fields={[['name', 'Назва садочку', 'text'], ['description', 'Опис', 'textarea'], ['facebookUrl', 'Facebook URL', 'text'], ['instagramUrl', 'Instagram URL', 'text'], ['telegramUrl', 'Telegram URL', 'text']]} data={content.footer} update={(f, v) => update(`footer.${f}`, v)} />}
        </div>
      </div>
    </div>
  )
}

/* --- Hero editor --- */
function HeroEditor({ data, update }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionTitle>Героя секція</SectionTitle>
      <CField label="Заголовок (\\n = перенос рядка)"><textarea style={cf.input} rows={2} value={data.title} onChange={e => update('title', e.target.value)} /></CField>
      <CField label="Підзаголовок"><textarea style={cf.input} rows={3} value={data.subtitle} onChange={e => update('subtitle', e.target.value)} /></CField>
      <CField label="Текст кнопки"><input style={cf.input} value={data.ctaText} onChange={e => update('ctaText', e.target.value)} /></CField>
      <SectionTitle sub>Фотографії (URL зображень)</SectionTitle>
      {[['image1', 'Фото 1 (нижнє)'], ['image2', 'Фото 2 (верхнє праве)'], ['image3', 'Фото 3 (верхнє ліве)']].map(([key, label]) => (
        <CField key={key} label={label}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input style={{ ...cf.input, flex: 1 }} value={data[key]} onChange={e => update(key, e.target.value)} placeholder="https://..." />
            {data[key] && <img src={data[key]} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 10, border: '2px solid #E5E7EB', flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />}
          </div>
        </CField>
      ))}
      <SectionTitle sub>Бейджі на фото</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[['badge1', 'Бейдж 1 (Творчість)'], ['badge2', 'Бейдж 2 (Англійська)'], ['badge3', 'Бейдж 3 (Спорт)'], ['badge4', 'Бейдж 4 (Досвід)'], ['badge5', 'Бейдж 5 (Музика)']].map(([key, label]) => (
          <CField key={key} label={label}><input style={cf.input} value={data[key]} onChange={e => update(key, e.target.value)} /></CField>
        ))}
      </div>
    </div>
  )
}

/* --- About editor --- */
function AboutEditor({ data, update, updateStat }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionTitle>Про садочок</SectionTitle>
      <CField label="Тег (мітка)"><input style={cf.input} value={data.tag} onChange={e => update('tag', e.target.value)} /></CField>
      <CField label="Заголовок (\\n = новий рядок)"><input style={cf.input} value={data.title} onChange={e => update('title', e.target.value)} /></CField>
      <CField label="Параграф 1"><textarea style={cf.input} rows={4} value={data.text1} onChange={e => update('text1', e.target.value)} /></CField>
      <CField label="Параграф 2"><textarea style={cf.input} rows={4} value={data.text2} onChange={e => update('text2', e.target.value)} /></CField>
      <CField label="Текст кнопки"><input style={cf.input} value={data.ctaText} onChange={e => update('ctaText', e.target.value)} /></CField>
      <SectionTitle sub>Фотографії</SectionTitle>
      {[['image1', 'Фото 1 (ліве)'], ['image2', 'Фото 2 (праве)']].map(([key, label]) => (
        <CField key={key} label={label}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input style={{ ...cf.input, flex: 1 }} value={data[key]} onChange={e => update(key, e.target.value)} placeholder="https://..." />
            {data[key] && <img src={data[key]} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 10, border: '2px solid #E5E7EB', flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />}
          </div>
        </CField>
      ))}
      <SectionTitle sub>Статистика</SectionTitle>
      {data.stats.map((s, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, padding: '12px 16px', background: '#F9FAFB', borderRadius: 10 }}>
          <CField label="Число"><input style={cf.input} value={s.num} onChange={e => updateStat(i, 'num', e.target.value)} /></CField>
          <CField label="Підпис"><input style={cf.input} value={s.label} onChange={e => updateStat(i, 'label', e.target.value)} /></CField>
        </div>
      ))}
    </div>
  )
}

/* --- Programs editor --- */
function ProgramsEditor({ data, update, updateItem, addItem, removeItem }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionTitle>Програми</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <CField label="Заголовок секції"><input style={cf.input} value={data.title} onChange={e => update('title', e.target.value)} /></CField>
        <CField label="Текст кнопки CTA"><input style={cf.input} value={data.ctaText} onChange={e => update('ctaText', e.target.value)} /></CField>
      </div>
      <CField label="Підзаголовок"><input style={cf.input} value={data.subtitle} onChange={e => update('subtitle', e.target.value)} /></CField>
      <SectionTitle sub>Картки програм</SectionTitle>
      {data.items.map((item, i) => (
        <div key={i} style={{ border: '1.5px solid #E5E7EB', borderRadius: 14, padding: 20, position: 'relative' }}>
          <button onClick={() => removeItem(i)} style={{ position: 'absolute', top: 12, right: 12, background: '#FFF0F1', border: 'none', color: '#FF696F', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>✕ Видалити</button>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <CField label="Emoji"><input style={cf.input} value={item.emoji} onChange={e => updateItem(i, 'emoji', e.target.value)} /></CField>
            <CField label="Назва"><input style={cf.input} value={item.title} onChange={e => updateItem(i, 'title', e.target.value)} /></CField>
            <CField label="Вік"><input style={cf.input} value={item.age} onChange={e => updateItem(i, 'age', e.target.value)} /></CField>
            <CField label="Колір (hex)">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" value={item.color} onChange={e => updateItem(i, 'color', e.target.value)} style={{ width: 40, height: 38, padding: 2, border: '1.5px solid #E5E7EB', borderRadius: 8, cursor: 'pointer' }} />
                <input style={{ ...cf.input, flex: 1 }} value={item.color} onChange={e => updateItem(i, 'color', e.target.value)} />
              </div>
            </CField>
          </div>
          <CField label="Опис"><textarea style={cf.input} rows={2} value={item.desc} onChange={e => updateItem(i, 'desc', e.target.value)} /></CField>
        </div>
      ))}
      <button onClick={addItem} style={{ padding: '12px', border: '2px dashed #E5E7EB', borderRadius: 12, background: 'none', color: '#9CA3AF', cursor: 'pointer', fontWeight: 600, fontSize: 14, transition: 'all 0.2s' }}>
        + Додати програму
      </button>
    </div>
  )
}

/* --- Generic list editor --- */
function ListEditor({ title, data, section, update, updateItem, addItem, removeItem, fields, fieldLabels, fieldTypes }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionTitle>{title}</SectionTitle>
      <CField label="Заголовок секції"><input style={cf.input} value={data.title} onChange={e => update('title', e.target.value)} /></CField>
      {data.subtitle !== undefined && <CField label="Підзаголовок"><textarea style={cf.input} rows={2} value={data.subtitle} onChange={e => update('subtitle', e.target.value)} /></CField>}
      <SectionTitle sub>Елементи</SectionTitle>
      {data.items.map((item, i) => (
        <div key={i} style={{ border: '1.5px solid #E5E7EB', borderRadius: 14, padding: 20, position: 'relative' }}>
          <button onClick={() => removeItem(i)} style={{ position: 'absolute', top: 12, right: 12, background: '#FFF0F1', border: 'none', color: '#FF696F', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>✕</button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {fields.map((field, fi) => (
              <CField key={field} label={fieldLabels[fi]}>
                {fieldTypes[fi] === 'textarea'
                  ? <textarea style={cf.input} rows={3} value={item[field] ?? ''} onChange={e => updateItem(i, field, e.target.value)} />
                  : <input style={cf.input} type={fieldTypes[fi]} value={item[field] ?? ''} onChange={e => updateItem(i, field, fieldTypes[fi] === 'number' ? Number(e.target.value) : e.target.value)} />
                }
              </CField>
            ))}
          </div>
        </div>
      ))}
      <button onClick={addItem} style={{ padding: '12px', border: '2px dashed #E5E7EB', borderRadius: 12, background: 'none', color: '#9CA3AF', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
        + Додати елемент
      </button>
    </div>
  )
}

/* --- Simple key-value editor --- */
function SimpleEditor({ title, fields, data, update }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionTitle>{title}</SectionTitle>
      {fields.map(([key, label, type]) => (
        <CField key={key} label={label}>
          {type === 'textarea'
            ? <textarea style={cf.input} rows={3} value={data[key] ?? ''} onChange={e => update(key, e.target.value)} />
            : <input style={cf.input} value={data[key] ?? ''} onChange={e => update(key, e.target.value)} />
          }
        </CField>
      ))}
    </div>
  )
}

function SectionTitle({ children, sub }) {
  return <h3 style={{ fontFamily: 'Onest, sans-serif', fontSize: sub ? 15 : 18, fontWeight: 700, color: sub ? '#6B7280' : '#090909', paddingBottom: sub ? 0 : 12, borderBottom: sub ? 'none' : '1px solid #F3F4F6', marginBottom: 4 }}>{children}</h3>
}

function CField({ label, children }) {
  return (
    <div>
      <label style={{ fontWeight: 600, fontSize: 13, color: '#374151', display: 'block', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

const cf = {
  input: { width: '100%', padding: '11px 14px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontFamily: 'Manrope, sans-serif', fontSize: 14, outline: 'none', background: 'white', resize: 'vertical' },
}

const tCell = {
  padding: '14px 16px',
  fontSize: 14,
  color: '#374151',
  fontFamily: 'Manrope, sans-serif',
  verticalAlign: 'middle',
}

const adm = {
  root: { display: 'flex', minHeight: '100vh', background: '#F9FAFB' },
  sidebar: { width: 260, background: 'white', borderRight: '1px solid #F3F4F6', display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' },
  logo: { display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px 28px', borderBottom: '1px solid #F3F4F6', marginBottom: 16 },
  logoTitle: { fontFamily: 'Onest, sans-serif', fontWeight: 700, fontSize: 15, color: '#090909' },
  logoSub: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Manrope, sans-serif' },
  nav: { display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px', flex: 1 },
  navBtn: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: 14, color: '#374151', width: '100%', textAlign: 'left', transition: 'all 0.15s' },
  navBtnActive: { background: '#F5F3FF', color: '#7B6EF6' },
  badge: { marginLeft: 'auto', background: '#FF696F', color: 'white', borderRadius: 20, padding: '2px 8px', fontSize: 12, fontWeight: 700 },
  sideFooter: { padding: '20px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', flexDirection: 'column', gap: 8 },
  backLink: { color: '#7B6EF6', textDecoration: 'none', fontWeight: 600, fontSize: 14, fontFamily: 'Manrope, sans-serif' },
  logoutBtn: { background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontWeight: 600, fontSize: 14, textAlign: 'left', fontFamily: 'Manrope, sans-serif' },
  main: { flex: 1, padding: 32, maxWidth: 'calc(100vw - 260px)', overflowX: 'auto' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  pageTitle: { fontFamily: 'Onest, sans-serif', fontSize: 26, fontWeight: 800, color: '#090909' },
  adminInfo: { display: 'flex', alignItems: 'center', gap: 10 },
  adminAvatar: { width: 36, height: 36, borderRadius: '50%', background: '#7B6EF6', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Onest, sans-serif' },
}
