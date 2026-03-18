import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PRICE_IDS } from '@/lib/stripe'
import SettingsPlans from '@/components/settings/SettingsPlans'

export default async function PlanesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan_id, status, current_period_end')
    .eq('user_id', user.id)
    .maybeSingle()

  const priceIds = {
    core: PRICE_IDS.core_monthly || undefined,
    pro: PRICE_IDS.pro_monthly || undefined,
    enterprise: PRICE_IDS.enterprise_monthly || undefined,
  }

  return (
    <SettingsPlans
      subscription={subscription ?? null}
      priceIds={priceIds}
    />
  )
}
