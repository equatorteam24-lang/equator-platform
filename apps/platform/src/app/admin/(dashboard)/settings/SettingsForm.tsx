'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/client'
import { useRouter } from 'next/navigation'
import type { Organization, OrganizationSettings, ScriptFile } from '@uniframe/db/types'

export default function SettingsForm({ org }: { org: Organization }) {
  const router = useRouter()
  const [settings, setSettings] = useState<OrganizationSettings>(org.settings ?? {})
  const [name, setName] = useState(org.name)
  const [domain, setDomain] = useState(org.domain ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function updateSetting<K extends keyof OrganizationSettings>(key: K, value: OrganizationSettings[K]) {
    setSettings(s => ({ ...s, [key]: value }))
  }

  async function uploadScriptFile(file: File, position: 'head' | 'body') {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      const ext = file.name.split('.').pop()?.toLowerCase()
      const type: ScriptFile['type'] = ext === 'css' ? 'css' : 'js'
      const newFile: ScriptFile = { url, name: file.name, type, position }
      updateSetting('custom_script_files', [...(settings.custom_script_files ?? []), newFile])
    } catch (e) {
      alert('Помилка завантаження файлу: ' + (e instanceof Error ? e.message : 'невідома помилка'))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function removeScriptFile(index: number) {
    const files = [...(settings.custom_script_files ?? [])]
    files.splice(index, 1)
    updateSetting('custom_script_files', files)
  }

  async function save() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('organizations').update({
      name,
      domain: domain || null,
      settings,
    }).eq('id', org.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <Section title="Загальне">
        <Field label="Назва сайту">
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
        </Field>
        <Field label="Домен">
          <input value={domain} onChange={e => setDomain(e.target.value)}
            placeholder="example.com"
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
        </Field>
        <Field label="Email для зв'язку">
          <input type="email" value={settings.contact_email ?? ''} onChange={e => updateSetting('contact_email', e.target.value)}
            placeholder="info@example.com"
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
        </Field>
      </Section>

      <Section title="Сповіщення про заявки">
        <Field label="Email для отримання заявок" hint="На цей email будуть надходити нові заявки">
          <input type="email" value={settings.notification_email ?? ''} onChange={e => updateSetting('notification_email', e.target.value)}
            placeholder="leads@example.com"
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
        </Field>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Telegram Chat ID</label>
          <input value={settings.telegram_chat_id ?? ''} onChange={e => updateSetting('telegram_chat_id', e.target.value)}
            placeholder="-100123456789"
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          <div className="mt-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5 text-xs text-blue-700 space-y-1">
            <p className="font-semibold">Як отримати Chat ID:</p>
            <p>1. Відкрийте Telegram та напишіть <span className="font-mono font-semibold">/start</span> боту <a href="https://t.me/LeadFromWebsiteBot" target="_blank" rel="noopener noreferrer" className="underline font-semibold">@LeadFromWebsiteBot</a></p>
            <p>2. Бот надішле ваш Chat ID — скопіюйте та вставте сюди</p>
          </div>
        </div>
      </Section>

      <Section title="Аналітика та пікселі">
        <Field label="Google Analytics ID" hint="Формат: G-XXXXXXXXXX або UA-XXXXXXXXX">
          <input value={settings.google_analytics_id ?? ''} onChange={e => updateSetting('google_analytics_id', e.target.value)}
            placeholder="G-XXXXXXXXXX"
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
        </Field>
        <Field label="Meta (Facebook) Pixel ID" hint="Тільки числовий ID пікселя, наприклад: 1234567890123456">
          <input value={settings.meta_pixel_id ?? ''} onChange={e => updateSetting('meta_pixel_id', e.target.value)}
            placeholder="1234567890123456"
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
        </Field>
      </Section>

      <Section title="Кастомні скрипти">
        <Field
          label="Скрипти в <head>"
          hint="Google Tag Manager, Hotjar, TikTok Pixel тощо. Вставте повний код скрипта.">
          <textarea
            value={settings.custom_head_scripts ?? ''}
            onChange={e => updateSetting('custom_head_scripts', e.target.value)}
            rows={5}
            placeholder={'<!-- Google Tag Manager -->\n<script>...</script>'}
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
          />
        </Field>
        <Field
          label="Скрипти перед </body>"
          hint="Для скриптів що повинні завантажуватись в кінці сторінки">
          <textarea
            value={settings.custom_body_scripts ?? ''}
            onChange={e => updateSetting('custom_body_scripts', e.target.value)}
            rows={4}
            placeholder={'<script>...</script>'}
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
          />
        </Field>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Файли скриптів</label>
          <p className="text-xs text-gray-400 mb-3">Завантажте .js або .css файли. Вони будуть підключені до сайту.</p>

          {(settings.custom_script_files ?? []).length > 0 && (
            <div className="space-y-2 mb-3">
              {(settings.custom_script_files ?? []).map((file, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5">
                  <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                    file.type === 'css' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {file.type}
                  </span>
                  <span className="text-sm text-gray-700 truncate flex-1">{file.name}</span>
                  <span className="text-xs text-gray-400">
                    {file.position === 'head' ? '<head>' : '<body>'}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeScriptFile(i)}
                    className="text-gray-400 hover:text-red-500 transition text-sm"
                    title="Видалити"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".js,.css"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) uploadScriptFile(file, 'head')
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
            >
              {uploading ? 'Завантаження...' : '+ Додати файл в <head>'}
            </button>
            <button
              type="button"
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = '.js,.css'
                input.onchange = () => {
                  const file = input.files?.[0]
                  if (file) uploadScriptFile(file, 'body')
                }
                input.click()
              }}
              disabled={uploading}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
            >
              {uploading ? 'Завантаження...' : '+ Додати файл в <body>'}
            </button>
          </div>
        </div>
      </Section>

      <div className="flex items-center gap-4 pt-2">
        <button onClick={save} disabled={saving}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition">
          {saving ? 'Збереження...' : 'Зберегти налаштування'}
        </button>
        {saved && <span className="text-sm text-green-600">Збережено ✓</span>}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}
