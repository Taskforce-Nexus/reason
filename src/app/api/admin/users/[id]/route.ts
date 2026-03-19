import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  if (!(await isAdmin(user.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const admin = createAdminClient()

  // change-plan: update or upsert subscription
  if (body.plan) {
    await admin
      .from('subscriptions')
      .upsert({ user_id: id, plan: body.plan, status: 'activa' }, { onConflict: 'user_id' })
  }

  // add-balance: increment token_balances.balance_usd
  if (typeof body.add_balance === 'number' && body.add_balance > 0) {
    const { data: current } = await admin
      .from('token_balances')
      .select('balance_usd')
      .eq('user_id', id)
      .single()
    const newBalance = (current?.balance_usd ?? 0) + body.add_balance
    await admin
      .from('token_balances')
      .upsert({ user_id: id, balance_usd: newBalance }, { onConflict: 'user_id' })
  }

  return NextResponse.json({ ok: true })
}
