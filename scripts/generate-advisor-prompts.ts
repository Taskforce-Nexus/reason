import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

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

const GENERATE_ADVISOR_PROMPT = `Genera un system prompt EXHAUSTIVO y PROFUNDO para un consejero IA que va a operar dentro de una sesión de consejo estratégico.

PERFIL DEL CONSEJERO:
Nombre: {name}
Especialidad: {specialty}
Categoría: {category}
Elemento de comunicación: {element} — {element_description}
Estilo: {communication_style}
Sombreros de pensamiento: {hats_description}
Bio: {bio}
Tags de especialidad: {specialties_tags}
Industrias: {industries_tags}
Experiencia: {experience}
Idioma: {language}

EL PROMPT DEBE CONTENER (en este orden):

1. IDENTIDAD (200 palabras)
   - Quién es esta persona, su trayectoria, su reputación
   - Su filosofía de trabajo y principios no negociables
   - Cómo su elemento y sombreros definen su forma de pensar y comunicar

2. CONOCIMIENTO PROFUNDO DEL DOMINIO (1,500-2,500 palabras)
   Este es el bloque más importante. NO es una lista de temas — es el CONOCIMIENTO REAL.

   - Frameworks y metodologías que domina con explicación de cuándo y cómo aplicar cada uno
   - Regulación específica si aplica: leyes reales, artículos, normas, organismos reguladores
   - Métricas y benchmarks del sector: números reales, rangos típicos, red flags
   - Errores comunes que detecta inmediatamente: los que comete el 90% de los novatos
   - Trampas y riesgos ocultos que solo un experto conoce: los unknown unknowns
   - Patrones que ha visto repetirse en su carrera
   - Casos de referencia que cita: ficticios pero realistas con datos concretos
   - Game theory de su dominio: interacciones entre actores, incentivos, equilibrios, cuándo conviene qué
   - Lo que la mayoría no sabe pero debería saber sobre su especialidad
   - Las preguntas que SIEMPRE hace al evaluar un caso nuevo
   - Las señales de alerta que busca antes de que el cliente las vea
   - Cómo piensa sobre riesgo vs oportunidad en su área

3. COMPORTAMIENTO EN SESIÓN (300 palabras)
   - Cómo interviene: cuándo habla, cuándo escucha, cuándo interrumpe
   - Cómo interactúa con otros consejeros: complementa, contradice, profundiza
   - Su nivel de intensidad según la situación
   - Qué lo activa: temas donde siempre tiene algo que decir
   - Qué lo frustra: errores que no tolera

4. REGLAS OPERATIVAS (200 palabras)
   - Habla en español o el idioma indicado
   - Sus intervenciones son densas pero concisas: 4-6 oraciones con sustancia
   - Siempre aporta desde su especialidad — no opina de todo
   - Si algo no es su área, lo dice y sugiere quién debería responder
   - Cita datos y benchmarks cuando los tiene
   - Si detecta un riesgo crítico, lo señala aunque nadie haya preguntado

REGLAS PARA TI AL GENERAR:
- Mínimo 3,000 palabras, idealmente 4,000-5,000
- El prompt debe hacer que Claude SE CONVIERTA en este experto con conocimiento real
- NO uses lenguaje meta como "Eres un modelo de lenguaje" o "Tu rol es simular"
- Escribe como si fuera el briefing interno de un socio senior de McKinsey sobre esta persona
- El conocimiento debe ser REAL y VERIFICABLE — no generalidades
- Si la especialidad es regulación fintech en México, incluye las leyes y artículos reales
- Si es unit economics, incluye los rangos reales de CAC/LTV por industria
- Si es game theory, incluye los modelos reales con aplicación a negocio
- Incluye los unknown unknowns — lo que el usuario ni sabe que debería preguntar

RESPONDE SOLO CON EL SYSTEM PROMPT. Sin explicaciones, sin markdown, sin formato especial. Solo el texto del prompt.`

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function generateForAdvisor(advisor: Record<string, unknown>): Promise<string> {
  const elementDesc = advisor.element ? (ELEMENT_DESCRIPTIONS[advisor.element as string] ?? '') : ''
  const hats = (advisor.hats as string[] ?? [])
  const hatsDesc = hats.map((h: string) => `${h} (${HAT_DESCRIPTIONS[h] ?? h})`).join(', ')

  const metaPrompt = GENERATE_ADVISOR_PROMPT
    .replace('{name}', (advisor.name as string) ?? '')
    .replace('{specialty}', (advisor.specialty as string) ?? '')
    .replace('{category}', (advisor.category as string) ?? '')
    .replace('{element}', (advisor.element as string) ?? '')
    .replace('{element_description}', elementDesc)
    .replace('{communication_style}', (advisor.communication_style as string) ?? '')
    .replace('{hats_description}', hatsDesc)
    .replace('{bio}', (advisor.bio as string) ?? '')
    .replace('{specialties_tags}', JSON.stringify(advisor.specialties_tags ?? []))
    .replace('{industries_tags}', JSON.stringify(advisor.industries_tags ?? []))
    .replace('{experience}', JSON.stringify(advisor.experience ?? []))
    .replace('{language}', (advisor.language as string) ?? 'Español')

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: metaPrompt,
    messages: [{ role: 'user', content: 'Genera el system prompt para este consejero.' }],
  })

  return (response.content[0] as { type: string; text: string }).text
}

async function main() {
  console.log('🚀 Generating advisor system prompts (resumable)...')

  // Fetch advisors missing system_prompt
  const { data: advisors, error } = await supabase
    .from('advisors')
    .select('*')
    .or('system_prompt.is.null,system_prompt.eq.')
    .order('category', { ascending: true })

  if (error) {
    console.error('Error fetching advisors:', error)
    process.exit(1)
  }

  console.log(`Found ${advisors?.length ?? 0} advisors without system_prompt`)

  let done = 0
  for (const advisor of (advisors ?? [])) {
    try {
      console.log(`[${done + 1}/${advisors!.length}] Generating for: ${advisor.name} (${advisor.category} / ${advisor.specialty})`)
      const prompt = await generateForAdvisor(advisor)

      await supabase
        .from('advisors')
        .update({ system_prompt: prompt })
        .eq('id', advisor.id)

      done++
      console.log(`  ✅ Done (${prompt.length} chars)`)

      // Rate limit: 3s between calls
      await sleep(3000)
    } catch (e) {
      console.error(`  ❌ Error for ${advisor.name}:`, e)
      await sleep(5000)
    }
  }

  console.log(`\n✅ Complete. Generated ${done} prompts.`)
}

main().catch(console.error)
