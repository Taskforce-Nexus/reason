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

  const [
    { count: totalAdvisors },
    { count: nativeAdvisors },
    { count: customAdvisors },
    { data: advisorsByCategory },
  ] = await Promise.all([
    admin.from('advisors').select('id', { count: 'exact', head: true }),
    admin.from('advisors').select('id', { count: 'exact', head: true }).eq('is_native', true),
    admin.from('advisors').select('id', { count: 'exact', head: true }).eq('is_native', false),
    admin.from('advisors').select('category, is_native'),
  ])

  const categoryMap: Record<string, number> = {}
  for (const a of advisorsByCategory ?? []) {
    categoryMap[a.category] = (categoryMap[a.category] ?? 0) + 1
  }

  // Council advisor usage (top advisors by council_advisors count)
  const { data: councilAdvisors } = await admin
    .from('council_advisors')
    .select('advisor_id')

  const usageMap: Record<string, number> = {}
  for (const ca of councilAdvisors ?? []) {
    usageMap[ca.advisor_id] = (usageMap[ca.advisor_id] ?? 0) + 1
  }
  const topAdvisorIds = Object.entries(usageMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id)

  const { data: topAdvisorData } = await admin
    .from('advisors')
    .select('id, name, category, is_native')
    .in('id', topAdvisorIds)

  const topAdvisors = topAdvisorData?.map(a => ({
    ...a,
    usage_count: usageMap[a.id] ?? 0,
  })) ?? []

  return NextResponse.json({
    total_advisors: totalAdvisors ?? 0,
    native_advisors: nativeAdvisors ?? 0,
    custom_advisors: customAdvisors ?? 0,
    by_category: categoryMap,
    top_advisors: topAdvisors,
  })
}
