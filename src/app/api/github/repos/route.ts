import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data: integration } = await supabase
      .from('user_integrations')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('provider', 'github')
      .single()
    if (!integration) return NextResponse.json({ error: 'GitHub no conectado' }, { status: 400 })

    const res = await fetch('https://api.github.com/user/repos?per_page=50&sort=updated&type=all', {
      headers: {
        Authorization: `Bearer ${integration.access_token}`,
        Accept: 'application/vnd.github+json',
      },
    })
    if (!res.ok) return NextResponse.json({ error: 'Error listando repos' }, { status: 400 })

    const repos = await res.json()
    return NextResponse.json(
      repos.map((r: { name: string; full_name: string; private: boolean; html_url: string }) => ({
        name: r.name,
        full_name: r.full_name,
        private: r.private,
        url: r.html_url,
      }))
    )
  } catch (err) {
    console.error('[github/repos]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
