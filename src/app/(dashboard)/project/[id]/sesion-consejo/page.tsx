import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SesionConsejoView from '@/components/sesion-consejo/SesionConsejoView'
import type { Project, Advisor, Cofounder } from '@/lib/types'

export default async function SesionConsejoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!project) notFound()

  const [
    { data: council },
    { data: documents },
    { data: session },
  ] = await Promise.all([
    supabase.from('councils').select('*').eq('project_id', id).maybeSingle(),
    supabase
      .from('project_documents')
      .select('id, name, key_question, composition, deliverable_index, status')
      .eq('project_id', id)
      .not('composition', 'is', null)
      .order('deliverable_index', { ascending: true }),
    supabase.from('sessions').select('*').eq('project_id', id).eq('status', 'activa').maybeSingle(),
  ])

  let advisors: Advisor[] = []
  let cofounders: Cofounder[] = []
  let phases: unknown[] = []

  if (council) {
    const [
      { data: councilAdvisors },
      { data: councilCofounders },
    ] = await Promise.all([
      supabase.from('council_advisors').select('*, advisors(*)').eq('council_id', council.id),
      supabase.from('council_cofounders').select('*, cofounders(*)').eq('council_id', council.id),
    ])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    advisors = (councilAdvisors ?? []).map((ca: any) => ({ ...ca.advisors, level: ca.level })) as Advisor[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cofounders = (councilCofounders ?? []).map((cc: any) => ({ ...cc.cofounders, role: cc.role })) as Cofounder[]
  }

  if (session) {
    const { data: sessionPhases } = await supabase
      .from('session_phases')
      .select('*')
      .eq('session_id', session.id)
      .order('phase_index')
    phases = sessionPhases ?? []
  }

  // Guard: no documents with composition → cannot start session
  if (!documents || documents.length === 0) {
    return (
      <div className="min-h-screen bg-[#0A1128] flex items-center justify-center">
        <div className="max-w-md text-center px-6">
          <div className="w-12 h-12 rounded-full bg-[#B8860B]/20 border border-[#B8860B]/30 flex items-center justify-center text-[#B8860B] text-xl mx-auto mb-4">!</div>
          <h2 className="text-white font-semibold text-lg mb-2">Completa primero la configuración del consejo</h2>
          <p className="text-[#8892A4] text-sm mb-6 leading-relaxed">
            Necesitas aprobar los entregables en la Sesión Semilla antes de iniciar la Sesión de Consejo.
          </p>
          <Link
            href={`/project/${id}/seed-session`}
            className="inline-block bg-[#B8860B] hover:bg-[#a07509] text-[#0A1128] font-semibold text-sm px-6 py-3 rounded-xl transition-colors"
          >
            Ir a Sesión Semilla →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <SesionConsejoView
      project={project as Project}
      advisors={advisors}
      cofounders={cofounders}
      documents={documents ?? []}
      initialSession={session ?? null}
      initialPhases={phases}
    />
  )
}
