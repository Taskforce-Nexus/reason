'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AdvisorProfile {
  id?: string
  name: string
  specialty?: string | null
  bio?: string | null
  communication_style?: string | null
  specialties_tags?: string[] | null
  industries_tags?: string[] | null
  experience?: string[] | null
  system_prompt?: string | null
  // For specialists/ICPs (non-advisor catalog entries)
  justification?: string
  archetype?: string
  demographics?: string
  quote?: string
}

interface Props {
  profile: AdvisorProfile | null
  isOpen: boolean
  onClose: () => void
  type?: 'advisor' | 'cofounder' | 'specialist' | 'persona'
}

export default function AdvisorProfileDrawer({ profile, isOpen, onClose, type = 'advisor' }: Props) {
  const [promptText, setPromptText] = useState<string>('')
  const [isDirty, setIsDirty] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)

  // Sync promptText when profile changes
  const effectivePrompt = isDirty ? promptText : (profile?.system_prompt ?? '')

  function handlePromptChange(val: string) {
    setPromptText(val)
    setIsDirty(val !== (profile?.system_prompt ?? ''))
    setSavedOk(false)
  }

  async function handleGenerate() {
    if (!profile?.id) return
    setGenerating(true)
    try {
      const endpoint = type === 'cofounder'
        ? '/api/cofounders/generate-prompt'
        : '/api/advisors/generate-prompt'
      const bodyKey = type === 'cofounder' ? 'cofounder_id' : 'advisor_id'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [bodyKey]: profile.id }),
      })
      const data = await res.json()
      if (data.prompt) {
        setPromptText(data.prompt)
        setIsDirty(false)
        setSavedOk(true)
        // Update profile in-place
        if (profile) profile.system_prompt = data.prompt
      }
    } catch (e) {
      console.error('Generate prompt error:', e)
    }
    setGenerating(false)
  }

  async function handleSave() {
    if (!profile?.id || !isDirty) return
    setSaving(true)
    try {
      const supabase = createClient()
      const table = type === 'cofounder' ? 'cofounders' : type === 'specialist' ? 'specialists' : 'advisors'
      await supabase
        .from(table)
        .update({ system_prompt: promptText })
        .eq('id', profile.id)
      setIsDirty(false)
      setSavedOk(true)
      if (profile) profile.system_prompt = promptText
    } catch (e) {
      console.error('Save prompt error:', e)
    }
    setSaving(false)
  }

  if (!isOpen || !profile) return null

  const canEditPrompt = (type === 'advisor' || type === 'cofounder' || type === 'specialist') && !!profile.id
  const currentPromptValue = isDirty ? promptText : (profile.system_prompt ?? '')

  // suppress unused variable warning
  void effectivePrompt

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-[440px] h-full bg-[#0D1535] border-l border-[#1E2A4A] p-6 overflow-y-auto flex flex-col gap-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8892A4] hover:text-white transition-colors"
        >
          ✕
        </button>

        {/* Header */}
        <div>
          <h2 className="text-[18px] font-outfit font-bold text-white pr-6">{profile.name}</h2>
          {profile.specialty && (
            <p className="text-sm text-[#B8860B] mt-0.5">{profile.specialty}</p>
          )}
          {profile.archetype && (
            <p className="text-xs text-[#8892A4] mt-1">{profile.archetype}</p>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <div>
            <p className="text-xs text-[#8892A4] uppercase tracking-wider mb-1">Sobre este consejero</p>
            <p className="text-sm text-[#e0e0e5] leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Justification (specialists) */}
        {profile.justification && (
          <div>
            <p className="text-xs text-[#8892A4] uppercase tracking-wider mb-1">Por qué es relevante</p>
            <p className="text-sm text-[#e0e0e5] leading-relaxed">{profile.justification}</p>
          </div>
        )}

        {/* Demographics (personas) */}
        {profile.demographics && (
          <div>
            <p className="text-xs text-[#8892A4] uppercase tracking-wider mb-1">Perfil demográfico</p>
            <p className="text-sm text-[#e0e0e5] leading-relaxed">{profile.demographics}</p>
          </div>
        )}

        {/* Quote (personas) */}
        {profile.quote && (
          <div className="bg-[#0A1128] border border-[#B8860B]/20 rounded-lg px-4 py-3">
            <p className="text-sm text-[#B8860B]/80 italic leading-relaxed">{profile.quote}</p>
          </div>
        )}

        {/* Communication style */}
        {profile.communication_style && (
          <div>
            <p className="text-xs text-[#8892A4] uppercase tracking-wider mb-1">Estilo de comunicación</p>
            <p className="text-sm text-[#F8F8F8] italic">&ldquo;{profile.communication_style}&rdquo;</p>
          </div>
        )}

        {/* Specialties */}
        {profile.specialties_tags && profile.specialties_tags.length > 0 && (
          <div>
            <p className="text-xs text-[#8892A4] uppercase tracking-wider mb-2">Especialidades</p>
            <div className="flex flex-wrap gap-2">
              {profile.specialties_tags.map((tag: string) => (
                <span key={tag} className="px-2 py-1 text-xs bg-[#1E2A4A] text-[#8892A4] rounded">{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* Industries */}
        {profile.industries_tags && profile.industries_tags.length > 0 && (
          <div>
            <p className="text-xs text-[#8892A4] uppercase tracking-wider mb-2">Industrias</p>
            <div className="flex flex-wrap gap-2">
              {profile.industries_tags.map((tag: string) => (
                <span key={tag} className="px-2 py-1 text-xs bg-[#1E2A4A] text-[#8892A4] rounded">{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {profile.experience && profile.experience.length > 0 && (
          <div>
            <p className="text-xs text-[#8892A4] uppercase tracking-wider mb-2">Experiencia</p>
            <ul className="space-y-1.5">
              {profile.experience.map((exp: string, i: number) => (
                <li key={i} className="flex gap-2 text-sm text-[#8892A4]">
                  <span className="text-[#B8860B] shrink-0 mt-0.5">·</span>
                  {exp}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* System prompt editor */}
        {canEditPrompt && (
          <div className="border-t border-[#1E2A4A] pt-5">
            <p className="text-xs text-[#8892A4] uppercase tracking-wider mb-1">Instrucciones del consejero</p>
            <p className="text-[11px] text-[#4A5568] mb-3">
              Puedes editar estas instrucciones para ajustar cómo este consejero se comporta en tu Sesión de Consejo.
            </p>

            {generating ? (
              <div className="min-h-[180px] bg-[#070E22] border border-[#1E2A4A] rounded-lg p-3 animate-pulse space-y-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-3 bg-[#1E2A4A] rounded" style={{ width: `${60 + i * 10}%` }} />
                ))}
              </div>
            ) : (
              <textarea
                value={currentPromptValue}
                onChange={e => handlePromptChange(e.target.value)}
                rows={15}
                className="w-full bg-[#070E22] border border-[#1E2A4A] rounded-lg p-3 text-xs text-[#e0e0e5] font-mono resize-y focus:outline-none focus:border-[#B8860B]/50 transition-colors"
                placeholder="Este consejero aún no tiene instrucciones personalizadas. Haz clic en Generar para crear unas basadas en su perfil."
              />
            )}

            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="flex-1 bg-[#B8860B] hover:bg-[#a07509] text-[#0A1128] font-semibold text-xs py-2 rounded-lg transition-colors disabled:opacity-40"
              >
                {generating ? 'Generando...' : currentPromptValue ? 'Regenerar automáticamente' : 'Generar automáticamente'}
              </button>
              {isDirty && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 border border-[#B8860B]/50 text-[#B8860B] font-semibold text-xs py-2 rounded-lg hover:bg-[#B8860B]/10 transition-colors disabled:opacity-40"
                >
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              )}
            </div>
            {savedOk && !isDirty && (
              <p className="text-[11px] text-green-400 mt-1 text-center">✓ Instrucciones guardadas</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
