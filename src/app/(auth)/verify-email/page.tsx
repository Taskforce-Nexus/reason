'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function VerifyEmailContent() {
  const params = useSearchParams()
  const email = params.get('email') ?? ''
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleResend() {
    if (!email) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0F0F11] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-widest text-[#C9A84C] mb-2">Reason</h1>
        </div>
        <div className="bg-[#1A1B1E] border border-[#2a2b30] rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/30 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">Revisa tu correo electrónico</h2>
          <p className="text-sm text-[#6b6d75] mb-6">
            Te enviamos un enlace de verificación
            {email && <> a <span className="text-white">{email}</span></>}.
            Haz clic en él para activar tu cuenta.
          </p>

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 mb-4">
              {error}
            </p>
          )}
          {sent && (
            <p className="text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2 mb-4">
              Correo reenviado.
            </p>
          )}

          <button
            onClick={handleResend}
            disabled={loading || sent || !email}
            className="w-full border border-[#2a2b30] text-[#6b6d75] hover:text-white hover:border-[#3a3b40] font-medium py-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-4">
            {loading ? 'Enviando...' : 'Reenviar correo'}
          </button>

          <Link href="/login" className="text-sm text-[#C9A84C] hover:underline">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F0F11] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
