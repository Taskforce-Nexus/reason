'use client'

import { useState, useEffect } from 'react'
import type { Project } from '@/lib/types'

const MAX_ACCEPTED = 5

interface SpecialistItem {
  id: string
  name: string
  specialty: string
  justification: string
}

interface Props {
  project: Project
  stepNumber: number
  acceptedIds: string[]
  onAcceptedChange: (ids: string[]) => void
  onNext: () => void
}

export default function EspecialistasPropuesta({ project, acceptedIds, onAcceptedChange, onNext }: Props) {
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [specialists, setSpecialists] = useState<SpecialistItem[]>([])

  // Generate initial set on mount
  useEffect(() => {
    async function generateInitial() {
      setInitialLoading(true)
      try {
        const res = await fetch('/api/seed-session/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'specialist', projectId: project.id, count: 4 }),
        })
        const data = await res.json()
        const items: SpecialistItem[] = data.items ?? []
        setSpecialists(items)
        // Start with all accepted
        onAcceptedChange(items.map(s => s.id))
      } catch { /* non-blocking */ }
      setInitialLoading(false)
    }
    generateInitial()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id])

  async function handleRequestMore() {
    if (acceptedIds.length >= MAX_ACCEPTED) return
    setGenerating(true)
    try {
      const res = await fetch('/api/seed-session/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'specialist',
          projectId: project.id,
          existingItems: specialists,
          count: 1,
        }),
      })
      const { item, error } = await res.json()
      if (error || !item) return
      setSpecialists(prev => [...prev, item])
      onAcceptedChange([...acceptedIds, item.id])
    } catch { /* non-blocking */ }
    setGenerating(false)
  }

  function accept(id: string) {
    if (acceptedIds.length >= MAX_ACCEPTED && !acceptedIds.includes(id)) return
    if (!acceptedIds.includes(id)) onAcceptedChange([...acceptedIds, id])
  }

  function discard(id: string) {
    onAcceptedChange(acceptedIds.filter(i => i !== id))
  }

  async function handleConfirm() {
    setLoading(true)
    try {
      await fetch('/api/seed-session/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'especialistas',
          projectId: project.id,
          specialists: specialists.filter(s => acceptedIds.includes(s.id)).map(s => ({
            name: s.name,
            specialty: s.specialty,
            justification: s.justification,
          })),
        }),
      })
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
              ? 'Analizando tu proyecto para identificar los especialistas de industria más relevantes...'
              : `Identifiqué estos especialistas externos que pueden aportar perspectiva de industria específica a tu proyecto. Son distintos a los consejeros principales — su foco es el conocimiento técnico o sectorial. Puedes descartar los que no apliquen o pedir uno adicional.`}
          </div>
        </div>

        {/* Loading skeleton */}
        {initialLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-[#1E2A4A] rounded w-2/5 mb-2" />
                <div className="h-3 bg-[#1E2A4A] rounded w-1/4 mb-3" />
                <div className="h-3 bg-[#1E2A4A] rounded w-4/5" />
              </div>
            ))}
          </div>
        )}

        {/* Specialists list */}
        {!initialLoading && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-[#B8860B] uppercase tracking-wider font-medium">
                Especialistas de Industria
              </p>
              <span className="text-xs text-[#8892A4]">
                {acceptedCount}/{MAX_ACCEPTED} seleccionados
              </span>
            </div>
            <div className="space-y-3">
              {specialists.map(specialist => {
                const isAccepted = acceptedIds.includes(specialist.id)
                return (
                  <div
                    key={specialist.id}
                    className={`bg-[#0D1535] border rounded-xl px-5 py-4 transition-colors ${isAccepted ? 'border-[#B8860B]/40' : 'border-[#1E2A4A] opacity-60'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-white">{specialist.name}</p>
                        <p className="text-xs text-[#B8860B] mt-0.5">{specialist.specialty}</p>
                        <p className="text-xs text-[#8892A4] leading-relaxed mt-2 italic">{specialist.justification}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        {isAccepted ? (
                          <button
                            type="button"
                            onClick={() => discard(specialist.id)}
                            className="text-xs px-2.5 py-1 rounded border text-[#8892A4] border-[#1E2A4A] hover:text-red-400 hover:border-red-500/30 transition-colors"
                          >
                            Quitar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => accept(specialist.id)}
                            disabled={!canAddMore}
                            className="text-xs px-2.5 py-1 rounded border text-[#B8860B] border-[#B8860B]/30 hover:bg-[#B8860B]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Agregar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Request more skeleton */}
              {generating && (
                <div className="bg-[#0D1535] border border-[#B8860B]/20 rounded-xl p-5 animate-pulse">
                  <div className="h-4 bg-[#1E2A4A] rounded w-2/5 mb-2" />
                  <div className="h-3 bg-[#1E2A4A] rounded w-1/4 mb-3" />
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
                className="mt-3 text-xs text-[#8892A4] hover:text-[#B8860B] transition-colors disabled:opacity-50"
              >
                {generating ? 'Generando...' : '+ Pedir otro especialista'}
              </button>
            )}
            {!canAddMore && (
              <p className="mt-3 text-xs text-[#4A5568] italic">
                Máximo {MAX_ACCEPTED} especialistas. Quita uno para agregar otro.
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
