import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  createPptx,
  addCoverSlide,
  addIndexSlide,
  addDividerSlide,
  addDocumentContent,
  addClosingSlide,
} from '@/lib/pptx-builder'
import type { ContentJson } from '@/app/(dashboard)/project/[id]/export/page'
import { checkPlanLimit } from '@/lib/plan-limits'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const pptxLimit = await checkPlanLimit(user.id, 'export_pptx')
    if (!pptxLimit.allowed) {
      return NextResponse.json({ error: 'plan_limit', message: pptxLimit.message, plan: pptxLimit.plan }, { status: 403 })
    }

    const { project_id }: { project_id: string } = await req.json()
    if (!project_id) {
      return NextResponse.json({ error: 'project_id requerido' }, { status: 400 })
    }

    // Fetch project name + all documents with content_json
    const [{ data: project }, { data: docs }] = await Promise.all([
      supabase.from('projects').select('name').eq('id', project_id).single(),
      supabase
        .from('project_documents')
        .select('id, name, key_question, content_json')
        .eq('project_id', project_id)
        .not('content_json', 'is', null)
        .order('created_at', { ascending: true }),
    ])

    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    const readyDocs = (docs ?? []).filter(d => d.content_json)

    if (!readyDocs.length) {
      return NextResponse.json({ error: 'Sin documentos con contenido para exportar' }, { status: 400 })
    }

    const pptx = createPptx()

    // Slide 1 — Cover
    addCoverSlide(pptx, project.name, 'Sesión de Consejo — Resultados', project.name)

    // Slide 2 — Index
    addIndexSlide(pptx, readyDocs.map(d => ({ name: d.name, key_question: d.key_question })))

    // Per document: divider + content slides
    for (const doc of readyDocs) {
      addDividerSlide(pptx, doc.name, doc.key_question ?? undefined)
      addDocumentContent(pptx, doc.content_json as ContentJson)
    }

    // Final closing slide
    addClosingSlide(pptx)

    const raw = await pptx.write({ outputType: 'nodebuffer' })
    const uint8 = raw instanceof Uint8Array ? raw : new Uint8Array(raw as ArrayBuffer)
    const arrayBuffer = uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength) as ArrayBuffer

    const safe = (s: string) => s.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase()
    const filename = `${safe(project.name)}-sesion-consejo.pptx`

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('[export/pptx/all]', err)
    return NextResponse.json({ error: 'Error generando PPTX' }, { status: 500 })
  }
}
