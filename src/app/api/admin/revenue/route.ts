import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  if (!(await isAdmin(user.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()

  // MRR: count active subscriptions by plan
  const { data: subs } = await admin
    .from('subscriptions')
    .select('plan, status')
    .eq('status', 'activa')

  const PLAN_PRICE: Record<string, number> = { core: 29, pro: 79, enterprise: 199, free: 0 }
  const planCounts: Record<string, number> = {}
  let mrr = 0
  for (const s of subs ?? []) {
    planCounts[s.plan] = (planCounts[s.plan] ?? 0) + 1
    mrr += PLAN_PRICE[s.plan] ?? 0
  }

  // Token revenue: sum of token_usages.cost_usd (approximated as spent from balance)
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: usages } = await admin
    .from('token_usages')
    .select('cost_usd, user_id, created_at')
    .gte('created_at', startOfMonth.toISOString())

  const tokenRevenue = (usages ?? []).reduce((sum, u) => sum + (u.cost_usd ?? 0), 0)

  // Recent Stripe transactions (from stripe_events or subscriptions)
  const { data: recentSubs } = await admin
    .from('subscriptions')
    .select('user_id, plan, status, created_at, profiles!left(email)')
    .order('created_at', { ascending: false })
    .limit(10)

  return NextResponse.json({
    mrr,
    plan_counts: planCounts,
    token_revenue_this_month: Math.round(tokenRevenue * 100) / 100,
    total_active_paying: (subs ?? []).filter(s => s.plan !== 'free').length,
    recent_subscriptions: recentSubs ?? [],
  })
}
