'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import GitHubOnboardingWizard from './GitHubOnboardingWizard'

interface Props {
  userId: string
  organizationId: string
  primary?: boolean
}

export default function NewProjectButton({ userId, organizationId, primary }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1)
  const supabase = createClient()

  async function getGitHubStep(): Promise<1 | 2> {
    const { data } = await supabase
      .from('user_integrations')
      .select('id')
      .eq('user_id', userId)
      .eq('provider', 'github')
      .maybeSingle()
    return data ? 2 : 1
  }

  async function handleOpen() {
    const step = await getGitHubStep()
    setWizardStep(step)
    setOpen(true)
  }

  // Detect return from GitHub OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('github') === 'connected') {
      window.history.replaceState({}, '', window.location.pathname)
      setWizardStep(2)
      setOpen(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (open) {
    return (
      <GitHubOnboardingWizard
        initialStep={wizardStep}
        projectName={name}
        onSetProjectName={setName}
        organizationId={organizationId}
        userId={userId}
        onCancel={() => { setOpen(false); setWizardStep(1); setName('') }}
      />
    )
  }

  return (
    <button type="button" onClick={handleOpen}
      className={`font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors ${
        primary
          ? 'bg-[#C9A84C] hover:bg-[#b8963f] text-[#0F0F11]'
          : 'bg-[#C9A84C] hover:bg-[#b8963f] text-[#0F0F11]'
      }`}>
      + Nuevo Proyecto
    </button>
  )
}
