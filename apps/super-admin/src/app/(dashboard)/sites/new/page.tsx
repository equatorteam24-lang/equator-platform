'use client'

import { useState, useRef } from 'react'
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

export default function NewSitePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Voice / describe
  const [freeDescription, setFreeDescription] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const recognitionRef = useRef<any>(null)

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
  const [extraWishes, setExtraWishes] = useState('')

  // ── Voice recording (Web Speech API) ──
  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Ваш браузер не підтримує голосовий запис. Використайте Chrome.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'uk-UA'
    recognition.interimResults = true
    recognition.continuous = true

    let finalTranscript = freeDescription

    recognition.onresult = (event: any) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? ' ' : '') + event.results[i][0].transcript
        } else {
          interim += event.results[i][0].transcript
        }
      }
      setFreeDescription(finalTranscript + (interim ? ' ' + interim : ''))
    }

    recognition.onerror = () => {
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsRecording(false)
  }

  // ── AI parse description into form fields ──
  const handleParseDescription = async () => {
    if (!freeDescription.trim()) {
      setError('Спочатку опишіть проект текстом або голосом')
      return
    }

    setIsParsing(true)
    setError('')

    try {
      const res = await fetch('/api/sites/parse-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: freeDescription }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        setError(errData.error || 'Помилка розбору. Спробуйте ще раз.')
        setIsParsing(false)
        return
      }

      const data = await res.json()

      // Fill form fields from AI response
      if (data.name) setName(data.name)
      if (data.companyName) setCompanyName(data.companyName)
      if (data.companyDescription) setCompanyDescription(data.companyDescription)
      if (data.siteType) setSiteType(data.siteType)
      if (data.theme) setTheme(data.theme)
      if (data.designStyle) setDesignStyle(data.designStyle)
      if (data.structure) setStructure(data.structure)
      if (data.primaryColor) setPrimaryColor(data.primaryColor)
      if (data.secondaryColor) setSecondaryColor(data.secondaryColor)
      if (data.phone) setPhone(data.phone)
      if (data.email) setEmail(data.email)
      if (data.address) setAddress(data.address)
      if (data.socials) setSocials(data.socials)
      if (data.extraWishes) setExtraWishes(data.extraWishes)
    } catch {
      setError('Мережева помилка')
    }

    setIsParsing(false)
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
        extraWishes,
        freeDescription,
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
      <p className="text-sm text-gray-500 mb-8">Опишіть проект — агент зверстає сайт автоматично</p>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-10">

        {/* ─── 01. Опишіть проект ─── */}
        <Section title="Опишіть проект своїми словами" num="01">
          <p className="text-xs text-gray-400 -mt-2 mb-3">
            Розкажіть все що знаєте: назва, чим займається, який дизайн хочете, кольори, структуру.
            Можна текстом або голосом — AI розбере по полях автоматично.
          </p>
          <div className="relative">
            <textarea
              value={freeDescription}
              onChange={e => setFreeDescription(e.target.value)}
              rows={6}
              placeholder={'Наприклад: Потрібен сайт для компанії "ТрансЛогістика", вони займаються вантажними перевезеннями по Україні. Дизайн повинен бути в синіх тонах, світлий, сучасний. Потрібні секції: герой з великим фото фури, про компанію, послуги (4 картки), географія перевезень з картою, відгуки клієнтів, форма зворотнього зв\'язку. Телефон: +380 44 123 45 67, email: info@translog.ua'}
              className="input !pr-14"
            />
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`absolute right-3 top-3 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
              }`}
              title={isRecording ? 'Зупинити запис' : 'Записати голосом'}
            >
              {isRecording ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>
          </div>
          {isRecording && (
            <p className="text-xs text-red-500 flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              Запис... Говоріть українською. Натисніть щоб зупинити.
            </p>
          )}
          <button
            type="button"
            onClick={handleParseDescription}
            disabled={isParsing || !freeDescription.trim()}
            className="mt-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isParsing ? 'Аналізую...' : 'Розібрати по полях'}
          </button>
        </Section>

        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-4 text-xs text-gray-400">або заповніть вручну / перевірте що AI розібрав</span>
          </div>
        </div>

        {/* ─── 02. Основна інформація ─── */}
        <Section title="Основна інформація" num="02">
          <Field label="Назва проекту" required>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Наприклад: Сайт для TransLogistics"
              className="input"
            />
          </Field>
          <div className="grid grid-cols-3 gap-4">
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
            <Field label="Стиль">
              <select value={designStyle} onChange={e => setDesignStyle(e.target.value)} className="input">
                {STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
          </div>
        </Section>

        {/* ─── 03. Структура ─── */}
        <Section title="Структура сайту" num="03">
          <Field label="Блоки сайту" hint="Hero, Про нас, Послуги, Галерея, Контакти і т.д.">
            <textarea
              value={structure}
              onChange={e => setStructure(e.target.value)}
              rows={5}
              placeholder="Наприклад:&#10;1. Hero з великим фото та слоганом&#10;2. Про компанію — текст + фото&#10;3. Послуги — 4 картки&#10;4. Галерея робіт&#10;5. Відгуки клієнтів&#10;6. Контакти + форма"
              className="input"
            />
          </Field>
        </Section>

        {/* ─── 04. Дизайн ─── */}
        <Section title="Дизайн" num="04">
          <Field label="Референс URL" hint="Посилання на сайти, які подобаються (кожен з нового рядка)">
            <textarea
              value={referenceUrls}
              onChange={e => setReferenceUrls(e.target.value)}
              rows={2}
              placeholder="https://example.com"
              className="input"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
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
          </div>
        </Section>

        {/* ─── 05. Контент ─── */}
        <Section title="Контент та контакти" num="05">
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
          <Field label="Соцмережі">
            <textarea
              value={socials}
              onChange={e => setSocials(e.target.value)}
              rows={2}
              placeholder="Instagram: @company, Facebook: facebook.com/company"
              className="input"
            />
          </Field>
          <Field label="Додаткові побажання">
            <textarea
              value={extraWishes}
              onChange={e => setExtraWishes(e.target.value)}
              rows={3}
              placeholder="Все що не ввійшло в інші поля: анімації, конкретні елементи, приклади..."
              className="input"
            />
          </Field>
        </Section>

        {/* ─── Submit ─── */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {saving ? 'Створюю...' : 'Створити сайт'}
          </button>
          <p className="text-xs text-gray-400">
            Після натискання агент почне верстку. Орієнтовний час: 5-15 хвилин.
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
