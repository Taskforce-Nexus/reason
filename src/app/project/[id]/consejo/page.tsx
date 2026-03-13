import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MyBoard from '@/components/consejo/MyBoard'
import type { Project, Advisor, Cofounder } from '@/lib/types'

export default async function ConsejoPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!project) notFound()

  const { data: council } = await supabase
    .from('councils')
    .select('*')
    .eq('project_id', params.id)
    .maybeSingle()

  let advisors: Advisor[] = []
  let cofounders: Cofounder[] = []

  if (council) {
    const [{ data: councilAdvisors }, { data: councilCofounders }] = await Promise.all([
      supabase.from('council_advisors').select('*, advisors(*)').eq('council_id', council.id),
      supabase.from('council_cofounders').select('*, cofounders(*)').eq('council_id', council.id),
    ])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    advisors = (councilAdvisors ?? []).map((ca: any) => ({ ...ca.advisors, level: ca.level })) as Advisor[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cofounders = (councilCofounders ?? []).map((cc: any) => ({ ...cc.cofounders, role: cc.role })) as Cofounder[]
  }

  const [{ data: specialists }, { data: buyerPersonas }] = await Promise.all([
    supabase.from('specialists').select('*').eq('project_id', params.id),
    supabase.from('buyer_personas').select('*').eq('project_id', params.id),
  ])

  return (
    <MyBoard
      project={project as Project}
      advisors={advisors}
      cofounders={cofounders}
      specialists={(specialists ?? []) as Specialist[]}
      buyerPersonas={(buyerPersonas ?? []) as BuyerPersona[]}
      council={council ?? null}
    />
  )
}

export interface Specialist {
  id: string
  name: string
  specialty: string | null
  category_tag: string | null
  justification: string | null
  is_confirmed: boolean
}

export interface BuyerPersona {
  id: string
  name: string
  archetype_label: string | null
  demographics: string | null
  quote: string | null
  behavior_tags: string[] | null
  is_confirmed: boolean
}
