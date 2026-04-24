'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SITE_TYPES = [
  { value: 'one-page', label: 'Односторінковий' },
  { value: 'multi-page', label: 'Багатосторінковий' },
]

const THEMES = [
  { value: 'light', label: 'Світла' },
  { value: 'dark', label: 'Темна' },
  { value: 'auto', label: 'Авто (на вибір агента)' },
]

const STYLES = [
  { value: 'minimalist', label: 'Мінімалістичний' },
  { value: 'premium', label: 'Преміум (Awwwards-рівень)' },
]

type UploadedFile = { name: string; url: string; size: number; type: string }
type ReferenceImage = { name: string; url: string; note: string }

const LAYOUT_OPTIONS = [
  { value: 'asymmetric', label: 'Асиметричний' },
  { value: 'classic', label: 'Класичний' },
  { value: 'editorial', label: 'Журнальний' },
  { value: 'overlapping', label: 'З перекриттями' },
  { value: 'grid', label: 'Сітка' },
]

const PHOTO_OPTIONS = [
  { value: 'fullwidth', label: 'На всю ширину' },
  { value: 'framed', label: 'В рамках / rounded' },
  { value: 'overlay', label: 'З оверлеєм' },
  { value: 'parallax', label: 'Parallax' },
  { value: 'masked', label: 'Маски / clip-path' },
]

const ANIMATION_OPTIONS = [
  { value: 'minimal', label: 'Мінімальні' },
  { value: 'medium', label: 'Помірні' },
  { value: 'wow', label: 'WOW-ефекти' },
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
  const [primaryColor, setPrimaryColor] = useState('#2563eb')
  const [secondaryColor, setSecondaryColor] = useState('#f97316')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [textColor, setTextColor] = useState('#1a1a1a')
  const [designStyle, setDesignStyle] = useState('premium')
  const [companyName, setCompanyName] = useState('')
  const [companyDescription, setCompanyDescription] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [socials, setSocials] = useState('')
  const [extraWishes, setExtraWishes] = useState('')

  // Visual style tags
  const [layoutStyle, setLayoutStyle] = useState<string[]>([])
  const [photoStyle, setPhotoStyle] = useState<string[]>([])
  const [animationLevel, setAnimationLevel] = useState('medium')

  // Reference screenshots
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([])
  const [uploadingRef, setUploadingRef] = useState(false)
  const [refUrlInput, setRefUrlInput] = useState('')
  const [refUrlLoading, setRefUrlLoading] = useState(false)
  const refInputRef = useRef<HTMLInputElement>(null)

  // File uploads
  const [materialFiles, setMaterialFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [urlLoading, setUrlLoading] = useState(false)
  const matInputRef = useRef<HTMLInputElement>(null)

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

  // ── File upload ──
  const handleFileUpload = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading('materials')
    setError('')

    const formData = new FormData()
    for (const file of Array.from(files)) {
      formData.append('files', file)
    }
    formData.append('folder', 'materials')

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Помилка завантаження')
        setUploading(null)
        return
      }
      const data = await res.json()
      setMaterialFiles(prev => [...prev, ...data.files])
    } catch {
      setError('Помилка мережі при завантаженні')
    }
    setUploading(null)
  }

  const removeFile = (index: number) => {
    setMaterialFiles(prev => prev.filter((_, i) => i !== index))
  }

  // ── Upload from URL ──
  const handleUrlUpload = async () => {
    if (!urlInput.trim()) return
    setUrlLoading(true)
    setError('')

    try {
      const res = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim(), folder: 'materials' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Не вдалося завантажити')
        setUrlLoading(false)
        return
      }
      const data = await res.json()
      setMaterialFiles(prev => [...prev, data.file])
      setUrlInput('')
    } catch {
      setError('Мережева помилка')
    }
    setUrlLoading(false)
  }

  // ── Reference image upload ──
  const handleRefUpload = async (files: FileList | null) => {
    if (!files?.length) return
    setUploadingRef(true)
    setError('')

    const formData = new FormData()
    for (const file of Array.from(files)) {
      formData.append('files', file)
    }
    formData.append('folder', 'references')

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Помилка завантаження')
        setUploadingRef(false)
        return
      }
      const data = await res.json()
      setReferenceImages(prev => [
        ...prev,
        ...data.files.map((f: UploadedFile) => ({ name: f.name, url: f.url, note: '' })),
      ])
    } catch {
      setError('Помилка мережі при завантаженні')
    }
    setUploadingRef(false)
  }

  const handleRefUrlUpload = async () => {
    if (!refUrlInput.trim()) return
    setRefUrlLoading(true)
    setError('')

    try {
      const res = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: refUrlInput.trim(), folder: 'references' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Не вдалося завантажити')
        setRefUrlLoading(false)
        return
      }
      const data = await res.json()
      setReferenceImages(prev => [...prev, { name: data.file.name, url: data.file.url, note: '' }])
      setRefUrlInput('')
    } catch {
      setError('Мережева помилка')
    }
    setRefUrlLoading(false)
  }

  const updateRefNote = (index: number, note: string) => {
    setReferenceImages(prev => prev.map((r, i) => i === index ? { ...r, note } : r))
  }

  const removeRef = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index))
  }

  const toggleTag = (current: string[], value: string, setter: (v: string[]) => void) => {
    setter(current.includes(value) ? current.filter(v => v !== value) : [...current, value])
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
      if (data.bgColor) setBgColor(data.bgColor)
      if (data.textColor) setTextColor(data.textColor)
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
        primaryColor,
        secondaryColor,
        bgColor,
        textColor,
        designStyle,
        layoutStyle,
        photoStyle,
        animationLevel,
        companyName,
        companyDescription,
        phone,
        email,
        address,
        socials,
        extraWishes,
        freeDescription,
        clientMaterials: materialFiles.map(f => ({ name: f.name, url: f.url, type: f.type })),
        referenceImages: referenceImages.map(r => ({ name: r.name, url: r.url, note: r.note })),
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
      <Link href="/sites" className="text-gray-400 hover:text-gray-600 text-sm">← Назад</Link>
      <h1 className="text-xl font-bold text-gray-900 mb-1 mt-2">Новий сайт</h1>
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
          <p className="text-xs text-gray-400 -mt-2 mb-3">
            Базові кольори сайту. Агент автоматично підлаштує контрастність на різних секціях для читабельності.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Акцентний колір" hint="Кнопки, посилання, виділення">
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
            <Field label="Додатковий колір" hint="Мітки, іконки, другорядні елементи">
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
            <Field label="Колір фону" hint="Основний фон сайту">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={bgColor}
                  onChange={e => setBgColor(e.target.value)}
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={e => setBgColor(e.target.value)}
                  className="input flex-1"
                />
              </div>
            </Field>
            <Field label="Колір тексту" hint="Основний колір тексту">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={textColor}
                  onChange={e => setTextColor(e.target.value)}
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={textColor}
                  onChange={e => setTextColor(e.target.value)}
                  className="input flex-1"
                />
              </div>
            </Field>
          </div>
        </Section>

        {/* ─── 05. Візуальний стиль ─── */}
        <Section title="Візуальний стиль" num="05">
          <Field label="Лейаут" hint="Оберіть один або кілька варіантів">
            <div className="flex flex-wrap gap-2">
              {LAYOUT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleTag(layoutStyle, opt.value, setLayoutStyle)}
                  className={`tag-btn ${layoutStyle.includes(opt.value) ? 'tag-btn--active' : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Стиль фото" hint="Як показувати зображення на сайті">
            <div className="flex flex-wrap gap-2">
              {PHOTO_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleTag(photoStyle, opt.value, setPhotoStyle)}
                  className={`tag-btn ${photoStyle.includes(opt.value) ? 'tag-btn--active' : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Рівень анімацій">
            <div className="flex gap-2">
              {ANIMATION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAnimationLevel(opt.value)}
                  className={`tag-btn ${animationLevel === opt.value ? 'tag-btn--active' : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Field>
        </Section>

        {/* ─── 06. Референс-скріншоти ─── */}
        <Section title="Референс-скріншоти" num="06">
          <p className="text-xs text-gray-400 -mt-2 mb-3">
            Вставте посилання або завантажте скріншоти сайтів які подобаються. До кожного напишіть що саме взяти.
          </p>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={refUrlInput}
              onChange={e => setRefUrlInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleRefUrlUpload())}
              placeholder="Вставте посилання на зображення-референс"
              className="input flex-1"
            />
            <button
              type="button"
              onClick={handleRefUrlUpload}
              disabled={refUrlLoading || !refUrlInput.trim()}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex-shrink-0"
            >
              {refUrlLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </span>
              ) : 'Додати'}
            </button>
          </div>
          <input
            ref={refInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={e => handleRefUpload(e.target.files)}
          />
          <button
            type="button"
            onClick={() => refInputRef.current?.click()}
            disabled={uploadingRef}
            className="file-upload-btn"
          >
            {uploadingRef ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                Завантажую...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
                Додати скріншот-референс
              </span>
            )}
          </button>
          {referenceImages.length > 0 && (
            <div className="mt-4 space-y-4">
              {referenceImages.map((ref, i) => (
                <div key={i} className="flex gap-4 items-start p-3 rounded-lg border border-gray-200 bg-gray-50">
                  <div className="relative group flex-shrink-0">
                    <img src={ref.url} alt={ref.name} className="w-32 h-24 object-cover rounded-lg border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => removeRef(i)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      &times;
                    </button>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1.5">{ref.name}</p>
                    <textarea
                      value={ref.note}
                      onChange={e => updateRefNote(i, e.target.value)}
                      rows={2}
                      placeholder="Що подобається: лейаут hero, палітра кольорів, стиль карток послуг, типографіка..."
                      className="input text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ─── 07. Матеріали клієнта ─── */}
        <Section title="Матеріали клієнта" num="07">
          <p className="text-xs text-gray-400 -mt-2 mb-3">
            Логотип, фото команди, продукції — завантажте файли або вставте посилання (Freepik, Unsplash тощо).
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleUrlUpload())}
              placeholder="Вставте посилання на зображення (Freepik, Unsplash...)"
              className="input flex-1"
            />
            <button
              type="button"
              onClick={handleUrlUpload}
              disabled={urlLoading || !urlInput.trim()}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex-shrink-0"
            >
              {urlLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Завантажую...
                </span>
              ) : 'Додати'}
            </button>
          </div>
          <div className="relative flex items-center my-3">
            <div className="flex-1 border-t border-gray-200" />
            <span className="px-3 text-xs text-gray-400">або</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>
          <input
            ref={matInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.svg"
            className="hidden"
            onChange={e => handleFileUpload(e.target.files)}
          />
          <button
            type="button"
            onClick={() => matInputRef.current?.click()}
            disabled={uploading === 'materials'}
            className="file-upload-btn"
          >
            {uploading === 'materials' ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                Завантажую...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                Завантажити матеріали клієнта
              </span>
            )}
          </button>
          {materialFiles.length > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {materialFiles.map((f, i) => (
                <div key={i} className="relative group">
                  {f.type.startsWith('image/') ? (
                    <img src={f.url} alt={f.name} className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                  ) : (
                    <div className="w-full h-24 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                      <span className="text-xs text-gray-400">{f.name.split('.').pop()?.toUpperCase()}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    &times;
                  </button>
                  <p className="text-[10px] text-gray-400 mt-1 truncate">{f.name}</p>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ─── 08. Контент ─── */}
        <Section title="Контент та контакти" num="08">
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
        .file-upload-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          border: 2px dashed #d1d5db;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          color: #6b7280;
          background: #f9fafb;
          cursor: pointer;
          transition: all 0.15s;
        }
        .file-upload-btn:hover {
          border-color: #3b82f6;
          color: #3b82f6;
          background: #eff6ff;
        }
        .file-upload-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .tag-btn {
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          border: 1px solid #d1d5db;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #6b7280;
          background: white;
          cursor: pointer;
          transition: all 0.15s;
        }
        .tag-btn:hover {
          border-color: #3b82f6;
          color: #3b82f6;
        }
        .tag-btn--active {
          background: #eff6ff;
          border-color: #3b82f6;
          color: #2563eb;
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
