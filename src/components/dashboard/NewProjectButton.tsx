'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  organizationId: string
  primary?: boolean
}

export default function NewProjectButton({ userId, organizationId, primary }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [githubConnected, setGithubConnected] = useState<boolean | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('user_integrations')
      .select('id')
      .eq('user_id', userId)
      .eq('provider', 'github')
      .maybeSingle()
      .then(({ data }) => setGithubConnected(!!data))
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function createProject(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    if (!organizationId) {
      setError('No se encontró tu organización. Recarga la página.')
      return
    }
    setLoading(true)
    setError('')
    const { data, error: insertError } = await supabase.from('projects').insert({
      name: name.trim(),
      user_id: userId,
      organization_id: organizationId,
      status: 'active',
      entry_level: 'raw_idea',
      current_phase: 'Semilla',
      last_active_at: new Date().toISOString(),
    }).select().single()
    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }
    if (data) {
      // Create GitHub repo in founder's account — don't block redirect on failure
      try {
        await fetch('/api/github/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: data.id }),
        })
      } catch {
        // GitHub init failed — visible in project view
      }
      router.push(`/project/${data.id}/incubadora`)
      router.refresh()
    }
    setLoading(false)
  }

  function handleOpen() {
    setOpen(true)
  }

  if (open) {
    // GitHub not connected — block project creation
    if (githubConnected === false) {
      return (
        <div className="flex flex-col gap-3 bg-[#1A1B1E] border border-[#C9A84C]/40 rounded-xl px-5 py-4 max-w-sm">
          <p className="text-sm text-white font-medium">Conecta tu GitHub primero</p>
          <p className="text-xs text-[#6b6d75] leading-5">
            AURUM guardará todos tus entregables en tu propio repo de GitHub —
            founder_brief, value proposition, plan de negocio y más.
          </p>
          <div className="flex gap-2 mt-1">
            <a href="/api/auth/github"
              className="bg-[#C9A84C] hover:bg-[#b8963f] text-[#0F0F11] font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
              Conectar GitHub
            </a>
            <button type="button" onClick={() => setOpen(false)}
              className="text-[#6b6d75] hover:text-white px-3 py-2 text-sm transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )
    }

    return (
      <form onSubmit={createProject} className="flex gap-2">
        <input autoFocus value={name} onChange={e => setName(e.target.value)}
          placeholder="Nombre del proyecto"
          className="bg-[#1A1B1E] border border-[#C9A84C] rounded-lg px-4 py-2 text-sm text-white placeholder-[#3a3b40] focus:outline-none w-64" />
        <button type="submit" disabled={loading}
          className="bg-[#C9A84C] hover:bg-[#b8963f] text-[#0F0F11] font-semibold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
          {loading ? '...' : 'Crear'}
        </button>
        <button type="button" onClick={() => setOpen(false)}
          className="text-[#6b6d75] hover:text-white px-3 py-2 text-sm transition-colors">
          Cancelar
        </button>
        {error && <p className="text-xs text-red-400 self-center">{error}</p>}
      </form>
    )
  }

  return (
    <button type="button" onClick={handleOpen}
      className={`font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors ${
        primary
          ? 'bg-[#C9A84C] hover:bg-[#b8963f] text-[#0F0F11]'
          : 'bg-[#C9A84C] hover:bg-[#b8963f] text-[#0F0F11]'
      }`}>
      + Nuevo Proyecto
    </button>
  )
}
