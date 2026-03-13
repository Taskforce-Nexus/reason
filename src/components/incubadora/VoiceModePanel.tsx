'use client'

import { useState } from 'react'

interface VoiceModePanelProps {
  projectId: string
  onExit: () => void
}

export default function VoiceModePanel({ projectId, onExit }: VoiceModePanelProps) {
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle')
  const [transcript, setTranscript] = useState('')

  return (
    <main className="flex-1 flex flex-col items-center justify-center bg-[#0A1128] relative">
      {/* Botón salir arriba derecha */}
      <button
        onClick={onExit}
        className="absolute top-4 right-4 px-3 py-1.5 text-sm text-[#8892A4] border border-[#1E2A4A] rounded-lg hover:bg-[#0D1535] transition-colors"
      >
        Salir del modo voz
      </button>

      {/* Avatar Nexo */}
      <div className="w-32 h-32 rounded-full border-4 border-[#B8860B] bg-[#0D1535] flex items-center justify-center mb-6">
        <span className="text-5xl font-bold text-[#B8860B]">N</span>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 mb-8">
        <div className={`w-2 h-2 rounded-full ${
          status === 'listening' ? 'bg-green-500 animate-pulse' :
          status === 'processing' ? 'bg-[#B8860B] animate-pulse' :
          status === 'speaking' ? 'bg-[#007BFF] animate-pulse' :
          'bg-[#8892A4]'
        }`} />
        <span className="text-sm text-[#8892A4]">
          {status === 'listening' ? 'Escuchando...' :
           status === 'processing' ? 'Procesando...' :
           status === 'speaking' ? 'Nexo habla...' :
           'Listo para escuchar'}
        </span>
      </div>

      {/* Transcript area */}
      {transcript && (
        <div className="max-w-lg px-6 py-4 bg-[#0D1535] border border-[#1E2A4A] rounded-lg mb-8">
          <p className="text-sm text-[#F8F8F8]">{transcript}</p>
        </div>
      )}

      {/* Botón principal */}
      <button
        onClick={() => {
          if (status === 'idle') {
            setStatus('listening')
            // TODO: conectar Deepgram STT aquí
          } else if (status === 'listening') {
            setStatus('idle')
            // TODO: detener grabación
          }
        }}
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
          status === 'listening'
            ? 'bg-red-600 hover:bg-red-700'
            : 'bg-[#B8860B] hover:bg-[#9A7209]'
        }`}
      >
        {status === 'listening' ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        )}
      </button>

      <p className="text-xs text-[#8892A4] mt-4">
        {status === 'listening' ? 'Toca para detener' : 'Toca para hablar'}
      </p>
    </main>
  )
}
