import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import jsPDF from 'jspdf'
import type { ContentJson } from '@/app/(dashboard)/project/[id]/export/page'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const {
      docName,
      keyQuestion,
      contentJson,
    }: { docId: string; docName: string; keyQuestion?: string; contentJson: ContentJson } =
      await req.json()

    if (!contentJson) {
      return NextResponse.json({ error: 'No hay contenido para exportar' }, { status: 400 })
    }

    const sections = contentJson.sections ?? []
    const keyInsights = contentJson.key_insights ?? []
    const recommendations = contentJson.recommendations ?? []
    const risks = contentJson.risks ?? []

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentW = pageW - margin * 2

    // ── Cover page ─────────────────────────────────────────────────────────
    doc.setFillColor(10, 17, 40)
    doc.rect(0, 0, pageW, pageH, 'F')

    doc.setDrawColor(184, 134, 11)
    doc.setLineWidth(0.5)
    doc.line(margin, 50, pageW - margin, 50)

    doc.setTextColor(248, 248, 248)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    const titleLines = doc.splitTextToSize(contentJson.title ?? docName, contentW)
    doc.text(titleLines, margin, 65)

    let coverY = 65 + titleLines.length * 9

    if (keyQuestion) {
      coverY += 5
      doc.setTextColor(136, 146, 164)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'italic')
      const kqLines = doc.splitTextToSize(keyQuestion, contentW)
      doc.text(kqLines, margin, coverY)
      coverY += kqLines.length * 5.5
    }

    if (contentJson.key_question_answer) {
      coverY += 8
      doc.setTextColor(184, 134, 11)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('CONCLUSIÓN PRINCIPAL', margin, coverY)
      coverY += 6
      doc.setTextColor(200, 212, 232)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      const ansLines = doc.splitTextToSize(contentJson.key_question_answer, contentW)
      doc.text(ansLines, margin, coverY)
    }

    const dateStr = new Date().toLocaleDateString('es', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    doc.setFontSize(9)
    doc.setTextColor(74, 85, 104)
    doc.text(dateStr, margin, pageH - 15)
    doc.text('Generado por Reason', pageW - margin, pageH - 15, { align: 'right' })

    // ── Section pages ───────────────────────────────────────────────────────

    function addPageBg() {
      doc.addPage()
      doc.setFillColor(10, 17, 40)
      doc.rect(0, 0, pageW, pageH, 'F')
    }

    function renderSection(sectionTitle: string, content: string, keyPoints?: string[]) {
      addPageBg()
      let y = margin + 10

      // Section title bar
      doc.setFillColor(20, 31, 60)
      doc.rect(margin - 4, y - 6, contentW + 8, 16, 'F')
      doc.setTextColor(184, 134, 11)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(sectionTitle.toUpperCase(), margin, y + 4)
      y += 20

      doc.setDrawColor(184, 134, 11)
      doc.setLineWidth(0.3)
      doc.line(margin, y, pageW - margin, y)
      y += 8

      doc.setTextColor(200, 212, 232)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const contentLines = doc.splitTextToSize(content, contentW)
      for (const line of contentLines) {
        if (y > pageH - 30) {
          addPageBg()
          y = margin
        }
        doc.text(line, margin, y)
        y += 5.5
      }

      if (keyPoints && keyPoints.length > 0) {
        y += 6
        if (y > pageH - 40) { addPageBg(); y = margin }
        doc.setTextColor(184, 134, 11)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text('PUNTOS CLAVE', margin, y)
        y += 6
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(136, 146, 164)
        doc.setFontSize(9)
        for (const point of keyPoints) {
          if (y > pageH - 20) { addPageBg(); y = margin }
          const ptLines = doc.splitTextToSize(`• ${point}`, contentW - 4)
          for (const pl of ptLines) { doc.text(pl, margin + 2, y); y += 5 }
        }
      }

      doc.setFontSize(8)
      doc.setTextColor(74, 85, 104)
      doc.text(docName, margin, pageH - 10)
    }

    for (const sec of sections) {
      renderSection(
        sec.title ?? sec.section_name ?? 'Sección',
        sec.content,
        sec.key_points
      )
    }

    // ── Key insights page ───────────────────────────────────────────────────
    if (keyInsights.length > 0) {
      addPageBg()
      let y = margin + 10
      doc.setFillColor(20, 31, 60)
      doc.rect(margin - 4, y - 6, contentW + 8, 16, 'F')
      doc.setTextColor(184, 134, 11)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('INSIGHTS CLAVE', margin, y + 4)
      y += 20
      doc.setDrawColor(184, 134, 11)
      doc.setLineWidth(0.3)
      doc.line(margin, y, pageW - margin, y)
      y += 8
      doc.setTextColor(200, 212, 232)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      for (const ins of keyInsights) {
        if (y > pageH - 20) { addPageBg(); y = margin }
        const lines = doc.splitTextToSize(`→ ${ins}`, contentW - 4)
        for (const l of lines) { doc.text(l, margin, y); y += 5.5 }
        y += 2
      }
    }

    // ── Recommendations + risks page ────────────────────────────────────────
    if (recommendations.length > 0 || risks.length > 0) {
      addPageBg()
      let y = margin + 10

      if (recommendations.length > 0) {
        doc.setFillColor(20, 31, 60)
        doc.rect(margin - 4, y - 6, contentW + 8, 16, 'F')
        doc.setTextColor(60, 179, 113)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text('RECOMENDACIONES', margin, y + 4)
        y += 20
        doc.setDrawColor(60, 179, 113)
        doc.setLineWidth(0.3)
        doc.line(margin, y, pageW - margin, y)
        y += 8
        doc.setTextColor(200, 212, 232)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        for (const rec of recommendations) {
          if (y > pageH - 20) { addPageBg(); y = margin }
          const lines = doc.splitTextToSize(`✓ ${rec}`, contentW - 4)
          for (const l of lines) { doc.text(l, margin, y); y += 5.5 }
          y += 2
        }
        y += 10
      }

      if (risks.length > 0) {
        if (y > pageH - 60) { addPageBg(); y = margin + 10 }
        doc.setFillColor(20, 31, 60)
        doc.rect(margin - 4, y - 6, contentW + 8, 16, 'F')
        doc.setTextColor(220, 80, 80)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text('RIESGOS IDENTIFICADOS', margin, y + 4)
        y += 20
        doc.setDrawColor(220, 80, 80)
        doc.setLineWidth(0.3)
        doc.line(margin, y, pageW - margin, y)
        y += 8
        doc.setTextColor(200, 212, 232)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        for (const risk of risks) {
          if (y > pageH - 20) { addPageBg(); y = margin }
          const lines = doc.splitTextToSize(`! ${risk}`, contentW - 4)
          for (const l of lines) { doc.text(l, margin, y); y += 5.5 }
          y += 2
        }
      }
    }

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${docName.replace(/\s+/g, '_')}.pdf"`,
      },
    })
  } catch (err) {
    console.error('[export/pdf]', err)
    return NextResponse.json({ error: 'Error generando PDF' }, { status: 500 })
  }
}
