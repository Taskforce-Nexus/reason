import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const GITHUB_API = 'https://api.github.com'

// Maps project field names to output filenames
const DOC_FILENAMES: Record<string, string> = {
  founder_brief: 'founder_brief.md',
  aurum_value_proposition: 'value_proposition.md',
  aurum_business_model: 'business_model.md',
  aurum_customer_journey: 'customer_journey.md',
  aurum_branding: 'branding.md',
  aurum_business_plan: 'business_plan.md',
}

async function getExistingSha(path: string, repo: string, token: string): Promise<string | null> {
  const res = await fetch(`${GITHUB_API}/repos/${repo}/contents/${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  })
  if (!res.ok) return null
  const data = await res.json()
  return typeof data.sha === 'string' ? data.sha : null
}

async function pushToGitHub(path: string, content: string, repo: string, token: string): Promise<void> {
  const sha = await getExistingSha(path, repo, token)
  const body: Record<string, string> = {
    message: `docs: sync ${path.split('/').pop()}`,
    content: Buffer.from(content).toString('base64'),
  }
  if (sha) body.sha = sha

  const res = await fetch(`${GITHUB_API}/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`GitHub API error: ${err.message}`)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { projectId, field, content } = await req.json()
    if (!projectId || !field || !content) {
      return NextResponse.json({ error: 'projectId, field, content requeridos' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    // Get founder's GitHub token
    const { data: integration } = await supabase
      .from('user_integrations')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('provider', 'github')
      .single()
    if (!integration) {
      return NextResponse.json({ error: 'Conecta tu GitHub primero' }, { status: 400 })
    }
    const token = integration.access_token

    // Verify project ownership and get github_repo
    const { data: project } = await supabase
      .from('projects')
      .select('id, name, github_repo')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()
    if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

    if (!project.github_repo) {
      return NextResponse.json({ error: 'Conecta tu GitHub primero' }, { status: 400 })
    }

    const filename = DOC_FILENAMES[field]
    if (!filename) return NextResponse.json({ error: `Campo desconocido: ${field}` }, { status: 400 })

    const path = `venture_outputs/${projectId}/${filename}`
    await pushToGitHub(path, content, project.github_repo, token)

    return NextResponse.json({ ok: true, path, repo: project.github_repo })
  } catch (err) {
    console.error('[github/sync]', err)
    return NextResponse.json({ error: 'Error sincronizando con GitHub' }, { status: 500 })
  }
}
