'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  projectId: string
  initialPrompt?: string | null
}

export default function NexoCustomPromptEditor({ projectId, initialPrompt }: Props) {
  const [value, setValue] = useState(initialPrompt ?? '')
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function handleChange(v: string) {
    setValue(v)
    setDirty(v !== (initialPrompt ?? ''))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    await supabase
      .from('projects')
      .update({ nexo_custom_prompt: value || null })
      .eq('id', projectId)
    setSaving(false)
    setDirty(false)
    setSaved(true)
  }

  return (
    <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-5 mb-4">
      <p className="text-xs font-semibold text-[#8892A4] uppercase tracking-widest mb-1">Personalizar a Nexo</p>
      <p className="text-[11px] text-[#4A5568] mb-3 leading-relaxed">
        Agrega instrucciones adicionales para Nexo en este proyecto. Ejemplo: &ldquo;Siempre pregúntame sobre regulación antes de avanzar&rdquo; o &ldquo;Sé más directo, menos diplomático&rdquo;.
      </p>
      <textarea
        value={value}
        onChange={e => handleChange(e.target.value)}
        rows={4}
        className="w-full bg-[#070E22] border border-[#1E2A4A] rounded-lg p-3 text-xs text-[#e0e0e5] resize-y focus:outline-none focus:border-[#B8860B]/50 transition-colors"
        placeholder="Instrucciones adicionales para Nexo en este proyecto..."
      />
      <div className="flex items-center gap-3 mt-2">
        {dirty && (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-[#B8860B] hover:bg-[#a07509] text-[#0A1128] font-semibold text-xs px-4 py-1.5 rounded-lg transition-colors disabled:opacity-40"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        )}
        {saved && !dirty && (
          <span className="text-[11px] text-green-400">✓ Guardado</span>
        )}
      </div>
    </div>
  )
}
