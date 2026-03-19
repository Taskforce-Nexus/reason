import { createAdminClient } from '@/lib/supabase/admin'
import { getUserPlan } from '@/lib/plan'
import { PLAN_LIMITS } from '@/lib/stripe'

export type LimitKey =
  | 'projects'
  | 'sessions_per_month'
  | 'advisors_per_session'
  | 'deliverables_per_session'
  | 'export_pptx'
  | 'consultation'
  | 'custom_advisor'
  | 'voice_mode'

export async function checkPlanLimit(
  userId: string,
  limit: LimitKey,
  currentCount?: number,
): Promise<{ allowed: boolean; limit: number | boolean; current: number; plan: string; message?: string }> {
  const plan = await getUserPlan(userId)
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS['free']
  const limitValue = limits[limit]

  // Boolean feature gate (export_pptx, consultation, custom_advisor, voice_mode)
  if (typeof limitValue === 'boolean') {
    return {
      allowed: limitValue,
      limit: limitValue,
      current: 0,
      plan,
      message: limitValue ? undefined : `Tu plan ${plan} no incluye esta función. Actualiza tu plan para acceder.`,
    }
  }

  // Numeric limits — require currentCount for projects (passed in), compute for others
  let current = currentCount ?? 0

  if (limit === 'projects' && currentCount === undefined) {
    const admin = createAdminClient()
    const { count } = await admin
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', userId)
    current = count ?? 0
  }

  if (limit === 'sessions_per_month' && currentCount === undefined) {
    const admin = createAdminClient()
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    // sessions.project_id → projects.user_id (no direct user_id on sessions)
    const { data: userProjects } = await admin
      .from('projects')
      .select('id')
      .eq('user_id', userId)
    const projectIds = (userProjects ?? []).map(p => p.id)
    if (projectIds.length === 0) {
      current = 0
    } else {
      const { count } = await admin
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .in('project_id', projectIds)
        .gte('created_at', startOfMonth.toISOString())
      current = count ?? 0
    }
  }

  const allowed = current < (limitValue as number)
  return {
    allowed,
    limit: limitValue as number,
    current,
    plan,
    message: allowed
      ? undefined
      : `Has alcanzado el límite de ${limitValue} ${limit === 'projects' ? 'proyecto(s)' : limit === 'sessions_per_month' ? 'sesión(es) este mes' : limit} de tu plan ${plan}. Actualiza tu plan para continuar.`,
  }
}
