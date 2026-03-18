import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import IncubadoraChat from '@/components/incubadora/IncubadoraChat'
import SeedSessionFlow from '@/components/seed-session/SeedSessionFlow'
import type { Project, Cofounder } from '@/lib/types'
import type { SeedStep } from '@/components/seed-session/SeedSessionFlow'

const VALID_SEED_STEPS: SeedStep[] = [
  'entregables', 'cofounders', 'consejo_principal', 'especialistas', 'icps', 'consejo_listo',
]

export default async function SeedSessionPage({ params }: { params: Promise<{ id: string }> }) {
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

  // Si ya tiene founder_brief → SeedSessionFlow (Sesión de Consejo, pasos 2-7)
  if (project.founder_brief) {
    const { data: cofounders } = await supabase
      .from('cofounders').select('*').eq('is_native', true).order('created_at')

    // Determine initial step from persisted current_phase
    const phase = (project as Project & { current_phase?: string }).current_phase
    const initialStep: SeedStep = VALID_SEED_STEPS.includes(phase as SeedStep)
      ? (phase as SeedStep)
      : 'entregables'

    return (
      <SeedSessionFlow
        project={project as Project}
        cofounders={(cofounders ?? []) as Cofounder[]}
        userEmail={user.email ?? ''}
        initialStep={initialStep}
      />
    )
  }

  // Seed Session aún no completa → chat con Nexo
  // Use admin client to bypass RLS on conversations table
  const admin = createAdminClient()
  const { data: conversations } = await admin
    .from('conversations')
    .select('*')
    .eq('project_id', id)
    .eq('type', 'semilla')
    .order('updated_at', { ascending: false })
    .limit(1)
  let conversation = conversations?.[0] ?? null

  if (!conversation) {
    const { data: newConv } = await admin.from('conversations').insert({
      project_id: id,
      type: 'semilla',
      phase: 'seed',
      messages: [],
      status: 'activa',
    }).select().single()
    conversation = newConv
  }

  return (
    <IncubadoraChat
      project={project as Project}
      conversation={conversation}
      userEmail={user.email ?? ''}
    />
  )
}
