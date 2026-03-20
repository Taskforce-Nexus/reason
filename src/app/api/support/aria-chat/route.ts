import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserPlan } from '@/lib/plan'
import { ARIA_SYSTEM_PROMPT } from '@/lib/aria'
import Anthropic from '@anthropic-ai/sdk'

const ARIA_WIDGET_PROMPT = `${ARIA_SYSTEM_PROMPT}

ACCIONES QUE PUEDES TOMAR:
Cuando determines que necesitas tomar una acción, incluye un bloque de acción al FINAL de tu respuesta en este formato exacto:

[[ACTION:create_ticket|subject=Descripción del problema|priority=normal]]
[[ACTION:create_suggestion|title=Título de la sugerencia]]
[[ACTION:escalate|reason=Razón del escalamiento]]

CUÁNDO TOMAR CADA ACCIÓN:

1. create_ticket — cuando el usuario reporta un problema que no puedes resolver en el chat:
   - Errores técnicos, problemas de cobro, bugs, seguimiento requerido
   Dile al usuario: "Registré un ticket para que nuestro equipo lo revise. Te notificaremos cuando haya una solución."

2. create_suggestion — cuando el usuario propone una mejora o funcionalidad nueva:
   Dile al usuario: "Excelente sugerencia. La registré para que el equipo la evalúe."

3. escalate — cuando después de 2 intentos no puedes resolver:
   Dile al usuario: "Voy a escalar esto a nuestro equipo. Un humano te contactará pronto."

REGLAS ADICIONALES:
- NUNCA le pidas al usuario que llene un formulario. Tú extraes toda la info de la conversación.
- El usuario no debe saber que estás creando tickets o sugerencias internamente.
- Si necesitas más contexto para crear el ticket, PREGÚNTALE en el chat.
- Consulta el historial de la conversación para contexto.`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { messages } = await req.json() as { messages: { role: string; content: string }[] }
  if (!messages || messages.length === 0) {
    return NextResponse.json({ error: 'messages requerido' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Load user data for system prompt
  const [{ data: profile }, { data: balance }, { count: projectCount }] = await Promise.all([
    admin.from('profiles').select('full_name, email').eq('id', user.id).single(),
    admin.from('token_balances').select('balance_usd').eq('user_id', user.id).single(),
    admin.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  const plan = await getUserPlan(user.id)

  const systemPrompt = ARIA_WIDGET_PROMPT
    .replace('{user_name}', profile?.full_name ?? 'Usuario')
    .replace('{user_email}', profile?.email ?? user.email ?? '')
    .replace('{user_plan}', plan)
    .replace('{user_balance}', (balance?.balance_usd ?? 0).toFixed(2))
    .replace('{project_count}', String(projectCount ?? 0))
    .replace('{last_active}', 'Recientemente')

  // Map messages to Anthropic format (aria → assistant)
  const anthropicMessages = messages.map(m => ({
    role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
    content: m.content,
  }))

  // Ensure last message is from user
  if (anthropicMessages[anthropicMessages.length - 1]?.role !== 'user') {
    return NextResponse.json({ error: 'El último mensaje debe ser del usuario' }, { status: 400 })
  }

  // Call Claude Haiku directly
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const result = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: systemPrompt,
    messages: anthropicMessages,
  })

  const responseText = result.content[0]?.type === 'text' ? result.content[0].text : ''

  // Parse action blocks
  const actions: string[] = []
  const actionRegex = /\[\[ACTION:(\w+)\|(.+?)\]\]/g
  let match
  while ((match = actionRegex.exec(responseText)) !== null) {
    const type = match[1]
    const params = Object.fromEntries(
      match[2].split('|').map(p => {
        const idx = p.indexOf('=')
        return [p.slice(0, idx), p.slice(idx + 1)]
      })
    )
    actions.push(type)

    // Execute actions
    const conversationText = messages.map(m => `${m.role === 'user' ? 'Usuario' : 'Aria'}: ${m.content}`).join('\n')

    if (type === 'create_ticket') {
      await admin.from('support_tickets').insert({
        user_id: user.id,
        subject: params.subject ?? 'Consulta de soporte',
        description: conversationText,
        status: 'abierto',
        priority: params.priority ?? 'normal',
      })
    }

    if (type === 'create_suggestion') {
      const { data: feat } = await admin.from('feature_requests').insert({
        user_id: user.id,
        title: params.title ?? 'Sugerencia de usuario',
        description: messages.slice(-3).map(m => m.content).join(' — '),
        status: 'pendiente',
        votes: 1,
      }).select().single()
      // Auto-vote
      if (feat) {
        await admin.from('feature_votes').insert({ feature_id: feat.id, user_id: user.id }).select()
      }
    }

    if (type === 'escalate') {
      await admin.from('support_tickets').insert({
        user_id: user.id,
        subject: params.reason ?? 'Escalado por Aria',
        description: conversationText,
        status: 'escalado',
        priority: 'urgente',
        aria_resolved: false,
      })
    }
  }

  // Strip action blocks from visible response
  const cleanResponse = responseText.replace(/\[\[ACTION:.*?\]\]/g, '').trim()

  return NextResponse.json({ response: cleanResponse, actions })
}
