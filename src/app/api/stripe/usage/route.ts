import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Costos aproximados por operación (en USD) — margen aplicado sobre costo Anthropic
const OPERATION_COSTS: Record<string, number> = {
  compose:              0.15,  // Composición de entregables
  compose_edit:         0.08,  // Editar un entregable
  session_question:     0.10,  // Una pregunta de sesión con Nexo Dual
  session_resolve:      0.12,  // Resolver + generar documento parcial
  generate_specialist:  0.05,  // Generar un especialista
  generate_persona:     0.05,  // Generar un buyer persona
  seed_chat:            0.03,  // Un mensaje de semilla
}

export async function POST(req: NextRequest) {
  const { user_id, project_id, operation, tokens_used } = await req.json()

  if (!user_id || !operation) {
    return NextResponse.json({ error: 'user_id and operation required' }, { status: 400 })
  }

  const cost = OPERATION_COSTS[operation] ?? 0.05
  const admin = createAdminClient()

  // Registrar uso en token_usages
  const { error: usageErr } = await admin.from('token_usages').insert({
    user_id,
    project_id: project_id ?? null,
    activity: operation,
    tokens_used: tokens_used ?? 0,
    cost_usd: cost,
  })
  if (usageErr) console.error('[stripe/usage] insert error:', usageErr.message)

  // Descontar del saldo
  const { data: balance } = await admin
    .from('token_balances')
    .select('balance_usd')
    .eq('user_id', user_id)
    .single()

  if (balance) {
    const newBalance = Math.max(0, (balance.balance_usd as number) - cost)
    await admin.from('token_balances').update({ balance_usd: newBalance }).eq('user_id', user_id)
  }

  return NextResponse.json({ success: true, cost })
}
