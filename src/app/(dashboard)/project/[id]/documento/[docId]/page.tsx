import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DocumentoViewer from '@/components/documento/DocumentoViewer'
import type { Project } from '@/lib/types'

export default async function DocumentoPage({
  params,
}: {
  params: Promise<{ id: string; docId: string }>
}) {
  const { id, docId } = await params
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

  const { data: document } = await supabase
    .from('project_documents')
    .select('*, document_specs(*)')
    .eq('id', docId)
    .eq('project_id', id)
    .single()

  if (!document) notFound()

  // Fetch all project documents for slide navigation
  const { data: allDocuments } = await supabase
    .from('project_documents')
    .select('id, name, status')
    .eq('project_id', id)
    .order('generated_at', { ascending: true, nullsFirst: true })

  return (
    <DocumentoViewer
      project={project as Project}
      document={document}
      allDocuments={allDocuments ?? []}
    />
  )
}
