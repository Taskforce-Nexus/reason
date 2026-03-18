/**
 * Shared PPTX building helpers for the Reason Export Center.
 * Uses PptxGenJS v4. Slide layout: LAYOUT_16x9 (10" x 5.625").
 */
import PptxGenJS from 'pptxgenjs'
import fs from 'fs'
import path from 'path'
import type { ContentJson } from '@/app/(dashboard)/project/[id]/export/page'

// ─── Brand constants (hex without #) ────────────────────────────────────────
const NAVY      = '0A1128'
const GOLD      = 'B8860B'
const WHITE     = 'F8F8F8'
const GRAY      = '8892A4'
const GRAY_DARK = '4A5568'
const GREEN     = '48BB78'
const RED       = 'E53E3E'
const BLUE_DIM  = 'C8D4E8'

// ─── Layout dimensions ───────────────────────────────────────────────────────
const SH = 5.625   // slide height (LAYOUT_16x9)
const ML = 0.45    // margin left (after gold bar)
const CW = 10 - ML - 0.3  // content width

const MAX_SECTION_CHARS = 500

// ─── Logo (base64) ───────────────────────────────────────────────────────────
let _logoData: string | null | undefined = undefined // undefined = unchecked

function getLogoData(): string | null {
  if (_logoData !== undefined) return _logoData
  try {
    const logoPath = path.join(process.cwd(), 'public', 'branding', 'logo-claro-reason.png')
    if (fs.existsSync(logoPath)) {
      _logoData = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`
    } else {
      _logoData = null
    }
  } catch {
    _logoData = null
  }
  return _logoData
}

// ─── Chunk long text across slides ──────────────────────────────────────────
function splitIntoChunks(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text]
  const chunks: string[] = []
  let start = 0
  while (start < text.length) {
    let end = Math.min(start + maxChars, text.length)
    if (end < text.length) {
      const paraBreak = text.lastIndexOf('\n\n', end)
      if (paraBreak > start + maxChars * 0.5) {
        end = paraBreak
      } else {
        const sentBreak = text.lastIndexOf('. ', end)
        if (sentBreak > start + maxChars * 0.5) end = sentBreak + 1
      }
    }
    const chunk = text.slice(start, end).trim()
    if (chunk) chunks.push(chunk)
    start = end
  }
  return chunks
}

// ─── Create PptxGenJS instance with slide master ─────────────────────────────
export function createPptx(): PptxGenJS {
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_16x9'
  pptx.author  = 'Reason'
  pptx.company = 'Reason'

  pptx.defineSlideMaster({
    title: 'REASON_MASTER',
    background: { color: NAVY },
    objects: [
      // Gold left bar accent (0.12" wide, full height)
      { rect: { x: 0, y: 0, w: 0.12, h: SH, fill: { color: GOLD }, line: { color: GOLD, width: 0 } } },
    ],
  })

  return pptx
}

// ─── Cover slide ─────────────────────────────────────────────────────────────
export function addCoverSlide(
  pptx: PptxGenJS,
  title: string,
  keyQuestion: string | null | undefined,
  projectName: string,
): void {
  const slide = pptx.addSlide({ masterName: 'REASON_MASTER' })

  const logoData = getLogoData()
  if (logoData) {
    slide.addImage({ data: logoData, x: 4, y: 0.3, w: 2, h: 0.6 })
  }

  slide.addText(title, {
    x: ML, y: 1.3, w: CW, h: 1.4,
    fontSize: 34, bold: true, color: WHITE, fontFace: 'Outfit',
    align: 'center', valign: 'middle',
  })

  if (keyQuestion) {
    slide.addText(keyQuestion, {
      x: ML, y: 2.9, w: CW, h: 0.9,
      fontSize: 15, color: GRAY, fontFace: 'Open Sans',
      align: 'center', italic: true,
    })
  }

  slide.addText(projectName, {
    x: ML, y: 4.0, w: CW, h: 0.45,
    fontSize: 13, color: GOLD, fontFace: 'Open Sans',
    align: 'center', bold: true,
  })

  const dateStr = new Date().toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' })
  slide.addText(`Generado por Reason — ${dateStr}`, {
    x: ML, y: 5.1, w: CW, h: 0.3,
    fontSize: 9, color: GRAY_DARK, fontFace: 'Open Sans', align: 'center',
  })
}

// ─── Summary / Executive slide ───────────────────────────────────────────────
function addSummarySlide(pptx: PptxGenJS, contentJson: ContentJson): void {
  const slide = pptx.addSlide({ masterName: 'REASON_MASTER' })

  slide.addText('Resumen Ejecutivo', {
    x: ML, y: 0.25, w: CW, h: 0.65,
    fontSize: 26, bold: true, color: WHITE, fontFace: 'Outfit',
  })
  slide.addShape(pptx.ShapeType.rect, {
    x: ML, y: 0.95, w: 2, h: 0.04,
    fill: { color: GOLD }, line: { color: GOLD, width: 0 },
  })

  let y = 1.15

  if (contentJson.key_question_answer) {
    slide.addText(contentJson.key_question_answer, {
      x: ML, y, w: CW, h: 1.5,
      fontSize: 12, color: WHITE, fontFace: 'Open Sans', valign: 'top',
    })
    y += 1.7
  }

  const insights = contentJson.key_insights ?? []
  if (insights.length > 0 && y < SH - 0.8) {
    slide.addText('Insights Clave', {
      x: ML, y, w: CW, h: 0.35,
      fontSize: 10, color: GOLD, bold: true, fontFace: 'Open Sans',
    })
    y += 0.4
    slide.addText(
      insights.map(ins => ({ text: ins, options: { breakLine: true, paraSpaceAfter: 3 } })),
      {
        x: ML, y, w: CW, h: SH - y - 0.2,
        fontSize: 11, color: GRAY, fontFace: 'Open Sans',
        bullet: { type: 'bullet' },
      },
    )
  }
}

// ─── Section content slide ────────────────────────────────────────────────────
function addSectionSlide(
  pptx: PptxGenJS,
  sectionTitle: string,
  content: string,
  keyPoints?: string[],
  isContinuation?: boolean,
): void {
  const slide = pptx.addSlide({ masterName: 'REASON_MASTER' })
  const displayTitle = isContinuation ? `${sectionTitle} (cont.)` : sectionTitle

  slide.addText(displayTitle.toUpperCase(), {
    x: ML, y: 0.25, w: CW, h: 0.65,
    fontSize: 20, bold: true, color: WHITE, fontFace: 'Outfit',
  })
  slide.addShape(pptx.ShapeType.rect, {
    x: ML, y: 0.95, w: 1.8, h: 0.04,
    fill: { color: GOLD }, line: { color: GOLD, width: 0 },
  })

  const hasKeyPoints = keyPoints && keyPoints.length > 0
  const contentH = hasKeyPoints ? 2.8 : 4.3

  slide.addText(content, {
    x: ML, y: 1.15, w: CW, h: contentH,
    fontSize: 11, color: BLUE_DIM, fontFace: 'Open Sans', valign: 'top',
  })

  if (hasKeyPoints) {
    const kpY = 4.15
    slide.addText('Puntos Clave', {
      x: ML, y: kpY, w: CW, h: 0.3,
      fontSize: 9, color: GOLD, bold: true, fontFace: 'Open Sans',
    })
    slide.addText(
      keyPoints.map(pt => ({ text: pt, options: { breakLine: true } })),
      {
        x: ML, y: kpY + 0.32, w: CW, h: SH - kpY - 0.45,
        fontSize: 9, color: GRAY, fontFace: 'Open Sans',
        bullet: { type: 'bullet' },
      },
    )
  }
}

// ─── Recommendations slide ────────────────────────────────────────────────────
function addRecommendationsSlide(pptx: PptxGenJS, recommendations: string[]): void {
  if (!recommendations.length) return
  const slide = pptx.addSlide({ masterName: 'REASON_MASTER' })

  slide.addText('Recomendaciones', {
    x: ML, y: 0.25, w: CW, h: 0.65,
    fontSize: 24, bold: true, color: GREEN, fontFace: 'Outfit',
  })
  slide.addShape(pptx.ShapeType.rect, {
    x: ML, y: 0.95, w: 1.8, h: 0.04,
    fill: { color: GREEN }, line: { color: GREEN, width: 0 },
  })
  slide.addText(
    recommendations.map(rec => ({ text: rec, options: { breakLine: true, paraSpaceAfter: 5 } })),
    {
      x: ML, y: 1.15, w: CW, h: 4.2,
      fontSize: 12, color: WHITE, fontFace: 'Open Sans', valign: 'top',
      bullet: { type: 'bullet' },
    },
  )
}

// ─── Risks slide ──────────────────────────────────────────────────────────────
function addRisksSlide(pptx: PptxGenJS, risks: string[]): void {
  if (!risks.length) return
  const slide = pptx.addSlide({ masterName: 'REASON_MASTER' })

  slide.addText('Riesgos Identificados', {
    x: ML, y: 0.25, w: CW, h: 0.65,
    fontSize: 24, bold: true, color: RED, fontFace: 'Outfit',
  })
  slide.addShape(pptx.ShapeType.rect, {
    x: ML, y: 0.95, w: 1.8, h: 0.04,
    fill: { color: RED }, line: { color: RED, width: 0 },
  })
  slide.addText(
    risks.map(risk => ({ text: risk, options: { breakLine: true, paraSpaceAfter: 5 } })),
    {
      x: ML, y: 1.15, w: CW, h: 4.2,
      fontSize: 12, color: WHITE, fontFace: 'Open Sans', valign: 'top',
      bullet: { type: 'bullet' },
    },
  )
}

// ─── Closing slide ────────────────────────────────────────────────────────────
export function addClosingSlide(pptx: PptxGenJS): void {
  const slide = pptx.addSlide({ masterName: 'REASON_MASTER' })

  const logoData = getLogoData()
  if (logoData) {
    slide.addImage({ data: logoData, x: 4, y: 1.6, w: 2, h: 0.6 })
  }

  slide.addText('Documento generado por Reason', {
    x: ML, y: 2.5, w: CW, h: 0.45,
    fontSize: 13, color: GRAY, fontFace: 'Open Sans', align: 'center',
  })
  slide.addText('reason.guru', {
    x: ML, y: 3.1, w: CW, h: 0.4,
    fontSize: 12, color: GOLD, fontFace: 'Open Sans', align: 'center', bold: true,
  })

  const dateStr = new Date().toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' })
  slide.addText(dateStr, {
    x: ML, y: 3.6, w: CW, h: 0.35,
    fontSize: 10, color: GRAY_DARK, fontFace: 'Open Sans', align: 'center',
  })
}

// ─── Divider slide (for multi-doc export) ────────────────────────────────────
export function addDividerSlide(pptx: PptxGenJS, title: string, subtitle?: string): void {
  const slide = pptx.addSlide({ masterName: 'REASON_MASTER' })

  slide.addShape(pptx.ShapeType.rect, {
    x: 3, y: 1.9, w: 4, h: 0.06,
    fill: { color: GOLD }, line: { color: GOLD, width: 0 },
  })

  slide.addText(title, {
    x: ML, y: 2.1, w: CW, h: 1.0,
    fontSize: 28, bold: true, color: WHITE, fontFace: 'Outfit', align: 'center',
  })

  if (subtitle) {
    slide.addText(subtitle, {
      x: ML, y: 3.2, w: CW, h: 0.55,
      fontSize: 13, color: GRAY, fontFace: 'Open Sans', align: 'center', italic: true,
    })
  }
}

// ─── Index slide (for multi-doc export) ──────────────────────────────────────
export function addIndexSlide(pptx: PptxGenJS, docs: { name: string; key_question?: string | null }[]): void {
  const slide = pptx.addSlide({ masterName: 'REASON_MASTER' })

  slide.addText('Contenido', {
    x: ML, y: 0.25, w: CW, h: 0.65,
    fontSize: 26, bold: true, color: WHITE, fontFace: 'Outfit',
  })
  slide.addShape(pptx.ShapeType.rect, {
    x: ML, y: 0.95, w: 1.8, h: 0.04,
    fill: { color: GOLD }, line: { color: GOLD, width: 0 },
  })

  const items: { text: string; options: Record<string, unknown> }[] = []
  for (const doc of docs) {
    items.push({ text: doc.name, options: { bold: true, color: WHITE, breakLine: false } })
    if (doc.key_question) {
      items.push({ text: `  — ${doc.key_question}`, options: { color: GRAY, breakLine: true, paraSpaceAfter: 5 } })
    } else {
      items.push({ text: '', options: { breakLine: true, paraSpaceAfter: 5 } })
    }
  }

  slide.addText(items, {
    x: ML, y: 1.2, w: CW, h: 4.1,
    fontSize: 11, fontFace: 'Open Sans', valign: 'top',
    bullet: { type: 'bullet' },
  })
}

// ─── Core: add all slides for one document ────────────────────────────────────
export function addDocumentContent(pptx: PptxGenJS, contentJson: ContentJson): void {
  addSummarySlide(pptx, contentJson)

  for (const sec of contentJson.sections ?? []) {
    const title = sec.title ?? sec.section_name ?? 'Sección'
    const content = sec.content ?? ''
    const chunks = splitIntoChunks(content, MAX_SECTION_CHARS)
    chunks.forEach((chunk, idx) => {
      addSectionSlide(pptx, title, chunk, idx === 0 ? sec.key_points : undefined, idx > 0)
    })
  }

  addRecommendationsSlide(pptx, contentJson.recommendations ?? [])
  addRisksSlide(pptx, contentJson.risks ?? [])
}
