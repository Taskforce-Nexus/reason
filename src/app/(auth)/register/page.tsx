'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setDone(true)
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#0F0F11] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold tracking-widest text-[#C9A84C] mb-8">AURUM</h1>
          <div className="bg-[#1A1B1E] border border-[#2a2b30] rounded-xl p-8">
            <div className="w-12 h-12 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/30 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2">Revisa tu correo</h2>
            <p className="text-sm text-[#6b6d75] mb-6">
              Te enviamos un enlace de confirmación a <span className="text-white">{email}</span>.
              Haz clic en él para activar tu cuenta.
            </p>
            <Link href="/login" className="text-sm text-[#C9A84C] hover:underline">
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F0F11] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-widest text-[#C9A84C] mb-2">AURUM</h1>
          <p className="text-sm text-[#6b6d75]">Sistema de creación de ventures</p>
        </div>
        <div className="bg-[#1A1B1E] border border-[#2a2b30] rounded-xl p-8">
          <h2 className="text-lg font-semibold mb-6">Crear cuenta</h2>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs text-[#6b6d75] uppercase tracking-wider mb-1.5">Nombre</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Tu nombre" required
                className="w-full bg-[#0F0F11] border border-[#2a2b30] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#3a3b40] focus:outline-none focus:border-[#C9A84C] transition-colors" />
            </div>
            <div>
              <label className="block text-xs text-[#6b6d75] uppercase tracking-wider mb-1.5">Correo electrónico</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com" required
                className="w-full bg-[#0F0F11] border border-[#2a2b30] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#3a3b40] focus:outline-none focus:border-[#C9A84C] transition-colors" />
            </div>
            <div>
              <label className="block text-xs text-[#6b6d75] uppercase tracking-wider mb-1.5">Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required minLength={6}
                className="w-full bg-[#0F0F11] border border-[#2a2b30] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#3a3b40] focus:outline-none focus:border-[#C9A84C] transition-colors" />
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
                  Creando cuenta...
                </span>
              ) : 'Crear cuenta'}
            </button>
          </form>
          <p className="text-center text-sm text-[#6b6d75] mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-[#C9A84C] hover:underline">Iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
