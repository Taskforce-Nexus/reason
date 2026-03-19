import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/plan'
import { PLAN_LIMITS } from '@/lib/stripe'

// Maps compose output categories → DB category CHECK values
const CATEGORY_MAP: Record<string, string> = {
  estrategia:   'negocio',
  finanzas:     'negocio',
  marketing:    'negocio',
  ventas:       'negocio',
  operaciones:  'negocio',
  negocio:      'negocio',
  producto:     'ux_producto',
  ux:           'ux_producto',
  'producto/ux':'ux_producto',
  ux_producto:  'ux_producto',
  tecnologia:   'tecnico',
  tecnología:   'tecnico',
  tech:         'tecnico',
  tecnico:      'tecnico',
  legal:        'investigacion',
  industria:    'investigacion',
  investigacion:'investigacion',
  precios:      'precios',
  pricing:      'precios',
}

export async function POST(req: NextRequest) {
  const { project_id } = await req.json()
  if (!project_id) return NextResponse.json({ error: 'project_id required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const plan = user ? await getUserPlan(user.id) : 'free'
  const maxAdvisors = (PLAN_LIMITS[plan] ?? PLAN_LIMITS['free']).advisors_per_session

  // 1. Load pending deliverables to extract advisors_needed categories
  const { data: docs } = await supabase
    .from('project_documents')
    .select('composition')
    .eq('project_id', project_id)
    .eq('status', 'pendiente')

  const rawCategories: string[] = []
  for (const doc of docs ?? []) {
    const comp = doc.composition as { advisors_needed?: string[] } | null
    for (const cat of comp?.advisors_needed ?? []) {
      rawCategories.push(cat.toLowerCase().trim())
    }
  }

  // Map to DB category values, deduplicate
  const dbCategories = [...new Set(rawCategories.map(c => CATEGORY_MAP[c] ?? 'negocio'))]

  // 2. Query matching native advisors
  let { data: advisors } = await supabase
    .from('advisors')
    .select('*')
    .in('category', dbCategories)
    .eq('is_native', true)
    .limit(maxAdvisors + 3)

  // Fallback: if fewer than min(3, maxAdvisors), pull any native advisors to fill
  const minAdvisors = Math.min(3, maxAdvisors)
  if ((advisors ?? []).length < minAdvisors) {
    const existingIds = (advisors ?? []).map(a => a.id)
    let fallbackQuery = supabase
      .from('advisors')
      .select('*')
      .eq('is_native', true)
    if (existingIds.length > 0) {
      fallbackQuery = fallbackQuery.not('id', 'in', `(${existingIds.join(',')})`)
    }
    const { data: fallback } = await fallbackQuery.limit(maxAdvisors - (advisors ?? []).length)
    advisors = [...(advisors ?? []), ...(fallback ?? [])]
  }

  // Take max per plan
  const selected = (advisors ?? []).slice(0, maxAdvisors)

  // 3. Assign levels: 1-2 lidera, 3-5 apoya, 6-7 observa
  const withLevels = selected.map((a, i) => ({
    ...a,
    level: i < 2 ? 'lidera' : i < 5 ? 'apoya' : 'observa',
  }))

  // 4. Upsert council
  let councilId: string
  const { data: existing } = await supabase
    .from('councils')
    .select('id')
    .eq('project_id', project_id)
    .maybeSingle()

  if (existing) {
    councilId = existing.id

    // Guard: if council already has 5-7 advisors, don't overwrite — return existing
    const { count: existingCount } = await supabase
      .from('council_advisors')
      .select('id', { count: 'exact', head: true })
      .eq('council_id', councilId)

    if (existingCount && existingCount >= minAdvisors && existingCount <= maxAdvisors) {
      const { data: existingAdvisors } = await supabase
        .from('council_advisors')
        .select('level, advisors(*)')
        .eq('council_id', councilId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = (existingAdvisors ?? []).map((ca: any) => ({
        ...(ca.advisors ?? {}),
        level: ca.level as 'lidera' | 'apoya' | 'observa',
      }))
      return NextResponse.json({ council_id: councilId, advisors: mapped })
    }

    // Remove incorrect/inflated council_advisors and re-select
    await supabase.from('council_advisors').delete().eq('council_id', councilId)
  } else {
    const { data: newCouncil, error: councilErr } = await supabase
      .from('councils')
      .insert({ project_id, status: 'configurando' })
      .select()
      .single()
    if (councilErr || !newCouncil) {
      return NextResponse.json({ error: councilErr?.message ?? 'Failed to create council' }, { status: 500 })
    }
    councilId = newCouncil.id
  }

  // 5. Insert council_advisors (max 7)
  const toInsert = withLevels.slice(0, 7)
  if (toInsert.length > 0) {
    await supabase.from('council_advisors').insert(
      toInsert.map(a => ({ council_id: councilId, advisor_id: a.id, level: a.level }))
    )
  }

  return NextResponse.json({ council_id: councilId, advisors: toInsert })
}
