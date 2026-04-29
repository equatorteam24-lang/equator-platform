'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import PublishModal from './PublishModal'

const statusConfig: Record<string, { label: string; color: string }> = {
  draft:      { label: 'Чернетка',     color: 'bg-gray-100 text-gray-600' },
  generating: { label: 'Генерація...', color: 'bg-yellow-100 text-yellow-700 animate-pulse' },
  review:     { label: 'На перевірці', color: 'bg-blue-100 text-blue-700' },
  revising:   { label: 'Правки...',    color: 'bg-orange-100 text-orange-600 animate-pulse' },
  published:  { label: 'Опубліковано', color: 'bg-green-100 text-green-700' },
  archived:   { label: 'Архів',        color: 'bg-gray-100 text-gray-400' },
}

type ChatTab = 'discuss' | 'revisions'

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
  const [chatTab, setChatTab] = useState<ChatTab>('discuss')
  const [chatOpen, setChatOpen] = useState(true)
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [versions, setVersions] = useState<{ hash: string; message: string }[]>([])
  const [versionsOpen, setVersionsOpen] = useState(false)
  const [versionSaving, setVersionSaving] = useState(false)
  const [rollbackingHash, setRollbackingHash] = useState<string | null>(null)
  const [publishModalOpen, setPublishModalOpen] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const chatFileRef = useRef<HTMLInputElement>(null)

  const viewModes = {
    desktop: { width: '100%', height: '100%', icon: '\u{1F5A5}', label: 'Desktop' },
    tablet:  { width: '768px', height: '1024px', icon: '\u{1F4F1}', label: 'Tablet' },
    mobile:  { width: '375px', height: '812px', icon: '\u{1F4F1}', label: 'Mobile' },
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

  const prevStatusRef = useRef<string | null>(null)

  useEffect(() => {
    fetchProject()
    // Persistent polling — always active, checks for status transitions
    const interval = setInterval(async () => {
      const res = await fetch(`/api/sites/${id}`)
      if (!res.ok) return
      const data = await res.json()
      const prev = prevStatusRef.current
      prevStatusRef.current = data.status

      // Detect transition: revising/generating → review (work finished)
      if ((prev === 'revising' || prev === 'generating') && data.status === 'review') {
        // Update state FIRST so iframe gets the new vercel_url
        setProject(data)
        // Force iframe reload with cache-busting after React re-renders
        setTimeout(() => {
          if (iframeRef.current) {
            const base = data.vercel_url || `/api/sites/${id}/preview`
            const sep = base.includes('?') ? '&' : '?'
            iframeRef.current.src = `${base}${sep}_t=${Date.now()}`
          }
        }, 100)
        return
      }

      setProject(data)
    }, 5000)
    return () => clearInterval(interval)
  }, [id])

  // Scroll chat to bottom only when new messages arrive or tab switches
  const chatLengthRef = useRef(0)
  useEffect(() => {
    const len = project?.chat_history?.length || 0
    if (len !== chatLengthRef.current) {
      chatLengthRef.current = len
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [project?.chat_history?.length])
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatTab])

  // Fetch versions when panel opens
  useEffect(() => {
    if (versionsOpen) fetchVersions()
  }, [versionsOpen])

  // Close versions dropdown on outside click
  useEffect(() => {
    if (!versionsOpen) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-versions-panel]')) setVersionsOpen(false)
    }
    document.addEventListener('click', handleClick, { capture: true })
    return () => document.removeEventListener('click', handleClick, { capture: true })
  }, [versionsOpen])

  // Compress image client-side to stay under Vercel 4.5MB body limit
  const compressImage = (file: File, maxSizeMB = 3): Promise<File> => {
    return new Promise((resolve) => {
      // Skip non-images or already small files
      if (!file.type.startsWith('image/') || file.size <= maxSizeMB * 1024 * 1024) {
        resolve(file)
        return
      }
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        // Scale down large images (max 2000px on longest side)
        const maxDim = 2000
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height)
          width = Math.round(width * scale)
          height = Math.round(height * scale)
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }))
            } else {
              resolve(file)
            }
          },
          'image/jpeg',
          0.85
        )
      }
      img.onerror = () => resolve(file)
      img.src = URL.createObjectURL(file)
    })
  }

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
      uploadFiles(imageFiles)
    }
  }

  const handleChatFileUpload = (fileList: FileList | null) => {
    if (!fileList?.length) return
    uploadFiles(Array.from(fileList))
  }

  const uploadFiles = async (files: File[]) => {
    if (!files.length) return
    setChatUploading(true)
    try {
      // Compress images to fit Vercel 4.5MB body limit
      const compressed = await Promise.all(files.map(f => compressImage(f)))
      const formData = new FormData()
      for (const file of compressed) {
        formData.append('files', file)
      }
      formData.append('folder', 'chat')
      formData.append('projectId', id)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const text = await res.text()
      let data: any
      try { data = JSON.parse(text) } catch {
        throw new Error(`Сервер повернув не JSON (status ${res.status}): ${text.slice(0, 100)}`)
      }
      if (!res.ok) {
        throw new Error(data.error || `Помилка ${res.status}`)
      }
      if (!data.files?.length) throw new Error('Сервер не повернув файли')
      setChatAttachments(prev => [...prev, ...data.files.map((f: any) => ({ name: f.name, url: f.url }))])
    } catch (err: any) {
      console.error('Upload error:', err)
      alert(err?.message || 'Помилка завантаження файлу')
    }
    setChatUploading(false)
  }

  // Send message in discuss mode (get AI reply)
  const sendDiscussMessage = async () => {
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
          tab: 'discuss',
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
        body: JSON.stringify({ message: msg, attachments: atts, tab: 'discuss' }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.reply) {
          setProject((prev: any) => ({
            ...prev,
            chat_history: [
              ...(prev.chat_history || []),
              { role: 'assistant', content: data.reply, tab: 'discuss', timestamp: new Date().toISOString() },
            ],
          }))
        }
      }
    } catch (err) {
      console.error('Chat error:', err)
    }
    setChatSending(false)
  }

  // Send revision message (just save, no AI reply)
  const sendRevisionMessage = async () => {
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
          tab: 'revisions',
          timestamp: new Date().toISOString(),
        },
      ],
    }))

    const msg = chatMessage
    const atts = pendingAttachments
    setChatMessage('')
    setChatAttachments([])

    try {
      await fetch(`/api/sites/${id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, attachments: atts, tab: 'revisions' }),
      })
    } catch (err) {
      console.error('Revision error:', err)
    }
    setChatSending(false)
  }

  // Delete a pending revision message (by its index in the full chat_history)
  const deleteRevisionMessage = async (globalIndex: number) => {
    const updated = (project.chat_history || []).filter((_: any, i: number) => i !== globalIndex)
    setProject((prev: any) => ({ ...prev, chat_history: updated }))
    try {
      await fetch(`/api/sites/${id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteIndex: globalIndex }),
      })
    } catch (err) {
      console.error('Delete message error:', err)
    }
  }

  // Apply revisions via bridge
  const applyChanges = async () => {
    if (chatSending) return
    setChatSending(true)
    setChatTab('revisions')

    // Optimistic status message
    setProject((prev: any) => ({
      ...prev,
      chat_history: [
        ...(prev.chat_history || []),
        {
          role: 'assistant',
          content: 'Правки прийняті. Агент вносить зміни на сайт...',
          tab: 'revisions',
          source: 'status',
          timestamp: new Date().toISOString(),
        },
      ],
    }))

    try {
      const res = await fetch(`/api/sites/${id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apply: true }),
      })
      if (res.ok) {
        await fetchProject()
      }
    } catch (err) {
      console.error('Apply error:', err)
    }
    setChatSending(false)
  }

  const handleSend = () => {
    if (chatTab === 'discuss') sendDiscussMessage()
    else sendRevisionMessage()
  }

  // Versions
  const fetchVersions = async () => {
    try {
      const res = await fetch(`/api/sites/${id}/versions`)
      if (res.ok) {
        const data = await res.json()
        setVersions(data.versions || [])
      }
    } catch {}
  }

  const saveVersion = async (label?: string) => {
    setVersionSaving(true)
    try {
      const res = await fetch(`/api/sites/${id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', label }),
      })
      if (res.ok) {
        await fetchVersions()
      }
    } catch {}
    setVersionSaving(false)
  }

  const rollbackToVersion = async (hash: string) => {
    if (!confirm(`Відкатити сайт до версії ${hash}? Поточні зміни будуть збережені в історії.`)) return
    setRollbackingHash(hash)
    try {
      const res = await fetch(`/api/sites/${id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rollback', commit: hash }),
      })
      if (res.ok) {
        await fetchProject()
        await fetchVersions()
        if (iframeRef.current) {
          const base = iframeRef.current.src.split('?')[0]
          iframeRef.current.src = `${base}?_t=${Date.now()}`
        }
      }
    } catch {}
    setRollbackingHash(null)
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
  const allMessages = project.chat_history || []

  // Filter messages by current tab, preserving global index for deletion
  const tabMessages = allMessages
    .map((msg: any, i: number) => ({ ...msg, _globalIndex: i }))
    .filter((msg: any) =>
      msg.tab === chatTab || (!msg.tab && chatTab === 'discuss')
    )

  // Check if there are pending revision messages (after last bridge response)
  const revisionMessages = allMessages.filter((msg: any) => msg.tab === 'revisions')
  const hasPendingRevisions = (() => {
    let hasUserMsg = false
    for (let i = revisionMessages.length - 1; i >= 0; i--) {
      if (revisionMessages[i].role === 'assistant' && revisionMessages[i].source === 'bridge') return hasUserMsg
      if (revisionMessages[i].role === 'user') hasUserMsg = true
    }
    return hasUserMsg
  })()

  // Set of global indices for pending (deletable) revision user messages
  const pendingRevisionIndices = new Set<number>()
  if (chatTab === 'revisions' && !isGenerating) {
    for (let i = allMessages.length - 1; i >= 0; i--) {
      const m = allMessages[i]
      if (m.tab !== 'revisions') continue
      if (m.role === 'assistant' && m.source === 'bridge') break
      if (m.role === 'user') pendingRevisionIndices.add(i)
    }
  }

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
              href={project.production_url || project.vercel_url || `/api/sites/${id}/preview`}
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
          {(project.vercel_url || project.generated_code) && !isGenerating && (
            <>
              <button
                onClick={() => saveVersion()}
                disabled={versionSaving}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 disabled:opacity-50 transition flex items-center gap-1.5"
              >
                {versionSaving ? (
                  <span className="w-3.5 h-3.5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                  </svg>
                )}
                Зберегти версію
              </button>
              <div className="relative" data-versions-panel>
                <button
                  onClick={() => setVersionsOpen(!versionsOpen)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition flex items-center gap-1.5 ${
                    versionsOpen
                      ? 'border-blue-400 text-blue-600 bg-blue-50'
                      : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  Версії
                </button>
                {versionsOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">Історія версій</span>
                      <button onClick={() => setVersionsOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {versions.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-gray-400 text-center">Немає збережених версій</p>
                      ) : (
                        versions.map((v, i) => (
                          <div key={v.hash} className={`px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-gray-700 truncate">{v.message}</p>
                              <p className="text-[10px] text-gray-400 font-mono">{v.hash}</p>
                            </div>
                            {i > 0 && (
                              <button
                                onClick={() => rollbackToVersion(v.hash)}
                                disabled={rollbackingHash !== null}
                                className="ml-3 shrink-0 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:text-orange-600 hover:border-orange-300 disabled:opacity-50 transition"
                              >
                                {rollbackingHash === v.hash ? (
                                  <span className="w-3 h-3 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin inline-block" />
                                ) : (
                                  'Відкатити'
                                )}
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          {project.status === 'review' && !project.org_id && (
            <button
              onClick={() => setPublishModalOpen(true)}
              className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-green-700 transition"
            >
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
                className="transition-all duration-300 ease-in-out"
                style={{
                  width: viewModes[viewMode].width,
                  height: viewModes[viewMode].height,
                  maxWidth: '100%',
                  maxHeight: '100%',
                  boxShadow: viewMode !== 'desktop' ? '0 0 0 1px rgba(0,0,0,0.08), 0 4px 24px rgba(0,0,0,0.12)' : 'none',
                  borderRadius: viewMode !== 'desktop' ? '12px' : '0',
                  overflow: 'hidden',
                  margin: viewMode !== 'desktop' ? '16px auto' : '0',
                }}
              >
                <iframe
                  ref={iframeRef}
                  src={project.vercel_url || `/api/sites/${id}/preview`}
                  className="w-full h-full border-none bg-white"
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

        {/* Chat toggle button (when collapsed) */}
        {!chatOpen && (
          <button
            onClick={() => setChatOpen(true)}
            className="flex-shrink-0 border-l border-gray-200 bg-white hover:bg-gray-50 px-2 flex flex-col items-center justify-center gap-2 transition"
            title="Відкрити чат"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
            <span className="text-[10px] text-gray-400 [writing-mode:vertical-lr]">Чат</span>
          </button>
        )}

        {/* Chat panel */}
        <div className={`border-l border-gray-200 bg-white flex flex-col transition-all duration-200 ${chatOpen ? 'w-96' : 'w-0 overflow-hidden border-l-0'}`}>
          {/* Tab switcher */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setChatOpen(false)}
              className="px-2.5 flex items-center text-gray-300 hover:text-gray-500 transition border-r border-gray-200"
              title="Згорнути чат"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
            <button
              onClick={() => setChatTab('discuss')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition relative ${
                chatTab === 'discuss'
                  ? 'text-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                </svg>
                Обговорення
              </div>
              {chatTab === 'discuss' && (
                <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setChatTab('revisions')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition relative ${
                chatTab === 'revisions'
                  ? 'text-orange-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
                Правки
                {hasPendingRevisions && (
                  <span className="w-2 h-2 bg-orange-500 rounded-full" />
                )}
              </div>
              {chatTab === 'revisions' && (
                <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-orange-500 rounded-full" />
              )}
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {tabMessages.length === 0 && !isGenerating && (project.vercel_url || project.generated_code) && (
              <div className="text-center py-8">
                {chatTab === 'discuss' ? (
                  <>
                    <p className="text-sm text-gray-400">
                      Запитайте пораду щодо дизайну, кольорів чи структури.
                    </p>
                    <p className="text-xs text-gray-300 mt-1">
                      Наприклад: «Який колір краще для кнопки?»
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-400">
                      Напишіть конкретні правки для сайту.
                    </p>
                    <p className="text-xs text-gray-300 mt-1">
                      Наприклад: «Змінити колір кнопки на #FF5500»
                    </p>
                  </>
                )}
              </div>
            )}

            {tabMessages.map((msg: any, i: number) => {
              // Status messages (progress indicators)
              if (msg.source === 'status') {
                return (
                  <div key={i} className="flex justify-center">
                    <div className="flex items-center gap-2 rounded-full bg-orange-50 border border-orange-200 px-4 py-1.5 text-xs text-orange-600">
                      {isGenerating && (
                        <span className="w-3 h-3 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
                      )}
                      {!isGenerating && (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      )}
                      {msg.content}
                    </div>
                  </div>
                )
              }

              // Bridge result messages
              if (msg.source === 'bridge') {
                return (
                  <div key={i} className="flex justify-center">
                    <div className="max-w-[90%] rounded-xl bg-green-50 border border-green-200 px-4 py-2.5 text-sm">
                      <div className="flex items-center gap-1.5 mb-1">
                        <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        <span className="text-[10px] font-semibold text-green-600">Правки застосовано</span>
                      </div>
                      <p className="whitespace-pre-wrap text-gray-600">{msg.content}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              }

              // Regular user/assistant messages
              const isDeletable = pendingRevisionIndices.has(msg._globalIndex)
              return (
                <div key={i} className={`group/msg flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {isDeletable && (
                    <button
                      onClick={() => deleteRevisionMessage(msg._globalIndex)}
                      className="self-center mr-1.5 opacity-0 group-hover/msg:opacity-100 transition-opacity p-1 rounded-full hover:bg-red-100 text-gray-300 hover:text-red-500"
                      title="Видалити"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  )}
                  <div
                    className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${
                      msg.role === 'user'
                        ? msg.tab === 'revisions'
                          ? 'bg-orange-500 text-white'
                          : 'bg-blue-600 text-white'
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
                    <p className={`text-[10px] mt-1 ${
                      msg.role === 'user'
                        ? msg.tab === 'revisions' ? 'text-orange-200' : 'text-blue-200'
                        : 'text-gray-400'
                    }`}>
                      {new Date(msg.timestamp).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })}

            {chatSending && chatTab === 'discuss' && (
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

          {/* Apply changes button (only in revisions tab) */}
          {chatTab === 'revisions' && hasPendingRevisions && !isGenerating && (
            <div className="px-4 py-2 border-t border-gray-200 bg-orange-50">
              <button
                onClick={applyChanges}
                disabled={chatSending}
                className="w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
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
            <div className="flex gap-2 items-end">
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
                className="rounded-lg border border-gray-300 px-2.5 py-2 text-gray-400 hover:text-blue-600 hover:border-blue-400 disabled:opacity-50 transition shrink-0"
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
              <textarea
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                onPaste={handlePaste}
                rows={3}
                placeholder={
                  isGenerating
                    ? 'Зачекайте...'
                    : chatTab === 'discuss'
                      ? 'Запитайте щось...'
                      : 'Опишіть правку...'
                }
                disabled={isGenerating || chatSending}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-50 resize-none"
              />
              <button
                onClick={handleSend}
                disabled={isGenerating || chatSending || (!chatMessage.trim() && !chatAttachments.length)}
                className={`rounded-lg px-3 py-2 text-white text-sm font-medium disabled:opacity-50 transition shrink-0 ${
                  chatTab === 'revisions'
                    ? 'bg-orange-500 hover:bg-orange-600'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      </div>

      <PublishModal
        projectId={id}
        open={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        onPublished={() => {
          fetchProject()
        }}
      />
    </div>
  )
}
