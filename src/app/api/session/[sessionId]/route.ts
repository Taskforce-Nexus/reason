import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params
  const supabase = await createClient()

  // 1. Load session
  const { data: session, error: sessionErr } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (sessionErr || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // 2. Load all phases with their documents
  const { data: phases, error: phasesErr } = await supabase
    .from('session_phases')
    .select('*, document:project_documents(id, name, key_question, composition, status, content_json)')
    .eq('session_id', sessionId)
    .order('phase_index', { ascending: true })

  if (phasesErr || !phases) {
    return NextResponse.json({ error: 'Failed to load phases' }, { status: 500 })
  }

  // 3. Identify current phase
  const currentPhase = phases.find(p => p.phase_index === session.current_document_index) ?? phases[0]

  // 4. Load NexoDualResponses for current phase
  let dualResponses: unknown[] = []
  if (currentPhase) {
    const { data: responses } = await supabase
      .from('nexo_dual_responses')
      .select('*')
      .eq('phase_id', currentPhase.id)
      .order('question_index', { ascending: true })

    dualResponses = responses ?? []
  }

  // 5. Build current phase detail
  const currentPhaseDetail = currentPhase
    ? {
        ...currentPhase,
        dual_responses: dualResponses,
        current_question_index: session.current_question_index,
        current_question: currentPhase.questions
          ? (currentPhase.questions as Array<{ question: string }>)[session.current_question_index] ?? null
          : null,
      }
    : null

  return NextResponse.json({
    session: {
      id: session.id,
      project_id: session.project_id,
      status: session.status,
      mode: session.mode,
      current_document_index: session.current_document_index,
      current_question_index: session.current_question_index,
      total_documents: session.total_documents,
      created_at: session.created_at,
      completed_at: session.completed_at,
    },
    phases: phases.map(p => ({
      id: p.id,
      phase_index: p.phase_index,
      status: p.status,
      document_id: p.document_id,
      document_name: (p.document as { name: string } | null)?.name ?? null,
      question_count: Array.isArray(p.questions) ? (p.questions as unknown[]).length : 0,
      started_at: p.started_at,
      completed_at: p.completed_at,
    })),
    current_phase: currentPhaseDetail,
  })
}
