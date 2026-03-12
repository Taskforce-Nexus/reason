'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?type=recovery`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/forgot-password-sent')
  }

  return (
    <div className="min-h-screen bg-[#0F0F11] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-widest text-[#C9A84C] mb-2">Reason</h1>
          <p className="text-sm text-[#6b6d75]">Sistema de creación de ventures</p>
        </div>
        <div className="bg-[#1A1B1E] border border-[#2a2b30] rounded-xl p-8">
          <h2 className="text-lg font-semibold mb-2">Restablecer contraseña</h2>
          <p className="text-sm text-[#6b6d75] mb-6">
            Ingresa tu correo y te enviaremos instrucciones para restablecer tu contraseña.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-[#6b6d75] uppercase tracking-wider mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com" required
                className="w-full bg-[#0F0F11] border border-[#2a2b30] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#3a3b40] focus:outline-none focus:border-[#C9A84C] transition-colors"
              />
            </div>
            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <button type="submit" disabled={loading}
              className="w-full bg-[#C9A84C] hover:bg-[#b8963f] text-[#0F0F11] font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Enviando...
                </span>
              ) : 'Enviar instrucciones'}
            </button>
          </form>
          <p className="text-center text-sm text-[#6b6d75] mt-6">
            <Link href="/login" className="text-[#C9A84C] hover:underline">Volver al inicio de sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
