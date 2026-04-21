'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const statusConfig: Record<string, { label: string; color: string }> = {
  draft:      { label: 'Чернетка',     color: 'bg-gray-100 text-gray-600' },
  generating: { label: 'Генерація...', color: 'bg-yellow-100 text-yellow-700 animate-pulse' },
  review:     { label: 'На перевірці', color: 'bg-blue-100 text-blue-700' },
  revising:   { label: 'Правки...',    color: 'bg-orange-100 text-orange-600 animate-pulse' },
  published:  { label: 'Опубліковано', color: 'bg-green-100 text-green-700' },
  archived:   { label: 'Архів',        color: 'bg-gray-100 text-gray-400' },
}

export default function SiteProjectPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [chatMessage, setChatMessage] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const [chatAttachments, setChatAttachments] = useState<{ name: string; url: string }[]>([])
  const [chatUploading, setChatUploading] = useState(false)
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const chatEndRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const chatFileRef = useRef<HTMLInputElement>(null)

  const viewModes = {
    desktop: { width: '100%', icon: '\u{1F5A5}', label: 'Desktop' },
    tablet:  { width: '768px', icon: '\u{1F4F1}', label: 'Tablet' },
    mobile:  { width: '375px', icon: '\u{1F4F1}', label: 'Mobile' },
  } as const

  // Fetch project data
  const fetchProject = async () => {
    const res = await fetch(`/api/sites/${id}`)
    if (res.ok) {
      const data = await res.json()
      setProject(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProject()
    // Poll for status updates during generation
    const interval = setInterval(async () => {
      const res = await fetch(`/api/sites/${id}`)
      if (res.ok) {
        const data = await res.json()
        setProject(data)
        if (data.status !== 'generating' && data.status !== 'revising') {
          clearInterval(interval)
        }
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [id])

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [project?.chat_history])

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    const imageFiles: File[] = []
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) imageFiles.push(file)
      }
    }
    if (imageFiles.length) {
      e.preventDefault()
      const dt = new DataTransfer()
      imageFiles.forEach(f => dt.items.add(f))
      handleChatFileUpload(dt.files)
    }
  }

  const handleChatFileUpload = async (files: FileList | null) => {
    if (!files?.length) return
    setChatUploading(true)
    const formData = new FormData()
    for (const file of Array.from(files)) {
      formData.append('files', file)
    }
    formData.append('folder', 'chat')
    formData.append('projectId', id)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        setChatAttachments(prev => [...prev, ...data.files.map((f: any) => ({ name: f.name, url: f.url }))])
      }
    } catch {}
    setChatUploading(false)
  }

  // Send message and get AI reply
  const sendChatMessage = async () => {
    if ((!chatMessage.trim() && !chatAttachments.length) || chatSending) return
    setChatSending(true)

    const pendingAttachments = chatAttachments.length ? [...chatAttachments] : undefined
    setProject((prev: any) => ({
      ...prev,
      chat_history: [
        ...(prev.chat_history || []),
        {
          role: 'user',
          content: chatMessage,
          attachments: pendingAttachments,
          timestamp: new Date().toISOString(),
        },
      ],
    }))

    const msg = chatMessage
    const atts = pendingAttachments
    setChatMessage('')
    setChatAttachments([])

    try {
      const res = await fetch(`/api/sites/${id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, attachments: atts }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.reply) {
          setProject((prev: any) => ({
            ...prev,
            chat_history: [
              ...(prev.chat_history || []),
              { role: 'assistant', content: data.reply, timestamp: new Date().toISOString() },
            ],
          }))
        }
      }
    } catch (err) {
      console.error('Chat error:', err)
    }
    setChatSending(false)
  }

  // Send all accumulated messages to bridge for applying
  const applyChanges = async () => {
    if (chatSending) return
    setChatSending(true)
    try {
      const res = await fetch(`/api/sites/${id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apply: true }),
      })
      if (res.ok) {
        await fetchProject()
        if (iframeRef.current) {
          iframeRef.current.src = iframeRef.current.src
        }
      }
    } catch (err) {
      console.error('Apply error:', err)
    }
    setChatSending(false)
  }

  const handleArchive = async () => {
    await fetch(`/api/sites/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'archived' }),
    })
    router.push('/sites')
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="h-96 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Проект не знайдено</p>
        <Link href="/sites" className="text-blue-600 hover:underline text-sm mt-2 block">
          ← Назад до списку
        </Link>
      </div>
    )
  }

  const status = statusConfig[project.status] ?? statusConfig.draft
  const isGenerating = project.status === 'generating' || project.status === 'revising'
  const chatHistory = project.chat_history || []

  // Check if there are user messages after the last bridge response
  const hasUnprocessedMessages = (() => {
    let hasUserMsg = false
    for (let i = chatHistory.length - 1; i >= 0; i--) {
      if (chatHistory[i].role === 'assistant' && chatHistory[i].source === 'bridge') return hasUserMsg
      if (chatHistory[i].role === 'user') hasUserMsg = true
    }
    return hasUserMsg
  })()

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-4">
          <Link href="/sites" className="text-gray-400 hover:text-gray-600">
            ←
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{project.name}</h1>
            <p className="text-xs text-gray-400">{project.form_data?.companyName}</p>
          </div>
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {(project.vercel_url || project.generated_code) && (
            <a
              href={project.vercel_url || `/api/sites/${id}/preview`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:border-gray-400 transition"
            >
              Відкрити сайт ↗
            </a>
          )}
          {project.org_id && (
            <Link
              href={`/organizations/${project.org_id}`}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:border-gray-400 transition"
            >
              Адмінка клієнта
            </Link>
          )}
          {project.status === 'review' && (
            <button className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-green-700 transition">
              Опублікувати
            </button>
          )}
          <button
            onClick={handleArchive}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-400 hover:text-red-500 hover:border-red-300 transition"
          >
            Архівувати
          </button>
        </div>
      </div>

      {/* Main content: Preview + Chat */}
      <div className="flex-1 flex overflow-hidden">
        {/* Preview area */}
        <div className="flex-1 flex flex-col bg-gray-100">
          {/* Device toolbar */}
          {!isGenerating && (project.vercel_url || project.generated_code) && (
            <div className="flex items-center justify-center gap-1 px-4 py-2 bg-white border-b border-gray-200">
              {(Object.keys(viewModes) as Array<keyof typeof viewModes>).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                    viewMode === mode
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}
                  title={viewModes[mode].label}
                >
                  {mode === 'desktop' ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25Z" />
                    </svg>
                  ) : mode === 'tablet' ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V4.5a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 4.5v15a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                    </svg>
                  )}
                  {viewModes[mode].label}
                </button>
              ))}
            </div>
          )}

          {/* Preview iframe */}
          <div className="flex-1 relative overflow-hidden flex items-start justify-center">
            {isGenerating ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">
                    {project.status === 'generating' ? 'Агент верстає сайт...' : 'Вносяться правки...'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Орієнтовно 5–15 хвилин. Сторінка оновиться автоматично.
                  </p>
                </div>
              </div>
            ) : project.vercel_url || project.generated_code ? (
              <div
                className="h-full transition-all duration-300 ease-in-out"
                style={{
                  width: viewModes[viewMode].width,
                  maxWidth: '100%',
                  boxShadow: viewMode !== 'desktop' ? '0 0 0 1px rgba(0,0,0,0.08), 0 4px 24px rgba(0,0,0,0.12)' : 'none',
                  borderRadius: viewMode !== 'desktop' ? '12px' : '0',
                  overflow: 'hidden',
                  margin: viewMode !== 'desktop' ? '16px auto' : '0',
                }}
              >
                <iframe
                  ref={iframeRef}
                  src={project.vercel_url || `/api/sites/${id}/preview`}
                  className="w-full border-none bg-white"
                  style={{ height: viewMode !== 'desktop' ? 'calc(100% - 0px)' : '100%' }}
                  title="Site preview"
                />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                Preview буде доступний після генерації
              </div>
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div className="w-96 border-l border-gray-200 bg-white flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700">Чат з агентом</h2>
            <p className="text-xs text-gray-400">Опишіть правки, потім натисніть «Внести правки»</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {chatHistory.length === 0 && !isGenerating && (project.vercel_url || project.generated_code) && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">
                  Напишіть одне або декілька повідомлень з правками.
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  Коли будете готові — натисніть «Внести правки»
                </p>
              </div>
            )}

            {chatHistory.map((msg: any, i: number) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.attachments?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {msg.attachments.map((att: any, j: number) => (
                        <a key={j} href={att.url} target="_blank" rel="noopener noreferrer">
                          <img src={att.url} alt={att.name} className="w-16 h-16 object-cover rounded-md border border-white/20" />
                        </a>
                      ))}
                    </div>
                  )}
                  <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {chatSending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Apply changes button */}
          {hasUnprocessedMessages && !isGenerating && (
            <div className="px-4 py-2 border-t border-gray-200 bg-orange-50">
              <button
                onClick={applyChanges}
                disabled={chatSending}
                className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.15-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12" />
                </svg>
                Внести правки
              </button>
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 border-t border-gray-200">
            {chatAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {chatAttachments.map((att, i) => (
                  <div key={i} className="relative group">
                    <img src={att.url} alt={att.name} className="w-12 h-12 object-cover rounded-lg border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => setChatAttachments(prev => prev.filter((_, j) => j !== i))}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={chatFileRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={e => { handleChatFileUpload(e.target.files); e.target.value = '' }}
              />
              <button
                type="button"
                onClick={() => chatFileRef.current?.click()}
                disabled={isGenerating || chatSending || chatUploading}
                className="rounded-lg border border-gray-300 px-2.5 py-2 text-gray-400 hover:text-blue-600 hover:border-blue-400 disabled:opacity-50 transition"
                title="Прикріпити зображення"
              >
                {chatUploading ? (
                  <span className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin block" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                  </svg>
                )}
              </button>
              <input
                type="text"
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage() } }}
                onPaste={handlePaste}
                placeholder={isGenerating ? 'Зачекайте...' : 'Опишіть правку...'}
                disabled={isGenerating || chatSending}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-50"
              />
              <button
                onClick={sendChatMessage}
                disabled={isGenerating || chatSending || (!chatMessage.trim() && !chatAttachments.length)}
                className="rounded-lg bg-blue-600 px-3 py-2 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
