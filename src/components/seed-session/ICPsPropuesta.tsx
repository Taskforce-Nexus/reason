'use client'

import { useState, useEffect } from 'react'
import type { Project } from '@/lib/types'
import { safeFetch } from '@/lib/fetch402'
import { createClient } from '@/lib/supabase/client'

const MAX_ACCEPTED = 5

interface PersonaItem {
  id: string        // Claude-generated fake id (used as React key)
  dbId?: string     // Real Supabase UUID
  name: string
  archetype: string
  demographics: string
  quote: string
  jobs_to_be_done?: string[]
  pains?: string[]
  gains?: string[]
  fears_objections?: string[]
  current_alternatives?: string[]
  discovery_channels?: string[]
  purchase_triggers?: string[]
  decision_criteria?: string[]
  behavior_tags?: string[]
}

interface Props {
  project: Project
  stepNumber: number
  acceptedIds: string[]
  onAcceptedChange: (ids: string[]) => void
  onNext: () => void
}

export default function ICPsPropuesta({ project, acceptedIds, onAcceptedChange, onNext }: Props) {
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [initError, setInitError] = useState(false)
  const [personas, setPersonas] = useState<PersonaItem[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  async function savePersonaToDB(persona: PersonaItem): Promise<string | null> {
    const supabase = createClient()
    const { data } = await supabase.from('buyer_personas').insert({
      project_id: project.id,
      name: persona.name,
      archetype_label: persona.archetype,
      demographics: persona.demographics,
      quote: persona.quote,
      needs: persona.jobs_to_be_done ?? [],
      fears_objections: persona.fears_objections ?? [],
      discovery_channels: persona.discovery_channels ?? [],
      current_alternatives: persona.current_alternatives ?? [],
      behavior_tags: persona.behavior_tags ?? [],
      is_confirmed: false,
    }).select('id').single()
    return data?.id ?? null
  }

  // Generate initial set on mount (also used for retry)
  async function generateInitial() {
    setInitialLoading(true)
    setInitError(false)
    try {
      // First: load existing from Supabase
      const supabase = createClient()
      const { data: existing } = await supabase
        .from('buyer_personas')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: true })

      if (existing && existing.length > 0) {
        const items: PersonaItem[] = existing.map((p: Record<string, unknown>) => ({
          id: p.id as string,
          dbId: p.id as string,
          name: p.name as string,
          archetype: (p.archetype_label ?? '') as string,
          demographics: (p.demographics ?? '') as string,
          quote: (p.quote ?? '') as string,
          jobs_to_be_done: (p.needs as string[]) ?? [],
          fears_objections: (p.fears_objections as string[]) ?? [],
          current_alternatives: (p.current_alternatives as string[]) ?? [],
          discovery_channels: (p.discovery_channels as string[]) ?? [],
          behavior_tags: (p.behavior_tags as string[]) ?? [],
        }))
        setPersonas(items)
        const confirmed = existing.filter(p => p.is_confirmed).map(p => p.id as string)
        onAcceptedChange(confirmed.length > 0 ? confirmed : items.map(p => p.id))
        setInitialLoading(false)
        return
      }

      // No existing: generate with Claude
      const res = await safeFetch('/api/seed-session/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'buyer_persona', projectId: project.id, count: 4 }),
      })
      const data = await res.json()
      if (data.error || !data.items) {
        console.error('[ICPsPropuesta] generate error:', data.error)
        setInitError(true)
      } else {
        const items: PersonaItem[] = data.items ?? []
        // Save each to Supabase
        const savedItems = await Promise.all(items.map(async item => {
          const dbId = await savePersonaToDB(item)
          return { ...item, dbId: dbId ?? undefined, id: dbId ?? item.id }
        }))
        setPersonas(savedItems)
        onAcceptedChange(savedItems.map(p => p.id))
      }
    } catch (e) {
      console.error('[ICPsPropuesta] fetch error:', e)
      setInitError(true)
    }
    setInitialLoading(false)
  }

  useEffect(() => {
    void generateInitial()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id])

  async function handleRequestMore() {
    if (acceptedIds.length >= MAX_ACCEPTED) return
    setGenerating(true)
    try {
      const res = await safeFetch('/api/seed-session/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'buyer_persona',
          projectId: project.id,
          existingItems: personas,
          count: 1,
        }),
      })
      const { item, error } = await res.json()
      if (error || !item) return
      const dbId = await savePersonaToDB(item)
      const savedItem = { ...item, dbId: dbId ?? undefined, id: dbId ?? item.id }
      setPersonas(prev => [...prev, savedItem])
      onAcceptedChange([...acceptedIds, savedItem.id])
    } catch { /* non-blocking */ }
    setGenerating(false)
  }

  async function accept(id: string) {
    if (acceptedIds.length >= MAX_ACCEPTED && !acceptedIds.includes(id)) return
    if (!acceptedIds.includes(id)) {
      const supabase = createClient()
      await supabase.from('buyer_personas').update({ is_confirmed: true }).eq('id', id)
      onAcceptedChange([...acceptedIds, id])
    }
  }

  async function discard(id: string) {
    const supabase = createClient()
    await supabase.from('buyer_personas').delete().eq('id', id)
    setPersonas(prev => prev.filter(p => p.id !== id))
    onAcceptedChange(acceptedIds.filter(i => i !== id))
  }

  async function handleConfirm() {
    setLoading(true)
    try {
      // Mark all accepted as confirmed (in case some weren't)
      const supabase = createClient()
      if (acceptedIds.length > 0) {
        await supabase
          .from('buyer_personas')
          .update({ is_confirmed: true })
          .in('id', acceptedIds)
      }
    } catch { /* non-blocking */ }
    setLoading(false)
    onNext()
  }

  const acceptedCount = acceptedIds.length
  const canAddMore = acceptedCount < MAX_ACCEPTED

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
        {/* Nexo message */}
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-[#B8860B]/20 border border-[#B8860B]/30 flex items-center justify-center text-[#B8860B] text-xs font-bold shrink-0 mt-1">N</div>
          <div className="max-w-2xl bg-[#0D1535] border border-[#1E2A4A] rounded-2xl rounded-tl-sm px-5 py-4 text-sm text-[#e0e0e5] leading-relaxed">
            {initialLoading
              ? 'Construyendo los perfiles de clientes relevantes para tu proyecto...'
              : initError
              ? 'Hubo un problema al generar los perfiles. Puedes reintentar a continuación.'
              : `Construí estos perfiles de cliente basándome en tu proyecto. Representan los arquetipos más relevantes para tu mercado objetivo. Confirma los que apliquen o descarta los que no encajen. Haz clic en "Ver perfil" para ver jobs-to-be-done, pains y más.`}
          </div>
        </div>

        {/* Loading skeleton */}
        {initialLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-[#1E2A4A] rounded w-2/5 mb-2" />
                <div className="h-3 bg-[#1E2A4A] rounded w-1/3 mb-3" />
                <div className="h-3 bg-[#1E2A4A] rounded w-4/5" />
              </div>
            ))}
          </div>
        )}

        {/* Error state with retry */}
        {!initialLoading && initError && (
          <div className="bg-[#0D1535] border border-red-500/20 rounded-xl px-5 py-6 text-center space-y-3">
            <p className="text-sm text-[#8892A4]">No pudimos generar las perspectivas de cliente.</p>
            <button
              type="button"
              onClick={() => void generateInitial()}
              className="text-xs text-[#B8860B] border border-[#B8860B]/30 rounded px-3 py-1.5 hover:bg-[#B8860B]/10 transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Personas list */}
        {!initialLoading && !initError && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-[#B8860B] uppercase tracking-wider font-medium">
                Buyer Personas
              </p>
              <span className="text-xs text-[#8892A4]">
                {acceptedCount}/{MAX_ACCEPTED} seleccionadas
              </span>
            </div>
            <div className="space-y-3">
              {personas.map(persona => {
                const isAccepted = acceptedIds.includes(persona.id)
                const isExpanded = expandedId === persona.id
                const hasTags = (persona.behavior_tags ?? []).length > 0
                return (
                  <div
                    key={persona.id}
                    className={`bg-[#0D1535] border rounded-xl overflow-hidden transition-colors ${isAccepted ? 'border-[#B8860B]/40' : 'border-[#1E2A4A] opacity-60'}`}
                  >
                    {/* Card header */}
                    <div className="px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-semibold text-sm text-white">{persona.name}</p>
                            <span className="text-xs text-[#8892A4] bg-[#1E2A4A] px-2 py-0.5 rounded-full shrink-0">{persona.archetype}</span>
                          </div>
                          <p className="text-xs text-[#8892A4] leading-relaxed mb-2">{persona.demographics}</p>
                          <p className="text-xs text-[#B8860B]/80 italic">&ldquo;{persona.quote}&rdquo;</p>

                          {/* Behavior tags */}
                          {hasTags && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {(persona.behavior_tags ?? []).slice(0, 4).map(tag => (
                                <span key={tag} className="text-[10px] bg-[#0A1128] border border-[#1E2A4A] text-[#8892A4] px-2 py-0.5 rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1.5 shrink-0">
                          {isAccepted ? (
                            <button
                              type="button"
                              onClick={() => void discard(persona.id)}
                              className="text-xs px-2.5 py-1 rounded border text-[#8892A4] border-[#1E2A4A] hover:text-red-400 hover:border-red-500/30 transition-colors"
                            >
                              Quitar
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void accept(persona.id)}
                              disabled={!canAddMore}
                              className="text-xs px-2.5 py-1 rounded border text-[#B8860B] border-[#B8860B]/30 hover:bg-[#B8860B]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Agregar
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : persona.id)}
                            className="text-xs px-2.5 py-1 rounded border border-[#1E2A4A] text-[#8892A4] hover:text-white transition-colors"
                          >
                            {isExpanded ? 'Cerrar' : 'Ver perfil'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded profile */}
                    {isExpanded && (
                      <div className="border-t border-[#1E2A4A] px-5 py-4 bg-[#070E22]/50 space-y-3">
                        {[
                          { label: 'Jobs to be done', items: persona.jobs_to_be_done },
                          { label: 'Dolores', items: persona.pains },
                          { label: 'Ganancias buscadas', items: persona.gains },
                          { label: 'Miedos / Objeciones', items: persona.fears_objections },
                          { label: 'Alternativas actuales', items: persona.current_alternatives },
                          { label: 'Canales de descubrimiento', items: persona.discovery_channels },
                          { label: 'Triggers de compra', items: persona.purchase_triggers },
                          { label: 'Criterios de decisión', items: persona.decision_criteria },
                        ].filter(s => s.items && s.items.length > 0).map(section => (
                          <div key={section.label}>
                            <p className="text-[10px] text-[#B8860B] uppercase tracking-wider font-medium mb-1">{section.label}</p>
                            <ul className="space-y-0.5">
                              {(section.items ?? []).map((item, i) => (
                                <li key={i} className="text-xs text-[#8892A4] leading-relaxed flex gap-2">
                                  <span className="text-[#1E2A4A] shrink-0">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Request more skeleton */}
              {generating && (
                <div className="bg-[#0D1535] border border-[#B8860B]/20 rounded-xl p-5 animate-pulse">
                  <div className="h-4 bg-[#1E2A4A] rounded w-2/5 mb-2" />
                  <div className="h-3 bg-[#1E2A4A] rounded w-1/3 mb-3" />
                  <div className="h-3 bg-[#1E2A4A] rounded w-4/5" />
                </div>
              )}
            </div>

            {/* Request another */}
            {canAddMore && (
              <button
                type="button"
                onClick={handleRequestMore}
                disabled={generating}
                className="mt-3 text-xs text-[#B8860B] border border-[#B8860B]/30 rounded px-3 py-1.5 hover:bg-[#B8860B]/10 transition-colors disabled:opacity-50"
              >
                {generating ? 'Generando...' : '+ Pedir otra perspectiva'}
              </button>
            )}
            {!canAddMore && (
              <p className="mt-3 text-xs text-[#4A5568] italic">
                Máximo {MAX_ACCEPTED} buyer personas. Quita una para agregar otra.
              </p>
            )}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="border-t border-[#1E2A4A] px-8 py-4 shrink-0">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading || initialLoading}
          className="w-full bg-[#B8860B] hover:bg-[#b8963f] text-[#0A1128] font-semibold text-sm py-3 rounded-xl transition-colors disabled:opacity-40"
        >
          {loading ? 'Guardando...' : 'Siguiente →'}
        </button>
      </div>
    </main>
  )
}
