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
  const filepath = path.join(__dirname, 'few-shot-examples', 'specialist_industria.txt')
  return fs.readFileSync(filepath, 'utf-8')
}

function buildPromptForSpecialist(specialist: Record<string, unknown>): string {
  const fewShot = getFewShotExample()

  return `Genera un system prompt para un especialista IA de industria. El prompt debe tener la MISMA estructura, profundidad y extensión que el ejemplo de referencia.

EJEMPLO DE REFERENCIA (sigue esta estructura EXACTAMENTE — misma profundidad, mismo nivel de detalle, misma extensión):
---
${fewShot}
---

AHORA genera un prompt del MISMO calibre para este especialista:

Nombre: ${specialist.name}
Especialidad: ${specialist.specialty}
Categoría: ${specialist.category_tag || ''}
Justificación: ${specialist.justification || ''}
Bio: ${specialist.bio || 'No disponible'}
Tags de especialidad: ${JSON.stringify(specialist.specialties_tags || [])}
Industrias: ${JSON.stringify(specialist.industries_tags || [])}
Experiencia: ${JSON.stringify(specialist.experience || [])}
Idioma: ${specialist.language || 'Español'}

REGLAS CRÍTICAS:
- El prompt debe tener la MISMA extensión que el ejemplo (2,500-4,000 palabras)
- Incluir conocimiento regulatorio REAL de la industria: leyes específicas, artículos, organismos reguladores, sanciones
- Métricas sectoriales con números reales: rangos, benchmarks, red flags cuantitativos
- Errores de compliance comunes con porcentajes de incidencia
- Game theory entre actores del sector: regulador vs regulado, competidores, incumbentes
- Unknown unknowns: lo que el founder ni sabe que debería preguntar sobre esta industria
- El especialista habla en ${specialist.language || 'español'}

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
  console.log(`🚀 [SPECIALISTS] Generating with Haiku + few-shot — ${CONCURRENCY} workers, 1s delay...`)

  const { data: specialists, error } = await supabase
    .from('specialists')
    .select('*')
    .or('system_prompt.is.null,system_prompt.eq.')
    .order('category_tag', { ascending: true })

  if (error) {
    console.error('Error fetching specialists:', error)
    process.exit(1)
  }

  const total = specialists?.length ?? 0
  console.log(`Found ${total} specialists without system_prompt\n`)

  let done = 0

  await runWithConcurrency(specialists ?? [], CONCURRENCY, async (specialist, index) => {
    console.log(`[${index + 1}/${total}] ${specialist.name} — ${specialist.specialty} (${specialist.category_tag})`)

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8192,
      messages: [{ role: 'user', content: buildPromptForSpecialist(specialist) }],
    })
    const prompt = (response.content[0] as { type: string; text: string }).text

    await supabase.from('specialists').update({ system_prompt: prompt }).eq('id', specialist.id)
    done++
    console.log(`  ✅ [${index + 1}/${total}] ${specialist.name} — ${prompt.length.toLocaleString()} chars`)
  })

  console.log(`\n✅ [SPECIALISTS] Complete. Generated ${done}/${total} prompts.`)
}

main().catch(console.error)
