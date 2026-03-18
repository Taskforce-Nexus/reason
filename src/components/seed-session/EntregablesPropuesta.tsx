'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Project, Advisor } from '@/lib/types'

interface DeliverableSection {
  title: string
  description: string
  questions: string[]
}

interface ComposedDeliverable {
  id: string
  name: string
  key_question: string
  deliverable_index: number
  status: string
  composition: {
    frameworks_used?: string[]
    sections?: DeliverableSection[]
    advisors_needed?: string[]
    depends_on?: string[]
    feeds_into?: string[]
  }
}

interface Props {
  project: Project
  stepNumber: number
  onNext: () => void
  onDeliverablesComposed: (deliverables: { id: string; name: string }[]) => void
  onCouncilReady: (advisors: Advisor[]) => void
}

type LoadState = 'idle' | 'loading' | 'success' | 'error'

export default function EntregablesPropuesta({ project, onNext, onDeliverablesComposed, onCouncilReady }: Props) {
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [deliverables, setDeliverables] = useState<ComposedDeliverable[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Per-card state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTexts, setEditTexts] = useState<Record<string, string>>({})
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())
  const [removingId, setRemovingId] = useState<string | null>(null)

  // Add new
  const [addingOpen, setAddingOpen] = useState(false)
  const [addText, setAddText] = useState('')
  const [addLoading, setAddLoading] = useState(false)

  // Recompose all
  const [recomposeOpen, setRecomposeOpen] = useState(false)
  const [recomposeText, setRecomposeText] = useState('')
  const [confirmRecompose, setConfirmRecompose] = useState(false)

  const compose = useCallback(async (adjustmentContext?: string) => {
    setLoadState('loading')
    try {
      const body: Record<string, string> = { project_id: project.id }
      if (adjustmentContext) body.adjustment = adjustmentContext

      const res = await fetch('/api/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      const items: ComposedDeliverable[] = data.deliverables ?? []
      setDeliverables(items)
      setExpanded(items[0]?.id ?? null)
      setLoadState('success')
      setRecomposeOpen(false)
      setRecomposeText('')
      setConfirmRecompose(false)
    } catch {
      setLoadState('error')
    }
  }, [project.id])

  useEffect(() => { compose() }, [compose])

  async function handleApprove() {
    setSaving(true)
    try {
      await fetch('/api/seed-session/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'entregables',
          projectId: project.id,
          documentSpecIds: deliverables.map(d => d.id),
        }),
      })
    } catch { /* non-blocking */ }

    // Auto-select council based on deliverables' advisors_needed
    try {
      const res = await fetch('/api/council/auto-select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: project.id }),
      })
      if (res.ok) {
        const data = await res.json()
        onCouncilReady(data.advisors ?? [])
      }
    } catch { /* non-blocking */ }

    onDeliverablesComposed(deliverables.map(d => ({ id: d.id, name: d.name })))
    setSaving(false)
    onNext()
  }

  // ── Remove card ──────────────────────────────────────────────────────────

  async function handleRemove(docId: string) {
    setRemovingId(docId)
    try {
      await fetch('/api/compose/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: project.id, action: 'remove', document_id: docId }),
      })
    } catch { /* non-blocking */ }
    setTimeout(() => {
      setDeliverables(prev =>
        prev.filter(d => d.id !== docId).map((d, i) => ({ ...d, deliverable_index: i }))
      )
      setRemovingId(null)
    }, 300)
  }

  // ── Edit card ────────────────────────────────────────────────────────────

  async function handleEdit(docId: string) {
    const text = editTexts[docId]?.trim()
    if (!text) return
    setEditingId(null)
    setLoadingIds(prev => new Set([...prev, docId]))
    try {
      const res = await fetch('/api/compose/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          action: 'edit',
          document_id: docId,
          instruction: text,
        }),
      })
      const data = await res.json()
      if (data.deliverable) {
        setDeliverables(prev => prev.map(d => d.id === docId ? data.deliverable : d))
      }
    } catch { /* non-blocking */ }
    setLoadingIds(prev => { const s = new Set(prev); s.delete(docId); return s })
    setEditTexts(prev => { const n = { ...prev }; delete n[docId]; return n })
  }

  // ── Add new ──────────────────────────────────────────────────────────────

  async function handleAdd() {
    const text = addText.trim()
    if (!text) return
    setAddLoading(true)
    setAddingOpen(false)
    try {
      const res = await fetch('/api/compose/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          action: 'add',
          instruction: text,
          existing_deliverables: deliverables.map(d => ({ name: d.name, key_question: d.key_question })),
        }),
      })
      const data = await res.json()
      if (data.deliverable) {
        setDeliverables(prev => [...prev, data.deliverable])
        setExpanded(data.deliverable.id)
      }
    } catch { /* non-blocking */ }
    setAddLoading(false)
    setAddText('')
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">

        {/* Nexo message */}
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-[#B8860B]/20 border border-[#B8860B]/30 flex items-center justify-center text-[#B8860B] text-xs font-bold shrink-0 mt-1">N</div>
          <div className="max-w-2xl bg-[#0D1535] border border-[#1E2A4A] rounded-2xl rounded-tl-sm px-5 py-4 text-sm text-[#e0e0e5] leading-relaxed">
            {loadState === 'loading'
              ? 'Analizando tu situación y componiendo los entregables que necesitas...'
              : loadState === 'success'
              ? `Basándome en tu proyecto compuse ${deliverables.length} entregables específicos. Puedes quitar, editar o agregar uno a la vez — o recomponer todo desde cero.`
              : loadState === 'error'
              ? 'No pudimos componer los entregables. Intenta de nuevo.'
              : 'Cargando...'}
          </div>
        </div>

        {/* Loading skeleton */}
        {loadState === 'loading' && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-[#1E2A4A] rounded w-1/2 mb-2" />
                <div className="h-3 bg-[#1E2A4A] rounded w-3/4 mb-3" />
                <div className="flex gap-2">
                  <div className="h-5 bg-[#1E2A4A] rounded w-20" />
                  <div className="h-5 bg-[#1E2A4A] rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {loadState === 'error' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 text-center">
            <p className="text-sm text-red-400 mb-3">
              No pudimos componer los entregables. Verifica que tu proyecto tenga un Resumen del Fundador generado.
            </p>
            <button
              type="button"
              onClick={() => compose()}
              className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 text-sm rounded-lg hover:bg-red-500/30 transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Deliverable cards */}
        {loadState === 'success' && (
          <div>
            <p className="text-xs text-[#B8860B] uppercase tracking-wider font-medium mb-3">
              Entregables Propuestos
              <span className="ml-2 text-[#8892A4] normal-case font-normal">{deliverables.length} entregables</span>
            </p>
            <div className="space-y-3">
              {deliverables.map((d, idx) => {
                const isExpanded = expanded === d.id
                const isRemoving = removingId === d.id
                const isLoading = loadingIds.has(d.id)
                const isEditing = editingId === d.id
                const sections = d.composition?.sections ?? []
                const advisorsNeeded = d.composition?.advisors_needed ?? []
                const dependsOn = d.composition?.depends_on ?? []

                // Loading skeleton for this card
                if (isLoading) {
                  return (
                    <div key={d.id} className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-5 animate-pulse">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-4 bg-[#1E2A4A] rounded w-6" />
                        <div className="h-4 bg-[#1E2A4A] rounded w-1/2" />
                      </div>
                      <div className="h-3 bg-[#1E2A4A] rounded w-3/4 mb-3" />
                      <div className="flex gap-2">
                        <div className="h-5 bg-[#1E2A4A] rounded w-20" />
                        <div className="h-5 bg-[#1E2A4A] rounded w-24" />
                      </div>
                    </div>
                  )
                }

                return (
                  <div
                    key={d.id}
                    className={`bg-[#0D1535] border border-[#1E2A4A] rounded-xl overflow-hidden hover:border-[#B8860B]/30 transition-all duration-300 ${
                      isRemoving ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                    }`}
                  >
                    {/* Card header */}
                    <div className="flex items-start justify-between px-5 py-4 gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Index + name + edit icon */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] text-[#B8860B] font-medium border border-[#B8860B]/30 rounded px-1.5 py-0.5 shrink-0">
                            {idx + 1}
                          </span>
                          <h3 className="font-semibold text-sm text-white truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            {d.name}
                          </h3>
                          {/* Edit pencil */}
                          <button
                            type="button"
                            onClick={() => setEditingId(isEditing ? null : d.id)}
                            title="Editar este entregable"
                            className="text-[#8892A4] hover:text-[#B8860B] transition-colors shrink-0 text-xs"
                          >
                            ✏
                          </button>
                        </div>

                        {/* Key question */}
                        <p className="text-xs text-[#8892A4] italic leading-relaxed line-clamp-2 mb-2">
                          {d.key_question}
                        </p>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-1.5">
                          {sections.length > 0 && (
                            <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-2 py-0.5">
                              {sections.length} sección{sections.length !== 1 ? 'es' : ''}
                            </span>
                          )}
                          {advisorsNeeded.map(cat => (
                            <span key={cat} className="text-[10px] bg-[#B8860B]/10 text-[#B8860B] border border-[#B8860B]/20 rounded-full px-2 py-0.5">
                              {cat}
                            </span>
                          ))}
                          {dependsOn.length > 0 && (
                            <span className="text-[10px] bg-[#1E2A4A] text-[#8892A4] rounded-full px-2 py-0.5">
                              Requiere: {dependsOn[0]}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setExpanded(isExpanded ? null : d.id)}
                          className="text-xs text-[#8892A4] hover:text-white transition-colors px-2.5 py-1.5 border border-[#1E2A4A] rounded-lg"
                        >
                          {isExpanded ? 'Cerrar' : 'Ver más'}
                        </button>
                        {/* Remove X */}
                        <button
                          type="button"
                          onClick={() => handleRemove(d.id)}
                          title="Quitar este entregable"
                          disabled={!!removingId}
                          className="text-[#8892A4] hover:text-red-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-500/10 disabled:opacity-40"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Edit textarea */}
                    {isEditing && (
                      <div className="border-t border-[#1E2A4A] px-5 py-4 space-y-3 bg-[#0A1128]/30">
                        <p className="text-[10px] text-[#B8860B] uppercase tracking-wider font-medium">
                          ¿Qué quieres cambiar de este entregable?
                        </p>
                        <textarea
                          value={editTexts[d.id] ?? ''}
                          onChange={e => setEditTexts(prev => ({ ...prev, [d.id]: e.target.value }))}
                          placeholder="Ej: Agrega una sección de análisis competitivo, cambia el enfoque a mercados emergentes..."
                          className="w-full bg-[#0A1128] border border-[#1E2A4A] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4A5568] resize-none focus:outline-none focus:border-[#B8860B]/50 transition-colors"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(d.id)}
                            disabled={!editTexts[d.id]?.trim()}
                            className="px-3 py-1.5 bg-[#B8860B] text-[#0A1128] text-xs font-semibold rounded-lg hover:bg-[#b8963f] disabled:opacity-40 transition-colors"
                          >
                            Aplicar cambio
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 text-xs text-[#8892A4] border border-[#1E2A4A] rounded-lg hover:text-white transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Expanded sections */}
                    {isExpanded && sections.length > 0 && (
                      <div className="border-t border-[#1E2A4A] px-5 py-4 space-y-3">
                        {sections.map((sec, si) => (
                          <div key={si} className="flex gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#B8860B]/60 shrink-0 mt-1.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-[#B8860B] font-medium uppercase tracking-wide mb-1">{sec.title}</p>
                              <p className="text-xs text-[#8892A4] leading-relaxed mb-1.5">{sec.description}</p>
                              {sec.questions?.length > 0 && (
                                <ul className="space-y-1">
                                  {sec.questions.map((q, qi) => (
                                    <li key={qi} className="text-xs text-[#6B7589] leading-relaxed pl-2 border-l border-[#1E2A4A]">
                                      {q}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Add skeleton while loading */}
              {addLoading && (
                <div className="bg-[#0D1535] border border-[#B8860B]/20 rounded-xl p-5 animate-pulse">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-4 bg-[#1E2A4A] rounded w-6" />
                    <div className="h-4 bg-[#1E2A4A] rounded w-2/5" />
                  </div>
                  <div className="h-3 bg-[#1E2A4A] rounded w-3/5 mb-3" />
                  <div className="flex gap-2">
                    <div className="h-5 bg-[#1E2A4A] rounded w-20" />
                  </div>
                </div>
              )}
            </div>

            {/* ── Add entregable ────────────────────────────────────── */}
            <div className="mt-3 space-y-2">
              {!addingOpen ? (
                <button
                  type="button"
                  onClick={() => setAddingOpen(true)}
                  disabled={addLoading}
                  className="flex items-center gap-2 text-sm text-[#8892A4] border border-dashed border-[#1E2A4A] rounded-xl px-4 py-3 w-full hover:border-[#B8860B]/40 hover:text-[#B8860B] transition-colors disabled:opacity-40"
                >
                  <span className="text-base leading-none">+</span>
                  Agregar entregable
                </button>
              ) : (
                <div className="bg-[#0D1535] border border-[#B8860B]/20 rounded-xl p-4 space-y-3">
                  <p className="text-[10px] text-[#B8860B] uppercase tracking-wider font-medium">
                    Nuevo entregable
                  </p>
                  <textarea
                    value={addText}
                    onChange={e => setAddText(e.target.value)}
                    placeholder="¿Qué entregable adicional necesitas? Ej: Un plan de contratación para los próximos 6 meses..."
                    className="w-full bg-[#0A1128] border border-[#1E2A4A] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4A5568] resize-none focus:outline-none focus:border-[#B8860B]/50 transition-colors"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAdd}
                      disabled={!addText.trim()}
                      className="px-4 py-2 bg-[#B8860B] text-[#0A1128] text-sm font-semibold rounded-lg hover:bg-[#b8963f] disabled:opacity-40 transition-colors"
                    >
                      Agregar
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAddingOpen(false); setAddText('') }}
                      className="px-4 py-2 text-sm text-[#8892A4] border border-[#1E2A4A] rounded-lg hover:text-white transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* ── Recomponer todo (demoted) ─────────────────────── */}
              {!recomposeOpen ? (
                <button
                  type="button"
                  onClick={() => setRecomposeOpen(true)}
                  className="text-xs text-[#4A5568] hover:text-[#8892A4] transition-colors w-full text-center py-2"
                >
                  Recomponer todo desde cero
                </button>
              ) : (
                <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-4 space-y-3">
                  {!confirmRecompose ? (
                    <>
                      <p className="text-xs text-[#8892A4]">Dile a Nexo qué cambiar en la propuesta completa:</p>
                      <textarea
                        value={recomposeText}
                        onChange={e => setRecomposeText(e.target.value)}
                        placeholder="Ej: Quiero más enfoque en análisis financiero, o agrega un entregable de riesgos regulatorios..."
                        className="w-full bg-[#0A1128] border border-[#1E2A4A] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4A5568] resize-none focus:outline-none focus:border-[#B8860B]/50 transition-colors"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => recomposeText.trim() && setConfirmRecompose(true)}
                          disabled={!recomposeText.trim()}
                          className="px-4 py-2 text-sm text-[#8892A4] border border-[#1E2A4A] rounded-lg hover:text-white disabled:opacity-40 transition-colors"
                        >
                          Continuar
                        </button>
                        <button
                          type="button"
                          onClick={() => { setRecomposeOpen(false); setRecomposeText(''); setConfirmRecompose(false) }}
                          className="px-4 py-2 text-sm text-[#8892A4] hover:text-white transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-[#e0e0e5]">
                        Esto reemplazará <strong>todos</strong> los entregables actuales. ¿Continuar?
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => compose(recomposeText.trim())}
                          className="px-4 py-2 text-sm text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
                        >
                          Sí, recomponer todo
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmRecompose(false)}
                          className="px-4 py-2 text-sm text-[#8892A4] hover:text-white transition-colors"
                        >
                          Volver
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="border-t border-[#1E2A4A] px-8 py-4 shrink-0">
        <button
          type="button"
          onClick={handleApprove}
          disabled={saving || loadState !== 'success' || deliverables.length === 0}
          className="w-full bg-[#B8860B] hover:bg-[#b8963f] text-[#0A1128] font-semibold text-sm py-3 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? 'Guardando...' : 'Aprobar propuesta →'}
        </button>
      </div>
    </main>
  )
}
