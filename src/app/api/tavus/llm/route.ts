import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/lib/claude'
import type { Message } from '@/lib/types'

// ─── In-memory stores ─────────────────────────────────────────────────────────
// LLM conversation history (LLM callback turns)
const historyMap = new Map<string, Message[]>()

// Webhook utterance transcript (conversation.utterance events)
type TranscriptEntry = { role: string; text: string; timestamp: number }
const transcriptStore = new Map<string, TranscriptEntry[]>()

// ─── System prompt ────────────────────────────────────────────────────────────
const NEXO_CVI_SYSTEM = `Eres Nexo, el arquitecto de ventures de AURUM. Estás en una videollamada en vivo con un founder.

Tu personalidad:
- Directo, curioso, energético — no terapéutico
- Haces UNA pregunta a la vez, nunca varias
- Reaccionas a lo que el founder dice, no a lo que imaginas que siente
- Nunca dices "entiendo tu frustración" ni frases de coach motivacional
- Si el founder comparte una idea, reaccionas con curiosidad genuina sobre el negocio
- Si algo es ambiguo, preguntas para entender mejor — no asumes emoción
- Cuando el founder menciona un número, mercado, o dato concreto, lo retomas en tu respuesta

Tu objetivo en esta sesión:
Entender la idea del founder al 100%: el problema, el cliente, los recursos disponibles, la visión. Explora en profundidad antes de pasar al siguiente tema.

Temas que debes cubrir en orden natural (no como checklist):
1. El problema que resuelve el venture
2. El cliente objetivo
3. La experiencia y background del founder
4. Los recursos disponibles (tiempo, equipo, capital)
5. La visión a largo plazo

Formato de respuesta:
- Máximo 2-3 oraciones
- Termina siempre con una pregunta concreta
- Sin listas, sin bullets — es una conversación fluida`

// ─── POST — LLM callback from Tavus + utterance webhook ──────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      event_type?: string
      conversation_id?: string
      role?: string
      transcript?: string
      session_id?: string
      messages?: Array<{ role: string; content: string }>
    }

    const conversationId = body.conversation_id ?? 'default'

    // ── Utterance webhook (transcription events)
    if (body.event_type === 'conversation.utterance') {
      const entries = transcriptStore.get(conversationId) ?? []
      entries.push({
        role: body.role === 'replica' ? 'Nexo' : 'user',
        text: body.transcript ?? '',
        timestamp: Date.now(),
      })
      transcriptStore.set(conversationId, entries)
      return NextResponse.json({ ok: true })
    }

    // ── LLM callback (generate reply)
    let userText: string | undefined
    if (body.transcript?.trim()) {
      userText = body.transcript.trim()
    } else if (body.messages) {
      const last = body.messages.at(-1)
      if (last?.role === 'user') userText = last.content
    }

    if (!userText) {
      return NextResponse.json({ message: '' })
    }

    const history = historyMap.get(conversationId) ?? []
    history.push({ role: 'user', content: userText })

    const claudeMessages = history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    const response = await callClaude(
      NEXO_CVI_SYSTEM,
      claudeMessages,
      512,
      'claude-haiku-4-5-20251001'
    )

    const clean = response.replace(/\[CONSEJO:[^\]]+\]\s*/g, '').trim()

    history.push({ role: 'assistant', content: clean, author: 'Nexo' })
    historyMap.set(conversationId, history)

    return NextResponse.json({ message: clean })
  } catch (err) {
    console.error('[tavus/llm] Error:', err)
    return NextResponse.json({ message: 'Ocurrió un error. Por favor intenta de nuevo.' })
  }
}

// ─── GET — polling endpoint for NexoModal ────────────────────────────────────
export async function GET(req: NextRequest) {
  const conversationId = req.nextUrl.searchParams.get('conversationId') ?? 'default'
  const history = historyMap.get(conversationId) ?? []
  const transcript = transcriptStore.get(conversationId) ?? []
  return NextResponse.json({ messages: history, transcript })
}
