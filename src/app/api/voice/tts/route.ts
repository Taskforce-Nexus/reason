import { NextResponse } from 'next/server'

// Cartesia voice selected for Nexo:
// Name: "Spanish-speaking Man"
// ID:   34dbb662-8e98-413c-a1ef-1a3407675fe7
// Neutral Spanish male voice — most natural for conversational incubation sessions.

const NEXO_VOICE_ID = '34dbb662-8e98-413c-a1ef-1a3407675fe7'

export async function POST(req: Request) {
  try {
    const { text } = (await req.json()) as { text: string }

    if (!text?.trim()) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    const cartesiaRes = await fetch('https://api.cartesia.ai/tts/bytes', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CARTESIA_API_KEY}`,
        'Cartesia-Version': '2025-04-16',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_id: 'sonic-3',
        transcript: text,
        voice: { mode: 'id', id: NEXO_VOICE_ID },
        language: 'es',
        output_format: {
          container: 'mp3',
          sample_rate: 24000,
          bit_rate: 128000,
        },
      }),
    })

    if (!cartesiaRes.ok) {
      const err = await cartesiaRes.text()
      console.error('[TTS] Cartesia error:', cartesiaRes.status, err)
      return NextResponse.json({ error: 'Cartesia error' }, { status: 502 })
    }

    const audioBuffer = await cartesiaRes.arrayBuffer()

    return new NextResponse(audioBuffer, {
      headers: { 'Content-Type': 'audio/mpeg' },
    })
  } catch (err) {
    console.error('[TTS] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
