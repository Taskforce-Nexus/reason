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

const ELEMENT_DESCRIPTIONS: Record<string, string> = {
  fuego: 'Directo y orientado a la acción. Confronta, empuja decisiones, no tolera ambigüedad. Va al punto sin rodeos.',
  agua: 'Empático y colaborativo. Busca consenso, valida emociones, propone alternativas suaves. Primero reconoce lo que funciona.',
  tierra: 'Analítico y basado en datos. Ancla en números, pide evidencia, es pragmático. Si no hay datos, lo señala.',
  aire: 'Visionario y explorador. Conecta ideas aparentemente no relacionadas, piensa en grande, desafía supuestos establecidos.',
}

const HAT_DESCRIPTIONS: Record<string, string> = {
  blanco: 'datos y hechos objetivos',
  rojo: 'emociones e intuición',
  negro: 'cautela y riesgos',
  amarillo: 'optimismo y beneficios',
  verde: 'creatividad y alternativas',
  azul: 'proceso y organización',
}

const FEW_SHOT_MAP: Record<string, string> = {
  estrategia: 'advisor_estrategia.txt',
  finanzas: 'advisor_finanzas.txt',
  legal: 'advisor_legal.txt',
  marketing: 'advisor_estrategia.txt',
  ventas: 'advisor_finanzas.txt',
  producto: 'cofounder_critico.txt',
  tecnologia: 'advisor_legal.txt',
  operaciones: 'advisor_estrategia.txt',
  industria: 'advisor_legal.txt',
}

function getFewShotExample(category: string): string {
  const filename = FEW_SHOT_MAP[category] || 'advisor_estrategia.txt'
  const filepath = path.join(__dirname, 'few-shot-examples', filename)
  return fs.readFileSync(filepath, 'utf-8')
}

function buildPromptForAdvisor(advisor: Record<string, unknown>): string {
  const fewShot = getFewShotExample(advisor.advisor_type as string || advisor.category as string || 'estrategia')
  const elementDesc = advisor.element ? (ELEMENT_DESCRIPTIONS[advisor.element as string] ?? '') : ''
  const hats = (advisor.hats as string[] ?? [])
  const hatsDesc = hats.map((h: string) => `${h} (${HAT_DESCRIPTIONS[h] ?? h})`).join(', ')

  return `Genera un system prompt para un consejero IA. El prompt debe tener la MISMA estructura, profundidad y extensión que el ejemplo de referencia.

EJEMPLO DE REFERENCIA (sigue esta estructura EXACTAMENTE — misma profundidad, mismo nivel de detalle, misma extensión):
---
${fewShot}
---

AHORA genera un prompt del MISMO calibre para este consejero:

Nombre: ${advisor.name}
Especialidad: ${advisor.specialty}
Categoría: ${advisor.advisor_type || advisor.category}
Elemento: ${advisor.element} — ${elementDesc}
Estilo de comunicación: ${advisor.communication_style}
Sombreros: ${hatsDesc}
Bio: ${advisor.bio || 'No disponible'}
Tags de especialidad: ${JSON.stringify(advisor.specialties_tags || [])}
Industrias: ${JSON.stringify(advisor.industries_tags || [])}
Experiencia: ${JSON.stringify(advisor.experience || [])}
Idioma: ${advisor.language || 'Español'}

REGLAS CRÍTICAS:
- El prompt debe tener la MISMA extensión que el ejemplo (3,000-5,000 palabras)
- Incluir conocimiento REAL del dominio: regulación específica, métricas y benchmarks con números, errores comunes con porcentajes, game theory del dominio, unknown unknowns
- NO generalidades — datos concretos y verificables
- Si la especialidad involucra regulación, incluir leyes y artículos reales
- Si involucra métricas, incluir rangos numéricos reales por industria/segmento
- El consejero habla en ${advisor.language || 'español'}

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
  console.log(`🚀 [ADVISORS] Generating with Haiku + few-shot — ${CONCURRENCY} workers, 1s delay...`)

  const { data: advisors, error } = await supabase
    .from('advisors')
    .select('*')
    .or('system_prompt.is.null,system_prompt.eq.')
    .order('advisor_type', { ascending: true })

  if (error) {
    console.error('Error fetching advisors:', error)
    process.exit(1)
  }

  const total = advisors?.length ?? 0
  console.log(`Found ${total} advisors without system_prompt\n`)

  let done = 0

  await runWithConcurrency(advisors ?? [], CONCURRENCY, async (advisor, index) => {
    const category = advisor.advisor_type || advisor.category || 'unknown'
    console.log(`[${index + 1}/${total}] ${advisor.name} — ${advisor.specialty} (${category})`)

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8192,
      messages: [{ role: 'user', content: buildPromptForAdvisor(advisor) }],
    })
    const prompt = (response.content[0] as { type: string; text: string }).text

    await supabase.from('advisors').update({ system_prompt: prompt }).eq('id', advisor.id)
    done++
    console.log(`  ✅ [${index + 1}/${total}] ${advisor.name} — ${prompt.length.toLocaleString()} chars`)
  })

  console.log(`\n✅ [ADVISORS] Complete. Generated ${done}/${total} prompts.`)
}

main().catch(console.error)
