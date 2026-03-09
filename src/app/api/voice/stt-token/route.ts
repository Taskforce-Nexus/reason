import { NextResponse } from 'next/server'

const DG_BASE = 'https://api.deepgram.com/v1'

// Cache project_id within the server process (avoids extra API call per request)
let cachedProjectId: string | null = null

async function getProjectId(): Promise<string> {
  if (cachedProjectId) return cachedProjectId
  const res = await fetch(`${DG_BASE}/projects`, {
    headers: { Authorization: `Token ${process.env.DEEPGRAM_API_KEY}` },
  })
  if (!res.ok) throw new Error(`Deepgram projects fetch failed: ${res.status}`)
  const data = await res.json()
  cachedProjectId = data.projects?.[0]?.project_id
  if (!cachedProjectId) throw new Error('No Deepgram project found')
  return cachedProjectId
}

export async function GET() {
  try {
    const projectId = await getProjectId()
    const res = await fetch(`${DG_BASE}/projects/${projectId}/keys`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comment: 'stt-session',
        scopes: ['usage:write'],
        time_to_live_in_seconds: 3600,
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      console.error('[stt-token] Deepgram key error:', res.status, err)
      return NextResponse.json({ error: 'Failed to create Deepgram key' }, { status: 502 })
    }
    const data = await res.json()
    return NextResponse.json({ key: data.key })
  } catch (err) {
    console.error('[stt-token] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
