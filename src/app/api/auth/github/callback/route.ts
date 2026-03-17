import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const dashboardUrl = new URL('/dashboard', req.url)

  if (!code) {
    dashboardUrl.searchParams.set('github', 'error')
    return NextResponse.redirect(dashboardUrl)
  }

  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    dashboardUrl.searchParams.set('github', 'error')
    return NextResponse.redirect(dashboardUrl)
  }

  // Exchange code for access token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  })
  const tokenData = await tokenRes.json()
  const accessToken: string | undefined = tokenData.access_token
  if (!accessToken) {
    dashboardUrl.searchParams.set('github', 'error')
    return NextResponse.redirect(dashboardUrl)
  }

  // Get GitHub user info
  const meRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' },
  })
  if (!meRes.ok) {
    dashboardUrl.searchParams.set('github', 'error')
    return NextResponse.redirect(dashboardUrl)
  }
  const me = await meRes.json()

  // Save to DB
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))

  const admin = createAdminClient()
  await admin.from('user_integrations').upsert({
    user_id: user.id,
    provider: 'github',
    access_token: accessToken,
    github_login: me.login,
  }, { onConflict: 'user_id,provider' })

  dashboardUrl.searchParams.set('github', 'connected')
  return NextResponse.redirect(dashboardUrl)
}
