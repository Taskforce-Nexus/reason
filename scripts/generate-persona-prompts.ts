import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const MODEL = 'claude-haiku-4-5-20251001'
const CONCURRENCY = 5

function getFewShotExample(): string {
  const filepath = path.join(__dirname, 'few-shot-examples', 'buyer_persona.txt')
  return fs.readFileSync(filepath, 'utf-8')
}

function buildPromptForPersona(persona: Record<string, unknown>): string {
  const fewShot = getFewShotExample()

  return `Genera un system prompt para una buyer persona IA. El prompt debe hacer que Claude SE CONVIERTA en esa persona — con sus sesgos, lenguaje, objeciones y forma de evaluar. No es un perfil analítico — es una PERSONA que habla en primera persona con sus propios miedos y motivaciones.

EJEMPLO DE REFERENCIA (sigue esta estructura EXACTAMENTE — misma voz, mismo nivel de detalle, misma extensión):
---
${fewShot}
---

AHORA genera un prompt del MISMO calibre para esta buyer persona:

Nombre/Arquetipo: ${persona.name || persona.archetype_label || ''}
Etiqueta de arquetipo: ${persona.archetype_label || ''}
Demografía: ${JSON.stringify(persona.demographics || {})}
Cita representativa: ${persona.quote || ''}
Necesidades/Jobs to be done: ${JSON.stringify(persona.needs || [])}
Miedos y objeciones: ${JSON.stringify(persona.fears_objections || [])}
Canales de descubrimiento: ${JSON.stringify(persona.discovery_channels || [])}
Alternativas actuales: ${JSON.stringify(persona.current_alternatives || [])}
Journey de compra: ${JSON.stringify(persona.purchase_journey || {})}
Tags de comportamiento: ${JSON.stringify(persona.behavior_tags || [])}

REGLAS CRÍTICAS:
- El prompt hace que Claude HABLE COMO esta persona, no que la describa
- Incluir la cita representativa como mantra que define su voz
- Incluir sus alternativas actuales concretas (qué usa hoy)
- Sus objeciones deben ser específicas y reales, no genéricas
- Su lenguaje refleja su perfil (técnico, ejecutivo, emprendedor, etc.)
- Habla en español salvo que el perfil indique otro idioma
- Al final: instrucciones de comportamiento en sesión — cómo responde cuando Nexo lo invoca

RESPONDE SOLO CON EL SYSTEM PROMPT. Sin explicaciones, sin markdown, sin formato especial.`
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<void>
): Promise<void> {
  let currentIndex = 0
  const total = items.length

  async function worker() {
    while (currentIndex < total) {
      const index = currentIndex++
      const item = items[index]
      try {
        await fn(item, index)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        console.error(`  ❌ Error [${index + 1}/${total}]: ${msg}`)
      }
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, total) }, () => worker())
  await Promise.all(workers)
}

async function main() {
  console.log(`🚀 [PERSONAS] Generating with Haiku + few-shot — ${CONCURRENCY} workers, 1s delay...`)

  const { data: personas, error } = await supabase
    .from('buyer_personas')
    .select('*')
    .or('system_prompt.is.null,system_prompt.eq.')
    .order('archetype_label', { ascending: true })

  if (error) {
    console.error('Error fetching buyer_personas:', error)
    process.exit(1)
  }

  const total = personas?.length ?? 0
  console.log(`Found ${total} buyer personas without system_prompt\n`)

  let done = 0

  await runWithConcurrency(personas ?? [], CONCURRENCY, async (persona, index) => {
    const label = persona.archetype_label || persona.name || 'unknown'
    console.log(`[${index + 1}/${total}] ${label}`)

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8192,
      messages: [{ role: 'user', content: buildPromptForPersona(persona) }],
    })
    const prompt = (response.content[0] as { type: string; text: string }).text

    await supabase.from('buyer_personas').update({ system_prompt: prompt }).eq('id', persona.id)
    done++
    console.log(`  ✅ [${index + 1}/${total}] ${label} — ${prompt.length.toLocaleString()} chars`)
  })

  console.log(`\n✅ [PERSONAS] Complete. Generated ${done}/${total} prompts.`)
}

main().catch(console.error)
