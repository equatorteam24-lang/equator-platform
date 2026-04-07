'use client'

import { useState } from 'react'
import ImageUpload from '@/components/admin/ImageUpload'
import type { SiteContent, ServiceItem, ProcessStep, TrustItem, PartnerItem } from '@/lib/content'

const TABS = [
  { id: 'hero',     label: 'Герой' },
  { id: 'services', label: 'Послуги' },
  { id: 'about',    label: 'Напрямок' },
  { id: 'process',  label: 'Робота' },
  { id: 'gallery',  label: 'Галерея' },
  { id: 'trust',    label: 'Довіра' },
  { id: 'partners', label: 'Партнери' },
  { id: 'cta',      label: 'CTA' },
  { id: 'contacts', label: 'Контакти' },
] as const

type TabId = typeof TABS[number]['id']

interface Props { initialContent: SiteContent }

export default function ContentEditor({ initialContent }: Props) {
  const [tab, setTab]       = useState<TabId>('hero')
  const [data, setData]     = useState<SiteContent>(initialContent)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState<string | null>(null)

  function patch<K extends keyof SiteContent>(section: K, value: SiteContent[K]) {
    setData(prev => ({ ...prev, [section]: value }))
  }

  async function save(section: TabId) {
    setSaving(true)
    const res = await fetch('/api/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section, content: data[section] }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(section)
      setTimeout(() => setSaved(null), 2000)
    } else {
      alert('Помилка збереження')
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Редактор контенту</h1>
        {saved && <span className="text-sm text-green-600 font-medium">Збережено ✓</span>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-gray-200 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── HERO ─── */}
      {tab === 'hero' && (
        <Section onSave={() => save('hero')} saving={saving}>
          <Field label="Заголовок">
            <input className={input} value={data.hero.title}
              onChange={e => patch('hero', { ...data.hero, title: e.target.value })} />
          </Field>
          <Field label="Підзаголовок">
            <textarea className={`${input} h-24 resize-none`} value={data.hero.subtitle}
              onChange={e => patch('hero', { ...data.hero, subtitle: e.target.value })} />
          </Field>
          <Field label="Фонове фото">
            <ImageUpload value={data.hero.bgImage}
              onChange={v => patch('hero', { ...data.hero, bgImage: v })} />
          </Field>
        </Section>
      )}

      {/* ─── SERVICES ─── */}
      {tab === 'services' && (
        <Section onSave={() => save('services')} saving={saving}>
          <Field label="Заголовок секції">
            <input className={input} value={data.services.heading}
              onChange={e => patch('services', { ...data.services, heading: e.target.value })} />
          </Field>
          <Field label="Опис">
            <textarea className={`${input} h-20 resize-none`} value={data.services.description}
              onChange={e => patch('services', { ...data.services, description: e.target.value })} />
          </Field>
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-500 mb-3">Послуги</label>
            <div className="space-y-4">
              {data.services.items.map((item, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Послуга {i + 1}</span>
                    <button onClick={() => patch('services', { ...data.services, items: data.services.items.filter((_, j) => j !== i) })}
                      className="text-xs text-red-500 hover:text-red-700">Видалити</button>
                  </div>
                  <input className={input} placeholder="Назва" value={item.title}
                    onChange={e => patchServiceItem(i, { ...item, title: e.target.value })} />
                  <input className={input} placeholder="Ціна (напр. від 2000 грн/м²)" value={item.price}
                    onChange={e => patchServiceItem(i, { ...item, price: e.target.value })} />
                  <ImageUpload value={item.image} onChange={v => patchServiceItem(i, { ...item, image: v })} label="Фото послуги" />
                </div>
              ))}
              <button onClick={() => patch('services', { ...data.services, items: [...data.services.items, { title: '', price: '', image: '' }] })}
                className="w-full rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition">
                + Додати послугу
              </button>
            </div>
          </div>
        </Section>
      )}

      {/* ─── ABOUT ─── */}
      {tab === 'about' && (
        <Section onSave={() => save('about')} saving={saving}>
          <Field label="Заголовок (Основний напрямок)">
            <input className={input} value={data.about.heading}
              onChange={e => patch('about', { ...data.about, heading: e.target.value })} />
          </Field>
          <Field label="Вступний текст">
            <textarea className={`${input} h-20 resize-none`} value={data.about.intro}
              onChange={e => patch('about', { ...data.about, intro: e.target.value })} />
          </Field>
          <Field label="Підзаголовок (Фальцева покрівля)">
            <input className={input} value={data.about.subheading}
              onChange={e => patch('about', { ...data.about, subheading: e.target.value })} />
          </Field>
          <Field label="Опис">
            <textarea className={`${input} h-24 resize-none`} value={data.about.description}
              onChange={e => patch('about', { ...data.about, description: e.target.value })} />
          </Field>
          <Field label="Фото секції">
            <ImageUpload value={data.about.photo} onChange={v => patch('about', { ...data.about, photo: v })} />
          </Field>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Чекліст переваг</label>
            <div className="space-y-2">
              {data.about.checklist.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input className={`${input} flex-1`} value={item}
                    onChange={e => patch('about', { ...data.about, checklist: data.about.checklist.map((c, j) => j === i ? e.target.value : c) })} />
                  <button onClick={() => patch('about', { ...data.about, checklist: data.about.checklist.filter((_, j) => j !== i) })}
                    className="text-red-500 px-2 hover:text-red-700">✕</button>
                </div>
              ))}
              <button onClick={() => patch('about', { ...data.about, checklist: [...data.about.checklist, ''] })}
                className="text-sm text-blue-600 hover:underline">+ Додати пункт</button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-3 mt-4">Картки переваг</label>
            <div className="space-y-3">
              {data.about.features.map((f, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
                  <input className={input} placeholder="Назва" value={f.title}
                    onChange={e => patch('about', { ...data.about, features: data.about.features.map((x, j) => j === i ? { ...x, title: e.target.value } : x) })} />
                  <textarea className={`${input} h-16 resize-none`} placeholder="Опис" value={f.desc}
                    onChange={e => patch('about', { ...data.about, features: data.about.features.map((x, j) => j === i ? { ...x, desc: e.target.value } : x) })} />
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* ─── PROCESS ─── */}
      {tab === 'process' && (
        <Section onSave={() => save('process')} saving={saving}>
          <Field label="Фото-банер секції">
            <ImageUpload value={data.process.heroImage} onChange={v => patch('process', { ...data.process, heroImage: v })} />
          </Field>
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-500 mb-3">Етапи роботи</label>
            <div className="space-y-3">
              {data.process.steps.map((step, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Етап {i + 1}</span>
                    <button onClick={() => patch('process', { ...data.process, steps: data.process.steps.filter((_, j) => j !== i) })}
                      className="text-xs text-red-500 hover:text-red-700">Видалити</button>
                  </div>
                  <input className={input} placeholder="Назва" value={step.title}
                    onChange={e => patchProcessStep(i, { ...step, title: e.target.value })} />
                  <textarea className={`${input} h-16 resize-none`} placeholder="Опис" value={step.desc}
                    onChange={e => patchProcessStep(i, { ...step, desc: e.target.value })} />
                </div>
              ))}
              <button onClick={() => patch('process', { ...data.process, steps: [...data.process.steps, { title: '', desc: '' }] })}
                className="w-full rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition">
                + Додати етап
              </button>
            </div>
          </div>
        </Section>
      )}

      {/* ─── GALLERY ─── */}
      {tab === 'gallery' && (
        <Section onSave={() => save('gallery')} saving={saving}>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-3">Фото галереї</label>
            <div className="grid grid-cols-2 gap-4">
              {data.gallery.photos.map((photo, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Фото {i + 1}</span>
                    <button onClick={() => patch('gallery', { photos: data.gallery.photos.filter((_, j) => j !== i) })}
                      className="text-xs text-red-500 hover:text-red-700">Видалити</button>
                  </div>
                  <ImageUpload value={photo}
                    onChange={v => patch('gallery', { photos: data.gallery.photos.map((p, j) => j === i ? v : p) })} />
                </div>
              ))}
            </div>
            <button onClick={() => patch('gallery', { photos: [...data.gallery.photos, ''] })}
              className="mt-4 w-full rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition">
              + Додати фото
            </button>
          </div>
        </Section>
      )}

      {/* ─── TRUST ─── */}
      {tab === 'trust' && (
        <Section onSave={() => save('trust')} saving={saving}>
          <Field label="Фото секції 'Чому нам довіряють'">
            <ImageUpload value={data.trust.photo} onChange={v => patch('trust', { ...data.trust, photo: v })} />
          </Field>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-3">Картки переваг (5 штук)</label>
            <div className="space-y-2">
              {data.trust.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 border border-gray-200 rounded-lg p-3">
                  <input className={`${input} flex-1`} value={item.label}
                    onChange={e => patch('trust', { ...data.trust, items: data.trust.items.map((x, j) => j === i ? { ...x, label: e.target.value } : x) })} />
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 whitespace-nowrap cursor-pointer">
                    <input type="checkbox" checked={item.active}
                      onChange={e => patch('trust', { ...data.trust, items: data.trust.items.map((x, j) => j === i ? { ...x, active: e.target.checked } : x) })}
                      className="rounded" />
                    Виділити
                  </label>
                </div>
              ))}
            </div>
          </div>
          <Field label="Фото 'Про компанію'">
            <ImageUpload value={data.trust.aboutPhoto} onChange={v => patch('trust', { ...data.trust, aboutPhoto: v })} />
          </Field>
          <Field label="Текст про компанію (1)">
            <textarea className={`${input} h-24 resize-none`} value={data.trust.aboutText1}
              onChange={e => patch('trust', { ...data.trust, aboutText1: e.target.value })} />
          </Field>
          <Field label="Текст про компанію (2)">
            <textarea className={`${input} h-24 resize-none`} value={data.trust.aboutText2}
              onChange={e => patch('trust', { ...data.trust, aboutText2: e.target.value })} />
          </Field>
        </Section>
      )}

      {/* ─── PARTNERS ─── */}
      {tab === 'partners' && (
        <Section onSave={() => save('partners')} saving={saving}>
          <label className="block text-xs font-medium text-gray-500 mb-3">Логотипи партнерів</label>
          <div className="space-y-4">
            {data.partners.map((p, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Партнер {i + 1}</span>
                  <button onClick={() => patch('partners', data.partners.filter((_, j) => j !== i))}
                    className="text-xs text-red-500 hover:text-red-700">Видалити</button>
                </div>
                <ImageUpload value={p.img} onChange={v => patch('partners', data.partners.map((x, j) => j === i ? { ...x, img: v } : x))} label="Логотип" />
                <Field label="Фон (Tailwind клас, напр. bg-white або bg-[#090909])">
                  <input className={input} value={p.bg}
                    onChange={e => patch('partners', data.partners.map((x, j) => j === i ? { ...x, bg: e.target.value } : x))} />
                </Field>
              </div>
            ))}
            <button onClick={() => patch('partners', [...data.partners, { img: '', bg: 'bg-white' }])}
              className="w-full rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition">
              + Додати партнера
            </button>
          </div>
        </Section>
      )}

      {/* ─── CTA ─── */}
      {tab === 'cta' && (
        <Section onSave={() => save('cta')} saving={saving}>
          <Field label="Заголовок">
            <input className={input} value={data.cta.title}
              onChange={e => patch('cta', { ...data.cta, title: e.target.value })} />
          </Field>
          <Field label="Текст">
            <textarea className={`${input} h-20 resize-none`} value={data.cta.text}
              onChange={e => patch('cta', { ...data.cta, text: e.target.value })} />
          </Field>
          <Field label="Фонове зображення">
            <ImageUpload value={data.cta.bgImage} onChange={v => patch('cta', { ...data.cta, bgImage: v })} />
          </Field>
        </Section>
      )}

      {/* ─── CONTACTS ─── */}
      {tab === 'contacts' && (
        <Section onSave={() => save('contacts')} saving={saving}>
          <Field label="Телефон">
            <input className={input} value={data.contacts.phone}
              onChange={e => patch('contacts', { ...data.contacts, phone: e.target.value })} />
          </Field>
          <Field label="Email">
            <input className={input} type="email" value={data.contacts.email}
              onChange={e => patch('contacts', { ...data.contacts, email: e.target.value })} />
          </Field>
          <Field label="Адреса">
            <input className={input} value={data.contacts.address}
              onChange={e => patch('contacts', { ...data.contacts, address: e.target.value })} />
          </Field>
          <Field label="Текст для військових">
            <textarea className={`${input} h-20 resize-none`} value={data.contacts.military}
              onChange={e => patch('contacts', { ...data.contacts, military: e.target.value })} />
          </Field>
        </Section>
      )}
    </div>
  )

  // Helper: patch a nested list item
  function patchServiceItem(index: number, value: ServiceItem) {
    const items = data.services.items.map((x, j) => j === index ? value : x)
    patch('services', { ...data.services, items })
  }
  function patchProcessStep(index: number, value: ProcessStep) {
    const steps = data.process.steps.map((x, j) => j === index ? value : x)
    patch('process', { ...data.process, steps })
  }
}

// ─── Small helpers ────────────────────────────────────────────────────────────

const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  )
}

function Section({ children, onSave, saving }: { children: React.ReactNode; onSave: () => void; saving: boolean }) {
  return (
    <div className="space-y-5">
      {children}
      <div className="pt-4 border-t border-gray-100 flex justify-end">
        <button onClick={onSave} disabled={saving}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition">
          {saving ? 'Збереження...' : 'Зберегти'}
        </button>
      </div>
    </div>
  )
}
