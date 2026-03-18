'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { DocumentSpec, Advisor, Cofounder, Project } from '@/lib/types'

interface Props {
  project: Project
  stepNumber: number
  documentSpecs: DocumentSpec[]
  advisors: Advisor[]
  cofounders: Cofounder[]
  specialistCount: number
  personaCount: number
  onNext: () => void
  onComplete?: () => void
}

export default function ConsejoListo({ project, documentSpecs, advisors, cofounders, specialistCount, personaCount, onComplete }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleStart() {
    setLoading(true)
    try {
      await fetch('/api/seed-session/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'consejo_listo',
          projectId: project.id,
        }),
      })
    } catch { /* non-blocking */ }
    onComplete?.()
    router.push(`/project/${project.id}/sesion-consejo`)
  }

  const cofounderPair = [
    cofounders.find(c => c.role === 'constructivo'),
    cofounders.find(c => c.role === 'critico'),
  ].filter(Boolean) as Cofounder[]

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
        {/* Nexo message */}
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-[#B8860B]/20 border border-[#B8860B]/30 flex items-center justify-center text-[#B8860B] text-xs font-bold shrink-0 mt-1">N</div>
          <div className="max-w-2xl bg-[#0D1535] border border-[#1E2A4A] rounded-2xl rounded-tl-sm px-5 py-4 text-sm text-[#e0e0e5] leading-relaxed">
            Tu consejo está listo. A partir de ahora, cada miembro del consejo va a trabajar contigo para construir tu proyecto. Los primeros documentos estarán listos después de la Sesión de Consejo. Puedes revisar el consejo antes de arrancar si quieres hacer algún cambio.
          </div>
        </div>

        {/* Summary */}
        <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl divide-y divide-[#1E2A4A]">
          {/* Consejo principal */}
          <div className="px-5 py-4">
            <p className="text-xs text-[#B8860B] uppercase tracking-wider font-medium mb-3">
              Tu Consejo <span className="text-[#8892A4] font-normal normal-case">({advisors.length} consejeros)</span>
            </p>
            {advisors.length === 0 ? (
              <p className="text-xs text-[#3A4560] italic">Sin consejeros seleccionados</p>
            ) : (
              <div className="space-y-2">
                {(['lidera', 'apoya', 'observa'] as const).map(level => {
                  const group = advisors.filter(a => a.level === level)
                  if (!group.length) return null
                  const levelLabel = level === 'lidera' ? 'LIDERA' : level === 'apoya' ? 'APOYA' : 'OBSERVA'
                  const levelColor = level === 'lidera'
                    ? 'bg-[#B8860B]/20 text-[#B8860B] border-[#B8860B]/30'
                    : level === 'apoya'
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    : 'bg-[#1E2A4A] text-[#8892A4] border-[#1E2A4A]'
                  return (
                    <div key={level}>
                      {group.map(a => (
                        <div key={a.id} className="flex items-center gap-2 py-1">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium shrink-0 ${levelColor}`}>
                            {levelLabel}
                          </span>
                          <span className="text-xs text-white font-medium truncate">{a.name}</span>
                          {a.specialty && (
                            <span className="text-xs text-[#8892A4] truncate">{a.specialty}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Liderazgo / cofounders */}
          <div className="px-5 py-4">
            <p className="text-xs text-[#B8860B] uppercase tracking-wider font-medium mb-2">Liderazgo</p>
            {cofounderPair.map(cf => (
              <div key={cf.id} className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${
                  cf.role === 'constructivo'
                    ? 'bg-green-500/10 text-green-400 border-green-500/30'
                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                }`}>
                  {cf.role === 'constructivo' ? 'Constructivo' : 'Crítico'}
                </span>
                <span className="text-xs text-[#8892A4]">{cf.name} — {cf.specialty}</span>
              </div>
            ))}
          </div>

          {/* ICPs */}
          <div className="px-5 py-4">
            <p className="text-xs text-[#B8860B] uppercase tracking-wider font-medium mb-1">ICPs</p>
            <p className="text-xs text-[#8892A4]">
              {personaCount > 0 ? `${personaCount} buyer persona${personaCount !== 1 ? 's' : ''} confirmada${personaCount !== 1 ? 's' : ''}` : 'Sin buyer personas seleccionadas'}
            </p>
          </div>

          {/* Especialistas */}
          <div className="px-5 py-4">
            <p className="text-xs text-[#B8860B] uppercase tracking-wider font-medium mb-1">Especialistas</p>
            <p className="text-xs text-[#8892A4]">
              {specialistCount > 0 ? `${specialistCount} especialista${specialistCount !== 1 ? 's' : ''} confirmado${specialistCount !== 1 ? 's' : ''}` : 'Sin especialistas seleccionados'}
            </p>
          </div>

          {/* Entregables */}
          <div className="px-5 py-4">
            <p className="text-xs text-[#B8860B] uppercase tracking-wider font-medium mb-2">
              Entregables <span className="text-[#8892A4] font-normal normal-case">({documentSpecs.length})</span>
            </p>
            {documentSpecs.length === 0 ? (
              <p className="text-xs text-[#3A4560] italic">Sin entregables definidos</p>
            ) : (
              <div className="space-y-1.5">
                {documentSpecs.map((d, i) => (
                  <div key={d.id ?? i} className="flex items-start gap-2">
                    <span className="text-[10px] text-[#B8860B] border border-[#B8860B]/30 rounded px-1 py-0.5 shrink-0 mt-0.5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white font-medium truncate">{d.name}</p>
                      {'key_question' in d && (d as { key_question?: string }).key_question && (
                        <p className="text-[10px] text-[#8892A4] leading-relaxed line-clamp-1 italic">
                          {(d as { key_question: string }).key_question}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-[#1E2A4A] px-8 py-4 space-y-2 shrink-0">
        <button
          type="button"
          onClick={handleStart}
          disabled={loading}
          className="w-full bg-[#B8860B] hover:bg-[#b8963f] text-[#0A1128] font-semibold text-sm py-3.5 rounded-xl transition-colors disabled:opacity-40"
        >
          {loading ? 'Iniciando...' : 'Iniciar Sesión de Consejo →'}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/project/${project.id}`)}
          className="w-full text-sm text-[#8892A4] border border-[#1E2A4A] py-3 rounded-xl hover:text-white transition-colors"
        >
          Revisar consejo antes
        </button>
      </div>
    </main>
  )
}
