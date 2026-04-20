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
  const chatEndRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

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

  const sendChatMessage = async () => {
    if (!chatMessage.trim() || chatSending) return
    setChatSending(true)

    // Optimistic update
    setProject((prev: any) => ({
      ...prev,
      chat_history: [
        ...(prev.chat_history || []),
        { role: 'user', content: chatMessage, timestamp: new Date().toISOString() },
      ],
    }))

    const msg = chatMessage
    setChatMessage('')

    try {
      const res = await fetch(`/api/sites/${id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      })

      if (res.ok) {
        // Refresh project to get updated data
        await fetchProject()
        // Reload iframe
        if (iframeRef.current) {
          iframeRef.current.src = iframeRef.current.src
        }
      }
    } catch (err) {
      console.error('Chat error:', err)
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
          {project.vercel_url && (
            <a
              href={project.vercel_url}
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
        {/* Preview iframe */}
        <div className="flex-1 bg-gray-100 relative">
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
          ) : project.vercel_url ? (
            <iframe
              ref={iframeRef}
              src={project.vercel_url}
              className="w-full h-full border-none"
              title="Site preview"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              Preview буде доступний після генерації
            </div>
          )}
        </div>

        {/* Chat panel */}
        <div className="w-96 border-l border-gray-200 bg-white flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700">Чат з агентом</h2>
            <p className="text-xs text-gray-400">Описуйте правки — агент їх внесе</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {chatHistory.length === 0 && !isGenerating && project.vercel_url && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">
                  Перегляньте сайт та напишіть тут правки.
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  Наприклад: «Зміни колір кнопки на червоний»
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

          {/* Input */}
          <div className="px-4 py-3 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage() } }}
                placeholder={isGenerating ? 'Зачекайте...' : 'Опишіть правку...'}
                disabled={isGenerating || chatSending}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-50"
              />
              <button
                onClick={sendChatMessage}
                disabled={isGenerating || chatSending || !chatMessage.trim()}
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
