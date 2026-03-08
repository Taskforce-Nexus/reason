'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { createClient } from '@/lib/supabase/client'
import VoiceModePanel from './VoiceModePanel'
import type { Project, Conversation, Message } from '@/lib/types'

interface UploadedFile {
  name: string
  size: string
  content: string
}

interface Props {
  project: Project
  conversation: Conversation | null
  userEmail: string
}

const TOPICS = [
  'Descripción del problema',
  'Perfil del fundador',
  'Recursos disponibles',
]

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function IncubadoraChat({ project, conversation, userEmail }: Props) {
  const [messages, setMessages] = useState<Message[]>(conversation?.messages ?? [])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [pendingContext, setPendingContext] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [voiceUnavailable, setVoiceUnavailable] = useState(false)
  const [voiceMode, setVoiceMode] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const supabase = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (messages.length === 0) sendInitialMessage()
  }, [])

  const userMsgCount = messages.filter(m => m.role === 'user').length
  const coveredTopics = TOPICS.map((_, i) => i < Math.floor(userMsgCount / 2))

  async function sendInitialMessage() {
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          conversationId: conversation?.id,
          messages: [],
          phase: 'semilla',
        }),
      })
      const data = await res.json()
      if (data.message) {
        setMessages([{ role: 'assistant', content: data.message, author: 'Nexo' }])
      }
    } catch {}
    setLoading(false)
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    const apiMessages = pendingContext
      ? newMessages.map((m, i) =>
          i === newMessages.length - 1 && m.role === 'user'
            ? { ...m, content: `[Contexto de archivo cargado]\n${pendingContext}\n\n[Mensaje del fundador]\n${m.content}` }
            : m
        )
      : newMessages

    if (pendingContext) setPendingContext('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          conversationId: conversation?.id,
          messages: apiMessages,
          phase: 'semilla',
        }),
      })
      const data = await res.json()
      if (data.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message, author: 'Nexo' }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error al conectar con Nexo. Intenta de nuevo.', author: 'Nexo' }])
    }
    setLoading(false)
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    let content = ''
    if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
      content = await file.text()
    } else if (file.name.endsWith('.pdf')) {
      content = `[PDF cargado: ${file.name} — texto no extraíble en browser]`
    }

    const path = `${project.id}/${file.name}`
    const { error } = await supabase.storage.from('project-files').upload(path, file, { upsert: true })
    if (error) console.error('[upload]', error.message)

    setUploadedFiles(prev => [...prev, { name: file.name, size: formatBytes(file.size), content }])
    if (content) setPendingContext(prev => prev ? `${prev}\n\n${content}` : content)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function toggleVoice() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognitionAPI) {
      setVoiceUnavailable(true)
      setTimeout(() => setVoiceUnavailable(false), 3000)
      return
    }
    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
      return
    }
    const recognition = new SpeechRecognitionAPI()
    recognition.lang = 'es-ES'
    recognition.continuous = true
    recognition.interimResults = true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((r: any) => r[0].transcript)
        .join('')
      setInput(transcript)
    }
    recognition.onend = () => setIsRecording(false)
    recognition.onerror = () => setIsRecording(false)
    recognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
  }

  return (
    <div className="min-h-screen bg-[#0F0F11] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#2a2b30] px-6 py-3 flex items-center justify-between shrink-0">
        <Link href={`/project/${project.id}`} className="text-base font-bold tracking-widest text-[#C9A84C] hover:opacity-80 transition-opacity">
          AURUM
        </Link>
        <div className="flex items-center gap-3 text-sm text-[#6b6d75]">
          <span>{project.name} — Fase Semilla</span>
          <span className="text-[#2a2b30]">|</span>
          <span>Fase 1 de 13</span>
          <span className="flex items-center gap-1.5 text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
            En curso
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setVoiceMode(true)}
            className="flex items-center gap-1.5 text-sm border border-[#2a2b30] text-[#6b6d75] hover:text-white hover:border-[#3a3b40] px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
              <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/>
            </svg>
            Modo voz
          </button>
          <Link href={`/project/${project.id}`}
            className="text-sm text-[#6b6d75] border border-[#2a2b30] px-3 py-1.5 rounded-lg hover:text-white hover:border-[#3a3b40] transition-colors">
            Salir
          </Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-72 border-r border-[#2a2b30] p-5 flex flex-col gap-5 overflow-y-auto shrink-0">
          <div>
            <h2 className="font-semibold text-sm mb-0.5">Sesión Semilla</h2>
            <p className="text-xs text-[#6b6d75]">1:1 con Nexo Constructivo</p>
          </div>

          <div>
            <p className="text-xs text-[#C9A84C] uppercase tracking-wider font-medium mb-2">Objetivo de Hoy</p>
            <p className="text-xs text-[#9a9ba5] leading-relaxed">
              Entender tu idea al 100%: experiencia, recursos y visión. Al final generamos tu Resumen del Fundador.
            </p>
          </div>

          {/* Proyecto activo */}
          <div className="bg-[#1A1B1E] border border-[#2a2b30] rounded-lg p-3">
            <p className="text-xs text-[#6b6d75] uppercase tracking-wider mb-1">Proyecto Activo</p>
            <p className="font-semibold text-sm">{project.name}</p>
            <span className="inline-flex items-center gap-1.5 text-xs text-[#6b6d75] bg-[#2a2b30] px-2 py-0.5 rounded-full mt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
              {project.entry_level === 'raw_idea' ? 'Idea cruda' : project.entry_level}
            </span>
          </div>

          {/* Artefactos cargados */}
          <div>
            <p className="text-xs text-[#6b6d75] uppercase tracking-wider mb-2">Artefactos Cargados</p>
            {uploadedFiles.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {uploadedFiles.map((f, i) => (
                  <div key={i} className="bg-[#1A1B1E] border border-[#2a2b30] rounded-lg px-3 py-2">
                    <p className="text-xs text-white font-medium truncate">{f.name}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs text-[#6b6d75]">{f.size}</span>
                      <span className="text-xs text-green-400">Cargado</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <input ref={fileInputRef} type="file" accept=".md,.txt,.pdf" className="hidden" onChange={handleFileSelect} aria-label="Cargar archivo" title="Cargar archivo" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full text-xs text-[#6b6d75] border border-dashed border-[#2a2b30] rounded-lg px-3 py-2 hover:border-[#C9A84C]/50 hover:text-[#C9A84C] transition-colors"
            >
              + Cargar archivo
            </button>
          </div>

          {/* Progreso de extracción */}
          <div>
            <p className="text-xs text-[#6b6d75] uppercase tracking-wider mb-2">Progreso de Extracción</p>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#9a9ba5]">Contexto del fundador</span>
                  <span className="text-[#C9A84C]">{Math.min(userMsgCount * 10, 100)}%</span>
                </div>
                <div className="h-1 bg-[#2a2b30] rounded-full">
                  <div className="h-1 bg-[#C9A84C] rounded-full transition-all"
                    style={{ width: `${Math.min(userMsgCount * 10, 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#9a9ba5]">Idea de producto</span>
                  <span className="text-[#6b6d75]">{Math.min(userMsgCount * 5, 100)}%</span>
                </div>
                <div className="h-1 bg-[#2a2b30] rounded-full">
                  <div className="h-1 bg-[#C9A84C]/50 rounded-full transition-all"
                    style={{ width: `${Math.min(userMsgCount * 5, 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Temas */}
          <div>
            <p className="text-xs text-[#6b6d75] uppercase tracking-wider mb-2">Temas</p>
            <div className="space-y-2">
              {TOPICS.map((topic, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    coveredTopics[i] ? 'bg-[#C9A84C]' : 'border border-[#3a3b40]'
                  }`} />
                  <span className={`text-xs ${coveredTopics[i] ? 'text-[#9a9ba5]' : 'text-[#6b6d75]'}`}>
                    {topic}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen del fundador */}
          <div>
            <p className="text-xs text-[#6b6d75] uppercase tracking-wider mb-2">Resumen del Fundador</p>
            <div className="bg-[#1A1B1E] border border-[#2a2b30] rounded-lg p-3">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#6b6d75]" />
                <p className="text-xs text-[#6b6d75]">Pendiente — se genera al completar la sesión</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Voice mode */}
        {voiceMode && (
          <VoiceModePanel
            projectId={project.id}
            conversationId={conversation?.id}
            messages={messages}
            onMessagesUpdate={setMessages}
            onExit={() => setVoiceMode(false)}
          />
        )}

        {/* Chat area */}
        <main className={`flex-1 flex flex-col overflow-hidden ${voiceMode ? 'hidden' : ''}`}>
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/30 flex items-center justify-center text-[#C9A84C] text-xs font-bold shrink-0 mt-1">
                    N
                  </div>
                )}
                <div className={`max-w-2xl rounded-2xl px-5 py-4 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#1e3a5f] text-white rounded-tr-sm'
                    : 'bg-[#1A1B1E] border border-[#2a2b30] text-[#e0e0e5] rounded-tl-sm'
                }`}>
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown components={{
                      h1: ({ children }) => <h1 className="text-[#C9A84C] font-bold text-lg mb-3 mt-1">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-[#C9A84C] font-bold text-base mb-2 mt-1">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-[#C9A84C] font-semibold mb-2 mt-1">{children}</h3>,
                      strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                      p: ({ children }) => <p className="text-[#e0e0e5] leading-7 mb-3 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="space-y-1.5 mb-3 pl-1">{children}</ul>,
                      ol: ({ children }) => <ol className="space-y-1.5 mb-3 pl-1 list-decimal list-inside">{children}</ol>,
                      li: ({ children }) => <li className="text-[#e0e0e5] pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-[#C9A84C]">{children}</li>,
                    }}>
                      {msg.content}
                    </ReactMarkdown>
                  ) : msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-[#3a3b40] flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                    {userEmail[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/30 flex items-center justify-center text-[#C9A84C] text-xs font-bold shrink-0">N</div>
                <div className="bg-[#1A1B1E] border border-[#2a2b30] rounded-2xl rounded-tl-sm px-5 py-4">
                  <div className="flex gap-1.5 items-center h-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="border-t border-[#2a2b30] px-8 py-4 shrink-0">
            {(pendingContext || voiceUnavailable) && (
              <div className="flex items-center gap-3 mb-2 px-1">
                {pendingContext && (
                  <>
                    <span className="text-xs text-[#C9A84C]">Contexto de archivo listo para enviar</span>
                    <button type="button" onClick={() => setPendingContext('')} className="text-xs text-[#6b6d75] hover:text-white transition-colors">✕</button>
                  </>
                )}
                {voiceUnavailable && (
                  <span className="text-xs text-[#6b6d75]">Voz disponible en Chrome</span>
                )}
              </div>
            )}
            <form onSubmit={sendMessage} className="flex gap-3 items-end">
              <div className="flex-1 bg-[#1A1B1E] border border-[#2a2b30] rounded-xl px-4 py-3 flex items-center gap-3 focus-within:border-[#C9A84C]/50 transition-colors">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Escribe tu respuesta o usa el micrófono..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-[#3a3b40] focus:outline-none"
                  disabled={loading}
                />
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()} title="Adjuntar archivo"
                    className="text-[#3a3b40] hover:text-[#6b6d75] transition-colors p-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                    </svg>
                  </button>
                  <button type="button" onClick={toggleVoice} title={isRecording ? 'Detener grabación' : 'Grabar voz'}
                    className={`transition-colors p-1 ${isRecording ? 'text-[#C9A84C]' : 'text-[#3a3b40] hover:text-[#6b6d75]'}`}>
                    {isRecording
                      ? <span className="w-3 h-3 rounded-full bg-[#C9A84C] animate-pulse inline-block" />
                      : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                          <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/>
                        </svg>
                      )
                    }
                  </button>
                </div>
              </div>
              <button type="submit" title="Enviar mensaje" disabled={loading || !input.trim()}
                className="bg-[#C9A84C] hover:bg-[#b8963f] text-white p-3 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
                </svg>
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
