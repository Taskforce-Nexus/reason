import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))

  const clientId = process.env.GITHUB_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'GITHUB_CLIENT_ID not configured' }, { status: 500 })
  }

  const callbackUrl = `${req.nextUrl.origin}/api/auth/github/callback`

  const params = new URLSearchParams({
    client_id: clientId,
    scope: 'repo',
    state: user.id,
    redirect_uri: callbackUrl,
  })

  return NextResponse.redirect(`https://github.com/login/oauth/authorize?${params}`)
}
