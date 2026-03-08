# AURUM — Modelo de Incubación

La Incubadora es el corazón del sistema AURUM. Es donde el fundador convierte su idea en un venture estructurado a través de conversación guiada con un consejo asesor de IA.

No es una sesión de 60-90 minutos — es un proceso de incubación profunda (objetivo: 30 minutos o menos).

---

## Flujo de fases

### Fase 1 — Semilla (1:1 Nexo Constructivo + Fundador)

Nexo Constructivo entiende al fundador al 100%:

- idea

- experiencia del fundador

- recursos disponibles

- visión y expectativas

- restricciones

Output de la fase: **Resumen del Fundador** — documento de referencia que se pasa a todas las fases siguientes.

### Fases 2–5 — Consejo (por cada documento AURUM)

Cada fase trabaja un documento:

- Fase 2 → Propuesta de Valor

- Fase 3 → Modelo de Negocio

- Fase 4 → Recorrido del Cliente

- Fase 5 → Plan de Negocio

*(Marca / Branding se maneja externamente — no aparece como fase de consejo)*

En cada fase: el consejo hace preguntas y plantea retos. Solo 2-3 roles hablan por turno.

---

## Mecanismo Nexo Dual

El sistema no expone directamente la respuesta de IA al fundador. Primero debate internamente:

```
Nexo Constructivo → redacta respuesta optimista basada en hechos
        ↓
Nexo Crítico → critica, identifica riesgos y debilidades
        ↓
Síntesis → produce resultado final
```

**Si coinciden:** el fundador ve **UN borrador mejorado**.
**Si no coinciden:** el fundador ve **DOS posiciones** y elige.

El resultado queda registrado en `proxy_responses` con campos:

- `draft_content` — borrador constructivo

- `critique_content` — crítica

- `final_content` — síntesis

- `agreement` — boolean

- `status` — pending | approved | discarded | chosen

---

## Modos de operación

| Modo | Descripción |
|------|-------------|
| **Normal** | Nexo Dual completo — debate + revisión del fundador |
| **Autopiloto** | Nexo Constructivo responde solo, sin debate ni revisión (velocidad) |
| **Levantar Mano** | El fundador habla directo al consejo, saltando el proxy — en cualquier momento |

---

## Flujo de revisión (Review Flow)

El fundador siempre tiene la última palabra. Puede:

- Aprobar el borrador

- Editar el borrador

- Elegir un lado (cuando hay desacuerdo)

- Hablar directo al consejo (Levantar Mano)

---

## Consejo Asesor — Modelo Seis Sombreros

Los sombreros son internos e invisibles al usuario. Solo orientan cómo razona cada rol.

### Pilar 1 — Deseabilidad del Cliente

| Rol | Emoji | Sombreros | Enfoque |
|-----|-------|-----------|---------|
| Investigación de Mercado | 📊 | Blanco + Negro | datos duros, mercado, riesgos competitivos |
| Experto UX | 🎨 | Rojo + Amarillo + Verde | emociones del usuario, valor percibido, creatividad, UX |

### Pilar 2 — Factibilidad de Ejecución

| Rol | Emoji | Sombreros | Enfoque |
|-----|-------|-----------|---------|
| Analista de Negocio | 📋 | Rojo + Verde | intuición de negocio, ejecución creativa, PM |
| Líder Técnico | 🔧 | Blanco + Negro | arquitectura, viabilidad técnica, alcance MVP |

### Pilar 3 — Viabilidad del Negocio

| Rol | Emoji | Sombreros | Enfoque |
|-----|-------|-----------|---------|
| Estratega de Negocio | 🎯 | Azul | orquestación, visión general, modelo de ingresos |
| Líder de Precios | 💰 | Blanco + Verde | economía unitaria, monetización creativa |

### Voz del Cliente

| Rol | Emoji | Participación | Enfoque |
|-----|-------|---------------|---------|
| Cliente | 👤 | 1-2 veces por fase, alto impacto | habla COMO el cliente objetivo |

### Cofundadores IA (Nexo Dual)

| Rol | Emoji | Función |
|-----|-------|---------|
| Nexo Constructivo | 🛠️ | redacta respuestas optimistas basadas en hechos |
| Nexo Crítico | ⚠️ | abogado del diablo — identifica riesgos y debilidades |

**Regla:** Solo 2-3 roles hablan por turno. El sistema decide cuáles son relevantes según el contexto.

**Tags en código (inglés):**
`[MARKET RESEARCH]`, `[UX EXPERT]`, `[BUSINESS ANALYST]`, `[TECHNICAL LEAD]`, `[BUSINESS STRATEGIST]`, `[PRICING LEAD]`, `[CUSTOMER]`, `[NEXO CONSTRUCTIVO]`, `[NEXO CRITICO]`

**Compatibilidad de legado:** conversaciones existentes con marcos/valeria/etc. se mapean automáticamente a los nuevos roles.

---

## Entrada por voz

- Web Speech API para input de voz

- 9 asesores con voces TTS distintas

- Barra de progreso + persistencia de sesión

---

## Los 5 documentos AURUM Framework

Generados al extraer conocimiento acumulado de todas las conversaciones de La Incubadora (5 llamadas Claude en oleadas de 2):

### 1. Canvas de Propuesta de Valor

- ICP (Ideal Customer Profile)

- Problemas del cliente

- Soluciones propuestas

- Modelo Kano (clasificación de features)

- Evaluación de encaje producto-mercado

### 2. Canvas de Modelo de Negocio

- Arquitectura de oferta

- Canales de distribución y adquisición

- Modelo de ingresos y pricing

- Economía unitaria

- Simulación Monte Carlo (sensibilidad)

### 3. Libro de Marca y Posicionamiento

- Misión, visión, valores

- Naming y categoría de mercado

- Mensajes clave y tono de voz

- Dirección de identidad visual

### 4. Mapa de Recorrido del Cliente

- Mejores acciones por etapa

- Recorridos actuales del cliente

- Puntos de fricción identificados

- Recorrido ideal propuesto

### 5. Plan de Negocio y Preparación

- 8 evaluaciones de preparación puntuadas 1-10

- Análisis de riesgos clave

- Decisión ir / no-ir (go / no-go)

- Próximos pasos recomendados

---

## Ruta en la app

`/project/[id]/incubadora`

Componentes en: `src/components/incubadora/`
Prompts del sistema en: `src/lib/prompts.ts`
Configuración de asesores en: `src/lib/advisors.ts`
