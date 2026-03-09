import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/lib/claude'
import type { Message } from '@/lib/types'

const TOPICS = [
  'El problema que resuelves',
  'El cliente objetivo',
  'Tu experiencia como founder',
  'Recursos disponibles (tiempo, equipo, capital)',
  'Visión a 12 meses',
  'Restricciones clave',
  'Por qué tú eres quien debe resolverlo',
]

const TOPICS_SYSTEM = `Eres un analizador de conversaciones. Dado un historial de conversación de una Sesión Semilla, determina cuáles de los 7 temas el founder ya cubrió con información suficiente.

Temas (0-indexed):
0 — El problema que resuelves
1 — El cliente objetivo
2 — Tu experiencia como founder
3 — Recursos disponibles (tiempo, equipo, capital)
4 — Visión a 12 meses
5 — Restricciones clave
6 — Por qué tú eres quien debe resolverlo

Responde ÚNICAMENTE con JSON válido:
{"covered": [0, 2, 4]}

Si no hay información sobre un tema, no lo incluyas. Si la conversación está vacía o es solo el saludo inicial, responde {"covered": []}.`

export async function POST(req: NextRequest) {
  try {
    const { messages } = (await req.json()) as { messages: Message[] }
    if (!messages?.length) return NextResponse.json({ covered: [] })

    const context = messages
      .map(m => `${m.role === 'user' ? 'Founder' : 'Nexo'}: ${m.content}`)
      .join('\n\n')

    const raw = await callClaude(
      TOPICS_SYSTEM,
      [{ role: 'user', content: context }],
      128,
      'claude-haiku-4-5-20251001'
    )

    const parsed = JSON.parse(raw) as { covered: number[] }
    return NextResponse.json({ covered: parsed.covered ?? [], topics: TOPICS })
  } catch (err) {
    console.error('[topics]', err)
    return NextResponse.json({ covered: [] })
  }
}
