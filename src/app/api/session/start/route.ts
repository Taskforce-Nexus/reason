import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { project_id } = await req.json()

  if (!project_id) {
    return NextResponse.json({ error: 'project_id required' }, { status: 400 })
  }

  const supabase = await createClient()

  // 1. Verify project access
  const { data: project, error: projectErr } = await supabase
    .from('projects')
    .select('id, founder_brief')
    .eq('id', project_id)
    .single()

  if (projectErr || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // 2. Load pending deliverables ordered by deliverable_index
  const { data: documents, error: docsErr } = await supabase
    .from('project_documents')
    .select('id, name, key_question, composition, deliverable_index, status')
    .eq('project_id', project_id)
    .eq('status', 'pendiente')
    .order('deliverable_index', { ascending: true })

  if (docsErr || !documents || documents.length === 0) {
    return NextResponse.json(
      { error: 'No pending deliverables found. Run /api/compose first.' },
      { status: 400 }
    )
  }

  // 3. Close any existing active sessions for this project
  await supabase
    .from('sessions')
    .update({ status: 'pausada' })
    .eq('project_id', project_id)
    .eq('status', 'activa')

  // 4. Create new session
  const { data: session, error: sessionErr } = await supabase
    .from('sessions')
    .insert({
      project_id,
      status: 'activa',
      mode: 'normal',
      current_document_index: 0,
      current_question_index: 0,
      total_documents: documents.length,
    })
    .select()
    .single()

  if (sessionErr || !session) {
    return NextResponse.json({ error: sessionErr?.message ?? 'Failed to create session' }, { status: 500 })
  }

  // 5. Create a SessionPhase per deliverable
  //    Flatten all questions from composition.sections into the questions JSONB
  const phases = documents.map((doc, i) => {
    const composition = (doc.composition ?? {}) as {
      sections?: Array<{ title: string; description: string; questions: string[] }>
    }
    const sections = composition.sections ?? []

    // Build flat question list with section context
    const questions = sections.flatMap(sec =>
      (sec.questions ?? []).map(q => ({
        section_title: sec.title,
        section_description: sec.description,
        question: q,
      }))
    )

    return {
      session_id: session.id,
      document_id: doc.id,
      phase_index: i,
      status: i === 0 ? 'en_progreso' : 'pendiente',
      questions,
    }
  })

  const { data: insertedPhases, error: phasesErr } = await supabase
    .from('session_phases')
    .insert(phases)
    .select()

  if (phasesErr || !insertedPhases) {
    return NextResponse.json({ error: phasesErr?.message ?? 'Failed to create phases' }, { status: 500 })
  }

  // 6. Mark first document as en_progreso
  await supabase
    .from('project_documents')
    .update({ status: 'en_progreso' })
    .eq('id', documents[0].id)

  // 7. Update project phase
  await supabase
    .from('projects')
    .update({ current_phase: 'sesion_consejo' })
    .eq('id', project_id)

  // Build response
  const phasesWithDocs = insertedPhases.map((phase, i) => ({
    ...phase,
    document: documents[i],
  }))

  return NextResponse.json({
    session,
    phases: phasesWithDocs,
    current_phase: phasesWithDocs[0],
  })
}
