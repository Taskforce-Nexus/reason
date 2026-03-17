import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callClaude } from '@/lib/claude'
import {
  VALUE_PROP_PROMPT,
  BUSINESS_MODEL_PROMPT,
  CUSTOMER_JOURNEY_PROMPT,
  BRANDING_PROMPT,
  BUSINESS_PLAN_PROMPT,
} from '@/lib/prompts'
import type { Message } from '@/lib/types'

const GITHUB_API = 'https://api.github.com'

const DOC_FIELDS: Record<string, string> = {
  aurum_value_proposition: 'value_proposition.md',
  aurum_business_model: 'business_model.md',
  aurum_customer_journey: 'customer_journey.md',
  aurum_branding: 'branding.md',
  aurum_business_plan: 'business_plan.md',
}

async function pushDocToGitHub(
  content: string,
  filename: string,
  projectId: string,
  repo: string,
  token: string
): Promise<void> {
  const path = `venture_outputs/${projectId}/${filename}`
  const shaRes = await fetch(`${GITHUB_API}/repos/${repo}/contents/${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  })
  const body: Record<string, string> = {
    message: `feat: ${filename.replace('.md', '')} generated`,
    content: Buffer.from(content).toString('base64'),
  }
  if (shaRes.ok) {
    const data = await shaRes.json()
    if (typeof data.sha === 'string') body.sha = data.sha
  }
  await fetch(`${GITHUB_API}/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

export async function POST(req: NextRequest) {
  try {
    const { projectId, conversationId } = await req.json()
    if (!projectId) return NextResponse.json({ error: 'projectId requerido' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    // Verify ownership and get github_repo
    const { data: project } = await supabase
      .from('projects')
      .select('id, name, github_repo')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()
    if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

    // Get conversation messages
    let messages: Message[] = []
    if (conversationId) {
      const { data: conv } = await supabase
        .from('conversations')
        .select('messages')
        .eq('id', conversationId)
        .single()
      if (conv?.messages) messages = conv.messages as Message[]
    }

    // Get founder's GitHub token (optional — sync only if available)
    const { data: integration } = await supabase
      .from('user_integrations')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('provider', 'github')
      .maybeSingle()
    const githubToken = integration?.access_token ?? null

    // Format conversation as context for Claude
    const conversationContext = messages
      .map(m => `${m.role === 'user' ? 'Fundador' : 'Nexo'}: ${m.content}`)
      .join('\n\n')

    const conversationMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      { role: 'user', content: `Conversación de la Sesión Semilla:\n\n${conversationContext}` },
    ]

    const generated: Record<string, string> = {}
    const repoPath = project?.github_repo ?? null
    const admin = createAdminClient()

    const generateAndSave = async (field: string, prompt: string): Promise<void> => {
      const content = await callClaude(prompt, conversationMessages, 2048)
      generated[field] = content

      // Save to project
      await admin.from('projects').update({ [field]: content }).eq('id', projectId)

      // Push to GitHub
      if (githubToken && repoPath) {
        const filename = DOC_FIELDS[field]
        if (filename) {
          await pushDocToGitHub(content, filename, projectId, repoPath, githubToken)
        }
      }
    }

    // Wave 1 — parallel
    await Promise.all([
      generateAndSave('aurum_value_proposition', VALUE_PROP_PROMPT),
      generateAndSave('aurum_business_model', BUSINESS_MODEL_PROMPT),
    ])

    // Wave 2 — parallel
    await Promise.all([
      generateAndSave('aurum_customer_journey', CUSTOMER_JOURNEY_PROMPT),
      generateAndSave('aurum_branding', BRANDING_PROMPT),
    ])

    // Wave 3
    await generateAndSave('aurum_business_plan', BUSINESS_PLAN_PROMPT)

    return NextResponse.json({
      ok: true,
      docs: Object.keys(generated),
      repo: project.github_repo,
    })
  } catch (err) {
    console.error('[extract]', err)
    return NextResponse.json({ error: 'Error generando documentos' }, { status: 500 })
  }
}
