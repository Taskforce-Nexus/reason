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

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: usages } = await admin
    .from('token_usages')
    .select('user_id, endpoint, input_tokens, output_tokens, cost_usd, model, created_at')
    .gte('created_at', startOfMonth.toISOString())
    .order('created_at', { ascending: false })

  const rows = usages ?? []

  const totalCost = rows.reduce((s, r) => s + (r.cost_usd ?? 0), 0)
  const totalInput = rows.reduce((s, r) => s + (r.input_tokens ?? 0), 0)
  const totalOutput = rows.reduce((s, r) => s + (r.output_tokens ?? 0), 0)

  // Per-model breakdown
  const modelMap: Record<string, { calls: number; cost_usd: number }> = {}
  for (const r of rows) {
    const m = r.model ?? 'unknown'
    if (!modelMap[m]) modelMap[m] = { calls: 0, cost_usd: 0 }
    modelMap[m].calls++
    modelMap[m].cost_usd += r.cost_usd ?? 0
  }

  // Top users by cost
  const userMap: Record<string, number> = {}
  for (const r of rows) {
    userMap[r.user_id] = (userMap[r.user_id] ?? 0) + (r.cost_usd ?? 0)
  }
  const topUsers = Object.entries(userMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([user_id, cost_usd]) => ({ user_id, cost_usd: Math.round(cost_usd * 10000) / 10000 }))

  return NextResponse.json({
    total_cost_usd: Math.round(totalCost * 10000) / 10000,
    total_input_tokens: totalInput,
    total_output_tokens: totalOutput,
    total_calls: rows.length,
    per_model: modelMap,
    top_users: topUsers,
  })
}
