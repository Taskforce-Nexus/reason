'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Mode = 'password' | 'magic'

function ErrorMsg({ msg }: { msg: string }) {
  const readable: Record<string, string> = {
    'Invalid login credentials': 'Correo o contraseña incorrectos.',
    'Email not confirmed': 'Confirma tu correo antes de entrar.',
    'Too many requests': 'Demasiados intentos. Espera unos minutos.',
  }
  return (
    <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
      {readable[msg] ?? msg}
    </p>
  )
}

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    })
    if (error) {
      setError(error.message)
    } else {
      setSuccess('Revisa tu correo — te enviamos un enlace mágico.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0F0F11] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-widest text-[#C9A84C] mb-2">AURUM</h1>
          <p className="text-sm text-[#6b6d75]">Sistema de creación de ventures</p>
        </div>

        <div className="bg-[#1A1B1E] border border-[#2a2b30] rounded-xl p-8">
          <div className="flex gap-1 bg-[#0F0F11] p-1 rounded-lg mb-6">
            <button
              type="button" onClick={() => { setMode('password'); setError(''); setSuccess('') }}
              className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${
                mode === 'password' ? 'bg-[#2a2b30] text-white' : 'text-[#6b6d75] hover:text-white'
              }`}>
              Contraseña
            </button>
            <button
              type="button" onClick={() => { setMode('magic'); setError(''); setSuccess('') }}
              className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${
                mode === 'magic' ? 'bg-[#2a2b30] text-white' : 'text-[#6b6d75] hover:text-white'
              }`}>
              Enlace mágico
            </button>
          </div>

          {mode === 'password' ? (
            <form onSubmit={handleLogin} className="space-y-4">
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
              <div>
                <label className="block text-xs text-[#6b6d75] uppercase tracking-wider mb-1.5">
                  Contraseña
                </label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full bg-[#0F0F11] border border-[#2a2b30] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#3a3b40] focus:outline-none focus:border-[#C9A84C] transition-colors"
                />
              </div>
              {error && <ErrorMsg msg={error} />}
              <button type="submit" disabled={loading}
                className="w-full bg-[#C9A84C] hover:bg-[#b8963f] text-[#0F0F11] font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Iniciando sesión...
                  </span>
                ) : 'Entrar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-4">
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
              {error && <ErrorMsg msg={error} />}
              {success && (
                <p className="text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2">
                  {success}
                </p>
              )}
              <button type="submit" disabled={loading || !!success}
                className="w-full bg-[#C9A84C] hover:bg-[#b8963f] text-[#0F0F11] font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Enviando...
                  </span>
                ) : 'Enviar enlace mágico'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-[#6b6d75] mt-6">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-[#C9A84C] hover:underline">Regístrate</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
