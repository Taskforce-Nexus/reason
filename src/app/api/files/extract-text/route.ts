import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_CHARS = 32000 // ~8000 tokens

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const name = file.name.toLowerCase()

    if (name.endsWith('.pdf')) {
      const pdfModule = await import('pdf-parse')
      const pdfParse: (buf: Buffer) => Promise<{ text: string }> = (pdfModule as { default?: unknown }).default as never ?? pdfModule
      const result = await pdfParse(buffer)
      let text: string = result.text ?? ''
      const truncated = text.length > MAX_CHARS
      if (truncated) text = text.slice(0, MAX_CHARS)
      return NextResponse.json({ text, truncated })
    }

    if (name.endsWith('.md') || name.endsWith('.txt')) {
      let text = buffer.toString('utf-8')
      const truncated = text.length > MAX_CHARS
      if (truncated) text = text.slice(0, MAX_CHARS)
      return NextResponse.json({ text, truncated })
    }

    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
  } catch (err) {
    console.error('[extract-text]', err)
    return NextResponse.json({ error: 'Failed to extract text' }, { status: 500 })
  }
}
