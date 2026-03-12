import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Project } from '@/lib/types'

const JOURNEY_STAGES = [
  'Semilla',
  'Selección de Consejeros',
  'Definición de Entregables',
  'Sesión de Consejo',
  'Entrega',
]

function getActiveStage(p: Project, hasCouncil: boolean, hasDocs: boolean, hasConsultation: boolean): number {
  if (!p.founder_brief) return 0
  if (!hasCouncil) return 1
  if (!hasDocs) return 2
  if (!hasConsultation) return 3
  return 4
}

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!project) notFound()
  const p = project as Project & { description?: string | null }

  // Fetch supporting data — graceful if tables don't exist yet
  const [councilRes, docsRes, consultationRes] = await Promise.all([
    supabase.from('councils').select('*').eq('project_id', params.id).maybeSingle(),
    supabase.from('project_documents').select('id, status').eq('project_id', params.id),
    supabase.from('consultations').select('*').eq('project_id', params.id)
      .order('updated_at', { ascending: false }).limit(1),
  ])

  const council = councilRes.data
  const docs = docsRes.data ?? []
  const consultation = consultationRes.data?.[0] ?? null

  const activeStage = getActiveStage(p, !!council, docs.length > 0, !!consultation)
  const docsReady = docs.filter((d: { id: string; status: string }) => d.status === 'approved').length
  const totalDocs = Math.max(docs.length, 4)
  const exportPct = totalDocs > 0 ? Math.round((docsReady / totalDocs) * 100) : 0

  // Count completed aurum docs
  const aurum_keys = ['aurum_value_proposition', 'aurum_business_model', 'aurum_branding', 'aurum_customer_journey', 'aurum_business_plan'] as const
  const completedAurum = aurum_keys.filter(k => !!p[k]).length

  const PHASE_LABELS: Record<string, string> = {
    semilla: 'Semilla',
    incubadora: 'Incubadora',
    build: 'Build',
    launched: 'Lanzado',
  }
  const phaseLabel = PHASE_LABELS[p.current_phase ?? 'semilla'] ?? (p.current_phase ?? 'Semilla')

  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      {/* Main content */}
      <main className="flex-1 overflow-y-auto px-8 py-7 max-w-[1160px]">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[#8892A4] mb-5">
          <Link href="/" className="hover:text-[#B8860B] transition-colors">← Proyectos</Link>
          <span>/</span>
          <span className="text-white">{p.name}{p.description ? ` — ${p.description}` : ''}</span>
        </div>

        {/* Project header */}
        <h1 className="font-outfit text-3xl font-bold text-white mb-1">
          {p.name}{p.description ? <span className="text-[#8892A4] font-normal"> — {p.description}</span> : null}
        </h1>
        <p className="text-sm text-[#8892A4] mb-1">Etapa actual: <span className="text-[#B8860B]">{phaseLabel}</span></p>
        {council?.purpose && (
          <p className="text-sm text-[#8892A4] mb-6">
            <span className="text-[#6A7490]">Propósito del consejo:</span> {council.purpose}
          </p>
        )}
        {!council?.purpose && p.founder_brief && (
          <p className="text-sm text-[#8892A4] mb-6 italic line-clamp-2">{p.founder_brief}</p>
        )}
        {!council?.purpose && !p.founder_brief && <div className="mb-6" />}

        {/* Journey progress */}
        <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-[#8892A4] uppercase tracking-widest">Progreso del proyecto</span>
            <span className="text-sm font-bold text-[#B8860B] bg-[#B8860B]/10 border border-[#B8860B]/20 px-3 py-0.5 rounded-full">
              {activeStage + 1} de {JOURNEY_STAGES.length}
            </span>
          </div>
          <p className="font-outfit font-semibold text-[#B8860B] mb-4">{JOURNEY_STAGES[activeStage]}</p>

          {/* Stepper */}
          <div className="flex items-center gap-0">
            {JOURNEY_STAGES.map((stage, i) => (
              <div key={stage} className="flex items-center flex-1">
                <div className="flex flex-col items-center shrink-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border ${
                    i < activeStage
                      ? 'bg-[#B8860B] border-[#B8860B] text-white'
                      : i === activeStage
                        ? 'bg-[#B8860B]/10 border-[#B8860B] text-[#B8860B]'
                        : 'bg-transparent border-[#1E2A4A] text-[#3A4560]'
                  }`}>
                    {i < activeStage ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </div>
                  <span className={`text-[9px] mt-1.5 text-center leading-tight max-w-[70px] ${
                    i === activeStage ? 'text-[#B8860B]' : i < activeStage ? 'text-[#6A7490]' : 'text-[#3A4560]'
                  }`}>
                    {stage}
                  </span>
                </div>
                {i < JOURNEY_STAGES.length - 1 && (
                  <div className={`h-px flex-1 mb-4 mx-1 ${i < activeStage ? 'bg-[#B8860B]' : 'bg-[#1E2A4A]'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Top 3 tiles */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Semilla */}
          <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#8892A4] uppercase tracking-widest">Semilla</span>
              {p.founder_brief
                ? <span className="flex items-center gap-1.5 text-xs text-green-400"><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />Completada</span>
                : <span className="flex items-center gap-1.5 text-xs text-[#8892A4]"><span className="w-1.5 h-1.5 rounded-full bg-[#3A4560] inline-block" />Pendiente</span>
              }
            </div>
            <p className="text-sm text-white font-medium mb-1">Resumen del Fundador</p>
            <p className="text-xs text-[#8892A4] mb-4 flex-1 line-clamp-3">
              {p.founder_brief
                ? p.founder_brief
                : 'Inicia la conversación con Nexo para capturar el contexto de tu decisión.'}
            </p>
            <Link href={`/project/${p.id}/semilla`}
              className="block w-full border border-[#1E2A4A] hover:border-[#B8860B] text-[#8892A4] hover:text-white text-xs font-medium py-2 rounded-lg text-center transition-colors">
              Ver sesión completa →
            </Link>
          </div>

          {/* Sesión de Consejo */}
          <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#8892A4] uppercase tracking-widest">Sesión de Consejo</span>
              {activeStage >= 3
                ? <span className="flex items-center gap-1.5 text-xs text-[#B8860B]"><span className="w-1.5 h-1.5 rounded-full bg-[#B8860B] inline-block" />Activa</span>
                : <span className="flex items-center gap-1.5 text-xs text-[#8892A4]"><span className="w-1.5 h-1.5 rounded-full bg-[#3A4560] inline-block" />Pendiente</span>
              }
            </div>
            <p className="text-sm text-white font-medium mb-1">
              {council?.current_doc ?? 'Modelo de Negocio'}
            </p>
            <p className="text-xs text-[#8892A4] mb-4 flex-1">
              {activeStage >= 3
                ? `Turno ${council?.current_turn ?? 1} — sesión en progreso`
                : 'Se activa tras configurar el consejo asesor.'}
            </p>
            {activeStage >= 3 ? (
              <Link href={`/project/${p.id}/sesion-consejo`}
                className="block w-full bg-[#B8860B] hover:bg-[#a07509] text-white text-xs font-semibold py-2 rounded-lg text-center transition-colors">
                Continuar sesión →
              </Link>
            ) : (
              <button type="button" disabled className="w-full border border-[#1E2A4A] text-[#3A4560] text-xs font-medium py-2 rounded-lg cursor-not-allowed">
                Continuar sesión →
              </button>
            )}
          </div>

          {/* Consultoría Activa */}
          <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#8892A4] uppercase tracking-widest">Consultoría Activa</span>
              {consultation
                ? <span className="flex items-center gap-1.5 text-xs text-green-400"><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />Disponible</span>
                : <span className="flex items-center gap-1.5 text-xs text-[#8892A4]"><span className="w-1.5 h-1.5 rounded-full bg-[#3A4560] inline-block" />Pendiente</span>
              }
            </div>
            <p className="text-sm text-white font-medium mb-1">Chat post-sesión</p>
            <p className="text-xs text-[#8892A4] mb-4 flex-1">
              {consultation
                ? 'Tu consejo está listo para responder preguntas y continuar la estrategia.'
                : 'Disponible una vez completada la Sesión de Consejo.'}
            </p>
            {consultation ? (
              <Link href={`/project/${p.id}/consultoria`}
                className="block w-full border border-[#B8860B] text-[#B8860B] hover:bg-[#B8860B] hover:text-white text-xs font-medium py-2 rounded-lg text-center transition-colors">
                Abrir consultoría →
              </Link>
            ) : (
              <button type="button" disabled className="w-full border border-[#1E2A4A] text-[#3A4560] text-xs font-medium py-2 rounded-lg cursor-not-allowed">
                Abrir consultoría →
              </button>
            )}
          </div>
        </div>

        {/* Bottom 2 tiles */}
        <div className="grid grid-cols-5 gap-4">
          {/* Consejo Asesor — 3 cols */}
          <div className="col-span-3 bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#8892A4] uppercase tracking-widest">Consejo Asesor</span>
            </div>
            <p className="text-sm text-white font-medium mb-1">
              {council?.advisor_count ? `${council.advisor_count} asesores configurados` : '0 asesores configurados'}
            </p>
            <p className="text-xs text-[#8892A4] mb-4">Etapa activa: {phaseLabel}</p>
            {/* Advisor avatars */}
            <div className="flex gap-2 mb-4">
              {Array.from({ length: Math.min(council?.advisor_count ?? 0, 5) }).map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-[#B8860B]/20 border border-[#B8860B]/40 flex items-center justify-center text-xs font-semibold text-[#B8860B]">
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
              {(!council?.advisor_count || council.advisor_count === 0) && (
                <div className="w-8 h-8 rounded-full bg-[#1E2A4A] border border-dashed border-[#3A4560] flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3A4560" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </div>
              )}
            </div>
            <Link href={`/project/${p.id}/consejo`}
              className="inline-block border border-[#1E2A4A] hover:border-[#B8860B] text-[#8892A4] hover:text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors">
              Ver Board →
            </Link>
          </div>

          {/* Exportación — 2 cols */}
          <div className="col-span-2 bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#8892A4] uppercase tracking-widest">Exportación</span>
              <span className="text-xs font-semibold text-[#B8860B]">{exportPct}%</span>
            </div>
            <p className="text-sm text-white font-medium mb-1">
              {docsReady} de {totalDocs} documentos listos
            </p>
            {/* Progress bar */}
            <div className="h-1 bg-[#1E2A4A] rounded-full mb-3">
              <div className="h-full bg-[#B8860B] rounded-full transition-all" style={{ width: `${exportPct}%` }} />
            </div>
            {/* Doc list (aurum docs) */}
            <div className="space-y-1 mb-4">
              {aurum_keys.slice(0, 4).map(k => {
                const labels: Record<string, string> = {
                  aurum_value_proposition: 'Prop. de Valor',
                  aurum_business_model: 'Modelo de Negocio',
                  aurum_branding: 'Marca',
                  aurum_customer_journey: 'Recorrido del Cliente',
                }
                const done = !!p[k]
                return (
                  <div key={k} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-sm shrink-0 ${done ? 'bg-[#B8860B]' : 'bg-[#1E2A4A] border border-[#3A4560]'}`} />
                    <span className={`text-xs ${done ? 'text-[#8892A4]' : 'text-[#3A4560]'}`}>{labels[k]}</span>
                    {done && <svg className="ml-auto shrink-0" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                )
              })}
            </div>
            <Link href={`/project/${p.id}/export`}
              className="block w-full border border-[#1E2A4A] hover:border-[#B8860B] text-[#8892A4] hover:text-white text-xs font-medium py-2 rounded-lg text-center transition-colors">
              Ir al Export Center →
            </Link>
          </div>
        </div>
      </main>

      {/* Right sidebar */}
      <aside className="w-72 border-l border-[#1E2A4A] px-6 py-7 shrink-0 overflow-y-auto">
        <h3 className="font-outfit font-semibold text-white text-sm mb-4">Resumen del Proyecto</h3>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { label: 'Etapas', value: `${activeStage + 1}/5` },
            { label: 'Mensajes', value: '—' },
            { label: 'Tiempo', value: '—' },
          ].map(stat => (
            <div key={stat.label} className="bg-[#0D1535] border border-[#1E2A4A] rounded-lg p-3 text-center">
              <p className="text-base font-bold text-white">{stat.value}</p>
              <p className="text-[10px] text-[#8892A4] mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Fase actual */}
        <div className="mb-4">
          <p className="text-[10px] font-semibold text-[#8892A4] uppercase tracking-widest mb-2">Fase Actual</p>
          <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-lg p-3">
            <p className="text-sm font-medium text-white mb-1">{JOURNEY_STAGES[activeStage]}</p>
            <p className="text-xs text-[#8892A4] leading-relaxed">
              {activeStage === 0 && 'Captura el contexto de tu decisión con Nexo.'}
              {activeStage === 1 && 'Configura los consejeros IA para tu proyecto.'}
              {activeStage === 2 && 'Define los entregables de la sesión de consejo.'}
              {activeStage === 3 && 'Tu consejo está trabajando en los documentos.'}
              {activeStage === 4 && 'Todos los documentos han sido aprobados.'}
            </p>
          </div>
        </div>

        {/* Último insight */}
        {(p.founder_brief || council?.last_insight) && (
          <div>
            <p className="text-[10px] font-semibold text-[#8892A4] uppercase tracking-widest mb-2">Último Insight</p>
            <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-lg p-3">
              <p className="text-xs text-[#8892A4] italic leading-relaxed line-clamp-5">
                {council?.last_insight ?? p.founder_brief}
              </p>
            </div>
          </div>
        )}

        {/* Documents summary */}
        <div className="mt-4">
          <p className="text-[10px] font-semibold text-[#8892A4] uppercase tracking-widest mb-2">Documentos Reason</p>
          <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-lg p-3">
            <p className="text-2xl font-bold text-white font-outfit">{completedAurum}<span className="text-sm text-[#8892A4] font-normal"> / 5</span></p>
            <p className="text-xs text-[#8892A4] mt-0.5">aprobados</p>
          </div>
        </div>
      </aside>
    </div>
  )
}
