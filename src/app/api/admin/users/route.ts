import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  if (!(await isAdmin(user.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 50
  const offset = (page - 1) * limit

  // Profiles with plan info
  const { data: profiles, count } = await admin
    .from('profiles')
    .select(`
      id, email, full_name, role, created_at,
      subscriptions!left(plan, status),
      token_balances!left(balance_usd)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Project counts per user
  const userIds = (profiles ?? []).map(p => p.id)
  const { data: projectCounts } = await admin
    .from('projects')
    .select('user_id')
    .in('user_id', userIds)

  const projMap: Record<string, number> = {}
  for (const p of projectCounts ?? []) {
    projMap[p.user_id] = (projMap[p.user_id] ?? 0) + 1
  }

  // Sessions this month per user (via projects)
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: projectIds } = await admin
    .from('projects')
    .select('id, user_id')
    .in('user_id', userIds)

  const pidToUser: Record<string, string> = {}
  for (const p of projectIds ?? []) pidToUser[p.id] = p.user_id

  const { data: sessionRows } = await admin
    .from('sessions')
    .select('project_id')
    .in('project_id', Object.keys(pidToUser))
    .gte('created_at', startOfMonth.toISOString())

  const sessMap: Record<string, number> = {}
  for (const s of sessionRows ?? []) {
    const uid = pidToUser[s.project_id]
    if (uid) sessMap[uid] = (sessMap[uid] ?? 0) + 1
  }

  const rows = (profiles ?? []).map(p => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sub = (p.subscriptions as any)?.[0] ?? {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const balance = (p.token_balances as any)?.[0]?.balance_usd ?? 0
    return {
      id: p.id,
      email: p.email,
      name: p.full_name,
      role: p.role,
      plan: sub.plan ?? 'free',
      plan_status: sub.status ?? 'activa',
      balance_usd: balance,
      projects: projMap[p.id] ?? 0,
      sessions_this_month: sessMap[p.id] ?? 0,
      created_at: p.created_at,
    }
  })

  return NextResponse.json({ users: rows, total: count ?? 0, page, limit })
}
