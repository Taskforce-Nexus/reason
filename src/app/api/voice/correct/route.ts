import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/lib/claude'

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()
    if (!text?.trim()) return NextResponse.json({ corrected: text })

    const corrected = await callClaude({
      system: 'Eres un corrector de transcripciones de voz al español. Corrige ortografía, puntuación y palabras mal reconocidas. Devuelve SOLO el texto corregido, sin explicaciones ni comillas.',
      messages: [{ role: 'user', content: text }],
      max_tokens: 256,
      tier: 'fast',
    })

    return NextResponse.json({ corrected: corrected.trim() })
  } catch {
    return NextResponse.json({ corrected: null })
  }
}
