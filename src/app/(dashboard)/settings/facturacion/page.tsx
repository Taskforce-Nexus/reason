import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PRICE_IDS } from '@/lib/stripe'
import SettingsBilling from '@/components/settings/SettingsBilling'

export default async function FacturacionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: balance },
    { data: subscription },
    { data: usage },
    { data: invoices },
    { data: paymentMethods },
  ] = await Promise.all([
    supabase.from('token_balances').select('balance_usd').eq('user_id', user.id).single(),
    supabase.from('subscriptions').select('plan_id, status, current_period_end').eq('user_id', user.id).maybeSingle(),
    supabase
      .from('token_usages')
      .select('id, project_id, activity, tokens_used, cost_usd, created_at, project:projects(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('invoices')
      .select('id, concept, amount_usd, status, pdf_url, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('payment_methods').select('id, brand, last4, exp_month, exp_year').eq('user_id', user.id).limit(1),
  ])

  const priceIds = {
    token10: PRICE_IDS.token_10 || undefined,
    token25: PRICE_IDS.token_25 || undefined,
    token50: PRICE_IDS.token_50 || undefined,
    token100: PRICE_IDS.token_100 || undefined,
  }

  // Normalize Supabase join (project is array in raw result)
  const normalizedUsage = (usage ?? []).map(row => {
    const proj = row.project
    return {
      ...row,
      project: Array.isArray(proj) ? (proj[0] ?? null) : (proj ?? null),
    }
  })

  return (
    <SettingsBilling
      balance={balance?.balance_usd ?? 0}
      subscription={subscription ?? null}
      usage={normalizedUsage}
      invoices={invoices ?? []}
      paymentMethod={paymentMethods?.[0] ?? null}
      priceIds={priceIds}
    />
  )
}
