import { redirect } from 'next/navigation'

export default async function IncubadoraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/project/${id}/seed-session`)
}
