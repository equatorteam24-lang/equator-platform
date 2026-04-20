'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const SITE_TYPES = [
  { value: 'one-page', label: 'Односторінковий' },
  { value: 'multi-page', label: 'Багатосторінковий' },
  { value: 'landing', label: 'Лендінг' },
]

const THEMES = [
  { value: 'light', label: 'Світла' },
  { value: 'dark', label: 'Темна' },
  { value: 'auto', label: 'Авто (на вибір агента)' },
]

const STYLES = [
  { value: 'minimalist', label: 'Мінімалістичний' },
  { value: 'corporate', label: 'Корпоративний' },
  { value: 'creative', label: 'Креативний' },
  { value: 'premium', label: 'Преміум (Awwwards-рівень)' },
]

const FEATURES = [
  { key: 'contactForm', label: 'Форма зворотнього зв\'язку' },
  { key: 'gallery', label: 'Галерея / портфоліо' },
  { key: 'reviews', label: 'Відгуки клієнтів' },
  { key: 'map', label: 'Google Карта' },
  { key: 'chatWidget', label: 'Чат-віджет' },
  { key: 'calculator', label: 'Калькулятор / розрахунок' },
  { key: 'faq', label: 'FAQ блок' },
  { key: 'blog', label: 'Блог / новини' },
]

const MODELS = [
  { value: 'claude-sonnet-4-6', label: 'Sonnet 4.6 — швидко (~5 хв)' },
  { value: 'claude-opus-4-6', label: 'Opus 4.6 — преміум якість (~15 хв)' },
]

export default function NewSitePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [siteType, setSiteType] = useState('one-page')
  const [theme, setTheme] = useState('light')
  const [structure, setStructure] = useState('')
  const [referenceUrls, setReferenceUrls] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#2563eb')
  const [secondaryColor, setSecondaryColor] = useState('#f97316')
  const [designStyle, setDesignStyle] = useState('premium')
  const [companyName, setCompanyName] = useState('')
  const [companyDescription, setCompanyDescription] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [socials, setSocials] = useState('')
  const [features, setFeatures] = useState<Record<string, boolean>>({})
  const [extraWishes, setExtraWishes] = useState('')
  const [model, setModel] = useState('claude-sonnet-4-6')

  // AI generation states
  const [genStructure, setGenStructure] = useState(false)
  const [genColors, setGenColors] = useState(false)
  const [genFeatures, setGenFeatures] = useState(false)

  const toggleFeature = (key: string) => {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleGenerateStructure = async () => {
    setGenStructure(true)
    try {
      const res = await fetch('/api/sites/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'structure',
          context: { siteType, companyName, companyDescription },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setStructure(data.suggestion)
      }
    } catch {}
    setGenStructure(false)
  }

  const handleGenerateColors = async () => {
    setGenColors(true)
    try {
      const res = await fetch('/api/sites/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'colors',
          context: { siteType, designStyle, companyName, companyDescription },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.primary) setPrimaryColor(data.primary)
        if (data.secondary) setSecondaryColor(data.secondary)
      }
    } catch {}
    setGenColors(false)
  }

  const handleGenerateFeatures = async () => {
    setGenFeatures(true)
    try {
      const res = await fetch('/api/sites/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'features',
          context: { siteType, companyName, companyDescription },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.features) setFeatures(data.features)
        if (data.wishes) setExtraWishes(data.wishes)
      }
    } catch {}
    setGenFeatures(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Введіть назву проекту'); return }
    if (!companyName.trim()) { setError('Введіть назву компанії'); return }

    setSaving(true)
    setError('')

    try {
      const formData = {
        siteType,
        theme,
        structure,
        referenceUrls,
        primaryColor,
        secondaryColor,
        designStyle,
        companyName,
        companyDescription,
        phone,
        email,
        address,
        socials,
        features,
        extraWishes,
        model,
      }

      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, formData }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Помилка створення проекту')
        setSaving(false)
        return
      }

      const data = await res.json()
      router.push(`/sites/${data.id}`)
    } catch {
      setError('Мережева помилка')
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Новий сайт</h1>
      <p className="text-sm text-gray-500 mb-8">Заповніть бриф — агент зверстає сайт автоматично</p>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-10">

        {/* ─── 1. Основна інформація ─── */}
        <Section title="Основна інформація" num="01">
          <Field label="Назва проекту" required>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Наприклад: Сайт для TransLogistics"
              className="input"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Тип сайту">
              <select value={siteType} onChange={e => setSiteType(e.target.value)} className="input">
                {SITE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Тема">
              <select value={theme} onChange={e => setTheme(e.target.value)} className="input">
                {THEMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
          </div>
        </Section>

        {/* ─── 2. Структура ─── */}
        <Section title="Структура сайту" num="02">
          <Field label="Опишіть блоки сайту" hint="Hero, Про нас, Послуги, Галерея, Контакти і т.д.">
            <textarea
              value={structure}
              onChange={e => setStructure(e.target.value)}
              rows={5}
              placeholder="Наприклад:&#10;1. Hero з великим фото та слоганом&#10;2. Про компанію — текст + фото&#10;3. Послуги — 4 картки&#10;4. Галерея робіт&#10;5. Відгуки клієнтів&#10;6. Контакти + форма"
              className="input"
            />
          </Field>
          <button
            type="button"
            onClick={handleGenerateStructure}
            disabled={genStructure}
            className="btn-outline"
          >
            {genStructure ? 'Генерую...' : '✨ Згенерувати структуру'}
          </button>
        </Section>

        {/* ─── 3. Дизайн ─── */}
        <Section title="Дизайн" num="03">
          <Field label="Референс URL" hint="Посилання на сайти, які подобаються (кожен з нового рядка)">
            <textarea
              value={referenceUrls}
              onChange={e => setReferenceUrls(e.target.value)}
              rows={3}
              placeholder="https://unison.org.ua&#10;https://example.com"
              className="input"
            />
          </Field>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Основний колір">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  className="input flex-1"
                />
              </div>
            </Field>
            <Field label="Додатковий колір">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={e => setSecondaryColor(e.target.value)}
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={e => setSecondaryColor(e.target.value)}
                  className="input flex-1"
                />
              </div>
            </Field>
            <Field label="Стиль">
              <select value={designStyle} onChange={e => setDesignStyle(e.target.value)} className="input">
                {STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
          </div>
          <button
            type="button"
            onClick={handleGenerateColors}
            disabled={genColors}
            className="btn-outline"
          >
            {genColors ? 'Підбираю...' : '✨ Підібрати кольори'}
          </button>
        </Section>

        {/* ─── 4. Контент ─── */}
        <Section title="Контент" num="04">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Назва компанії" required>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="ТрансЛогістика"
                className="input"
              />
            </Field>
            <Field label="Телефон">
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+380 44 123 4567"
                className="input"
              />
            </Field>
          </div>
          <Field label="Опис компанії">
            <textarea
              value={companyDescription}
              onChange={e => setCompanyDescription(e.target.value)}
              rows={3}
              placeholder="Коротко про діяльність, переваги, цільову аудиторію..."
              className="input"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="info@company.ua"
                className="input"
              />
            </Field>
            <Field label="Адреса">
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="м. Київ, вул. Хрещатик, 22"
                className="input"
              />
            </Field>
          </div>
          <Field label="Соцмережі" hint="Посилання через кому або з нового рядка">
            <textarea
              value={socials}
              onChange={e => setSocials(e.target.value)}
              rows={2}
              placeholder="Instagram: @company, Facebook: facebook.com/company"
              className="input"
            />
          </Field>
        </Section>

        {/* ─── 5. Функціонал ─── */}
        <Section title="Функціонал" num="05">
          <div className="grid grid-cols-2 gap-2">
            {FEATURES.map(f => (
              <label
                key={f.key}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition ${
                  features[f.key]
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={!!features[f.key]}
                  onChange={() => toggleFeature(f.key)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                  features[f.key] ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                }`}>
                  {features[f.key] && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium">{f.label}</span>
              </label>
            ))}
          </div>
          <Field label="Додаткові побажання">
            <textarea
              value={extraWishes}
              onChange={e => setExtraWishes(e.target.value)}
              rows={3}
              placeholder="Наприклад: кнопка меню як в Unison, конвертик для зворотнього дзвінка..."
              className="input"
            />
          </Field>
          <button
            type="button"
            onClick={handleGenerateFeatures}
            disabled={genFeatures}
            className="btn-outline"
          >
            {genFeatures ? 'Аналізую...' : '✨ Рекомендувати функціонал'}
          </button>
        </Section>

        {/* ─── 6. Налаштування генерації ─── */}
        <Section title="Генерація" num="06">
          <Field label="Модель AI">
            <div className="space-y-2">
              {MODELS.map(m => (
                <label
                  key={m.value}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition ${
                    model === m.value
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="model"
                    value={m.value}
                    checked={model === m.value}
                    onChange={e => setModel(e.target.value)}
                    className="text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">{m.label}</span>
                </label>
              ))}
            </div>
          </Field>
        </Section>

        {/* ─── Submit ─── */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {saving ? 'Створюю...' : '🚀 Створити сайт'}
          </button>
          <p className="text-xs text-gray-400">
            Після натискання агент почне верстку. Орієнтовний час: 5–15 хвилин.
          </p>
        </div>
      </form>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #d1d5db;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s;
          background: white;
        }
        .input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        textarea.input {
          resize: vertical;
        }
        select.input {
          appearance: auto;
        }
        .btn-outline {
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
          padding: 0.5rem 1rem;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #6b7280;
          background: white;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-outline:hover:not(:disabled) {
          border-color: #3b82f6;
          color: #3b82f6;
        }
        .btn-outline:disabled {
          opacity: 0.5;
          cursor: wait;
        }
      `}</style>
    </div>
  )
}

function Section({ title, num, children }: { title: string; num: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 rounded px-2 py-0.5">
          {num}
        </span>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="space-y-4 pl-0">{children}</div>
    </div>
  )
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
      {children}
    </div>
  )
}
