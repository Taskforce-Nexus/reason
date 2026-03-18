import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  createPptx,
  addCoverSlide,
  addDocumentContent,
  addClosingSlide,
} from '@/lib/pptx-builder'
import type { ContentJson } from '@/app/(dashboard)/project/[id]/export/page'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { document_id, project_name }: { document_id: string; project_name: string } =
      await req.json()

    if (!document_id) {
      return NextResponse.json({ error: 'document_id requerido' }, { status: 400 })
    }

    const { data: doc, error } = await supabase
      .from('project_documents')
      .select('id, name, key_question, content_json')
      .eq('id', document_id)
      .single()

    if (error || !doc) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
    }

    const contentJson = doc.content_json as ContentJson | null
    if (!contentJson) {
      return NextResponse.json({ error: 'Sin contenido para exportar' }, { status: 400 })
    }

    const pptx = createPptx()
    addCoverSlide(pptx, doc.name, doc.key_question, project_name ?? 'Proyecto')
    addDocumentContent(pptx, contentJson)
    addClosingSlide(pptx)

    const raw = await pptx.write({ outputType: 'nodebuffer' })
    // pptxgenjs returns Uint8Array; copy into a plain ArrayBuffer for NextResponse
    const uint8 = raw instanceof Uint8Array ? raw : new Uint8Array(raw as ArrayBuffer)
    const arrayBuffer = uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength) as ArrayBuffer

    const safe = (s: string) => s.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase()
    const filename = `${safe(doc.name)}-${safe(project_name ?? 'proyecto')}.pptx`

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('[export/pptx]', err)
    return NextResponse.json({ error: 'Error generando PPTX' }, { status: 500 })
  }
}
