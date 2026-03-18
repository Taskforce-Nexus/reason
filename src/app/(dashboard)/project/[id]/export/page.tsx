import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ExportCenter from '@/components/export/ExportCenter'
import type { Project } from '@/lib/types'

export default async function ExportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!project) notFound()

  const { data: documents } = await supabase
    .from('project_documents')
    .select('id, name, key_question, composition, deliverable_index, status, generated_at, content_json')
    .eq('project_id', id)
    .order('deliverable_index', { ascending: true, nullsFirst: true })

  return (
    <ExportCenter
      project={project as Project}
      documents={(documents ?? []) as ExportDocument[]}
    />
  )
}

export interface ExportDocument {
  id: string
  name: string
  key_question: string | null
  composition: {
    sections?: Array<{ title: string; description: string; questions: string[] }>
  } | null
  deliverable_index: number | null
  status: string
  generated_at: string | null
  content_json: ContentJson | null
}

export interface ContentJson {
  title?: string
  key_question_answer?: string
  sections?: Array<{ title?: string; section_name?: string; content: string; key_points?: string[] }>
  key_insights?: string[]
  recommendations?: string[]
  risks?: string[]
}
