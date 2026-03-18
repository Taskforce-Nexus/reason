# Reason — Framework Engine

Motor de inteligencia de Nexo para diagnóstico, composición de entregables
y generación dinámica de preguntas.

Este documento reemplaza la Document Specification Library estática.
Es la pieza más importante de la arquitectura de Reason.

---

## Principio fundamental

Reason no es un generador de planes de negocio.
Reason es un consultor estratégico que sabe qué entregables necesita cada situación.

Nexo opera como un socio senior de consultoría:
1. Escucha al cliente (Semilla)
2. Diagnostica la situación
3. Propone los entregables exactos que el caso necesita
4. Ejecuta con su equipo de consejeros (Sesión de Consejo)
5. Entrega documentos listos para actuar

No hay menú fijo de documentos. No hay lista cerrada de frameworks.
Nexo COMPONE entregables a la medida usando su conocimiento de cientos
de herramientas de análisis, frameworks estratégicos y metodologías.

Las preguntas de la Sesión de Consejo tampoco son fijas.
Nexo las construye dinámicamente según el entregable, el contexto
del usuario y la especialidad de los consejeros activos.

---

## 2. Diagnóstico situacional

Después de Semilla, Nexo tiene el Resumen del Fundador.
De ese resumen extrae las variables que determinan qué entregables proponer.

### Variables de diagnóstico

| Variable | Extraída de | Ejemplos |
|---|---|---|
| Naturaleza de la decisión | Declaración directa del usuario | "Quiero lanzar un negocio", "Necesito evaluar si entro a Brasil", "Quiero detectar fraude en mis estados financieros" |
| Fase del usuario | Contexto de experiencia | Pre-idea, idea cruda, negocio existente, empresa consolidada, corporativo |
| Industria / vertical | Contexto del negocio | SaaS, construcción, alimentos, fintech, manufactura, servicios profesionales |
| Recursos disponibles | Restricciones declaradas | Presupuesto, equipo, tiempo, infraestructura existente |
| Nivel de sofisticación | Cómo habla el usuario | Founder primerizo vs CFO con 20 años vs director de innovación corporativa |
| Urgencia | Tono y contexto | "Necesito decidir esta semana" vs "Estoy explorando opciones a 2 años" |
| Alcance | Magnitud de la decisión | Una feature vs un producto vs una empresa vs una división |
| Stakeholders | Quién más está involucrado | Solo el founder, un board, inversionistas, equipo directivo |
| Output esperado | Qué quiere llevarse | "Un plan completo", "Solo necesito los números", "Quiero validar con clientes", "Necesito una presentación para mi board" |

### Regla de diagnóstico

Nexo NO le pregunta al usuario "¿qué tipo de documento quieres?"
Nexo infiere qué necesita basándose en las variables anteriores
y PROPONE los entregables. El usuario valida o ajusta en lenguaje natural.

Si el diagnóstico es ambiguo, Nexo hace 1-2 preguntas de clarificación
DENTRO del flujo de Semilla — no en una pantalla separada.

---

## 3. Taxonomía de herramientas de Nexo

Nexo tiene acceso al conocimiento completo de Claude sobre herramientas
de consultoría, análisis cuantitativo, frameworks estratégicos y metodologías.

Esta taxonomía NO es una lista cerrada. Es una organización del conocimiento
que ayuda a Nexo a navegar sus capacidades. Claude conoce cientos de herramientas
más allá de las listadas aquí — la taxonomía es orientativa, no exhaustiva.

### 3.1 Frameworks de estrategia y posicionamiento

| Herramienta | Cuándo aplica |
|---|---|
| Business Model Canvas | Diseñar o evaluar modelo de negocio completo |
| Lean Canvas | Startup early-stage, validación rápida de hipótesis |
| Value Proposition Canvas | Encaje problema-solución, propuesta de valor |
| Blue Ocean Strategy Canvas | Buscar espacio de mercado no competido |
| Ansoff Matrix | Decidir dirección de crecimiento (mercado/producto nuevo vs existente) |
| Porter's Five Forces | Evaluar atractivo de una industria o mercado |
| PESTEL Analysis | Factores macro que afectan la decisión |
| SWOT / CAME | Diagnóstico situacional rápido + plan de acción |
| McKinsey 7S | Alineación organizacional |
| BCG Matrix | Portfolio de productos o unidades de negocio |
| GE-McKinsey Matrix | Priorización de inversión por atractivo y posición competitiva |
| Balanced Scorecard | Traducir estrategia en métricas operativas |
| OKR Framework | Definir objetivos y resultados clave |
| Strategy Diamond (Hambrick & Fredrickson) | Articular estrategia completa: arenas, vehículos, diferenciadores, staging, lógica económica |
| Three Horizons (McKinsey) | Balancear innovación a corto, medio y largo plazo |
| Wardley Mapping | Mapear cadena de valor y evolución de componentes |

### 3.2 Análisis de mercado y competencia

| Herramienta | Cuándo aplica |
|---|---|
| TAM / SAM / SOM | Sizing de mercado — cuánto vale la oportunidad |
| Competitive Landscape Mapping | Mapear competidores por dimensiones relevantes |
| Análisis de Next Best Alternatives | Qué usa el cliente hoy para resolver el problema |
| Win/Loss Analysis Framework | Por qué ganas o pierdes contra competidores |
| Market Entry Assessment | Evaluar viabilidad de entrar a un mercado nuevo |
| Industry Value Chain Analysis | Dónde se crea y captura valor en la cadena |
| Jobs to be Done (JTBD) | Entender qué "trabajo" contrata el cliente |
| Diffusion of Innovation (Rogers) | Cómo se adopta la solución en el mercado |
| Kano Model | Categorizar features por impacto en satisfacción |

### 3.3 Cliente y audiencia

| Herramienta | Cuándo aplica |
|---|---|
| Buyer Persona Development | Perfilar arquetipos de cliente |
| Customer Journey Mapping | Mapear experiencia del cliente de punta a punta |
| Empathy Mapping | Entender qué piensa, siente, dice y hace el cliente |
| Voice of Customer (VoC) Framework | Capturar y estructurar feedback de clientes |
| Net Promoter Score Framework | Medir y diagnosticar lealtad de clientes |
| Customer Segmentation (RFM, behavioral, psychographic) | Segmentar base de clientes por comportamiento |
| Focus Group Design & Analysis | Diseñar investigación cualitativa con grupos de clientes |
| Survey Design Framework | Estructurar investigación cuantitativa |
| Conjoint Analysis | Evaluar preferencias y tradeoffs del cliente |
| Customer Lifetime Value Modeling | Modelar valor del cliente en el tiempo |

### 3.4 Modelos financieros y cuantitativos

| Herramienta | Cuándo aplica |
|---|---|
| P&L Proforma | Proyectar ingresos, costos, utilidad |
| Unit Economics (CAC, LTV, payback) | Evaluar viabilidad económica por cliente |
| DCF (Discounted Cash Flow) | Valuación de un negocio o proyecto |
| Break-even Analysis | Punto de equilibrio — cuándo se recupera la inversión |
| Sensitivity Analysis | Qué variables mueven más el resultado |
| Scenario Planning (best/base/worst) | Modelar escenarios futuros |
| Monte Carlo Simulation | Simulación probabilística de riesgos e incertidumbre |
| Real Options Analysis | Valorar flexibilidad estratégica y opcionalidad |
| Financial Ratio Analysis | Diagnosticar salud financiera de un negocio existente |
| Cohort Analysis | Analizar comportamiento de grupos de clientes en el tiempo |
| Benford's Law Analysis | Detectar anomalías o fraude en datos financieros |
| Regression Analysis | Identificar relaciones causales en datos |
| Pricing Optimization (Van Westendorp, Gabor-Granger) | Encontrar el precio óptimo |
| Cap Table Modeling | Modelar dilución y distribución de equity |
| Fundraising Financial Package | Preparar materiales financieros para inversionistas |

### 3.5 Producto y tecnología

| Herramienta | Cuándo aplica |
|---|---|
| Product Requirements Document (PRD) | Especificar qué construir |
| Product Concept Definition | Definir concepto de producto de alto nivel |
| Feature Prioritization (RICE, ICE, MoSCoW) | Decidir qué construir primero |
| Technology Assessment | Evaluar stack, viabilidad técnica, build vs buy |
| System Architecture Design | Diseñar arquitectura técnica |
| API Strategy | Definir estrategia de plataforma e integraciones |
| Data Architecture | Diseñar modelo de datos y flujo de información |
| MVP Definition | Definir mínimo viable para validar |
| Product Roadmap | Planificar evolución del producto |
| UX Architecture | Diseñar flujos y estructura de la interfaz |
| Design Sprint (Google Ventures) | Proceso de 5 días para validar ideas de producto |
| Build-Measure-Learn Loop | Ciclo de iteración lean |

### 3.6 Go-to-market y crecimiento

| Herramienta | Cuándo aplica |
|---|---|
| Go-to-Market Strategy | Plan integral de lanzamiento al mercado |
| Channel Strategy | Seleccionar y optimizar canales de distribución |
| Pricing Strategy Framework | Definir estrategia de precios |
| Sales Process Design | Diseñar proceso de venta |
| Growth Model (loops, flywheels) | Modelar motor de crecimiento |
| Funnel Analysis (AARRR / Pirate Metrics) | Diagnosticar embudo de conversión |
| Content Strategy Framework | Planificar estrategia de contenido |
| Partnership Strategy | Diseñar estrategia de alianzas |
| International Expansion Playbook | Plan para entrar a nuevos países |
| Referral System Design | Diseñar programa de referidos |
| Community-Led Growth Framework | Estrategia de crecimiento por comunidad |

### 3.7 Operaciones y ejecución

| Herramienta | Cuándo aplica |
|---|---|
| Operating Model Design | Diseñar modelo operativo |
| Process Mapping (SIPOC, swimlane) | Mapear y optimizar procesos |
| Supply Chain Design | Diseñar cadena de suministro |
| Capacity Planning | Planificar capacidad operativa |
| Quality Management Framework | Diseñar sistema de calidad |
| OKR / KPI Definition | Definir métricas de éxito |
| Team Structure Design (org chart) | Diseñar estructura organizacional |
| Hiring Plan | Plan de contratación |
| Vendor Selection Framework | Evaluar y seleccionar proveedores |
| Project Management Framework | Seleccionar metodología (agile, waterfall, hybrid) |
| Risk Register & Mitigation | Identificar y mitigar riesgos operativos |

### 3.8 Legal, regulatorio y compliance

| Herramienta | Cuándo aplica |
|---|---|
| Regulatory Landscape Analysis | Mapear regulación aplicable |
| IP Strategy (patents, trademarks, trade secrets) | Proteger propiedad intelectual |
| Data Privacy Assessment (GDPR, CCPA, LFPDPPP) | Evaluar cumplimiento de privacidad |
| Corporate Structure Design | Diseñar estructura societaria |
| Contract Framework | Definir contratos clave del negocio |
| Compliance Checklist by Industry | Verificar cumplimiento sectorial |
| Labor Law Assessment | Evaluar implicaciones laborales |
| Tax Strategy | Optimización fiscal legal |
| Licensing & Permits Roadmap | Mapear permisos y licencias necesarias |

### 3.9 Análisis avanzado y decisión

| Herramienta | Cuándo aplica |
|---|---|
| Game Theory Analysis | Modelar interacciones estratégicas entre actores |
| Decision Tree Analysis | Estructurar decisiones complejas con múltiples caminos |
| Multi-Criteria Decision Analysis (MCDA) | Evaluar opciones con múltiples criterios ponderados |
| Root Cause Analysis (5 Whys, Fishbone) | Diagnosticar causa raíz de un problema |
| Pareto Analysis (80/20) | Identificar los factores de mayor impacto |
| Theory of Constraints | Identificar y resolver cuellos de botella |
| Systems Thinking / Causal Loop Diagrams | Entender dinámicas de sistemas complejos |
| Stakeholder Analysis & Mapping | Mapear intereses y poder de los stakeholders |
| Force Field Analysis (Lewin) | Evaluar fuerzas a favor y en contra de un cambio |
| Pre-mortem Analysis | Anticipar por qué podría fallar antes de ejecutar |
| Red Team / Blue Team Exercise | Atacar la propia estrategia para fortalecerla |
| Delphi Method | Consenso de expertos para estimaciones inciertas |

### 3.10 Industria específica

| Herramienta | Cuándo aplica |
|---|---|
| Real Estate Feasibility Study | Evaluar factibilidad de desarrollo inmobiliario |
| Construction Pro Forma | Proyección financiera de proyecto de construcción |
| SaaS Metrics Dashboard (MRR, churn, NRR) | Métricas específicas de SaaS |
| Marketplace Liquidity Analysis | Evaluar dinámicas de oferta/demanda en marketplaces |
| Franchise Model Assessment | Evaluar modelo de franquicia |
| Clinical Trial Design Framework | Diseñar ensayos clínicos (healthtech/pharma) |
| Agricultural Yield Modeling | Modelar rendimiento agrícola |
| Insurance Actuarial Framework | Modelar riesgo actuarial |
| Logistics Network Optimization | Optimizar red logística |
| Restaurant Unit Economics | Economía unitaria para restaurantes/food service |
| E-commerce Conversion Optimization | Optimización de conversión para e-commerce |
| Media Content Strategy | Estrategia de contenido para medios |
| Energy Project Finance | Financiamiento de proyectos energéticos |

---

## 4. Cómo Nexo compone entregables

### 4.1 El proceso de composición

Después de Semilla, Nexo ejecuta este proceso internamente:

```
PASO 1 — Clasificar la decisión
  ¿Qué tipo de decisión enfrenta el usuario?
  → Crear algo nuevo
  → Evaluar una oportunidad
  → Optimizar algo existente
  → Resolver un problema
  → Validar una hipótesis
  → Tomar una decisión binaria (go/no-go)
  → Analizar un riesgo
  → Diseñar una estrategia
  → Otro (describir)

PASO 2 — Identificar las preguntas clave
  ¿Cuáles son las 3-7 preguntas que el usuario necesita
  responder para tomar su decisión con confianza?

  Ejemplo para "abrir vertical nueva en empresa existente":
  - ¿El mercado de la nueva vertical es lo suficientemente grande?
  - ¿Tengo las capacidades para competir ahí?
  - ¿Cuánto me cuesta entrar y cuándo recupero la inversión?
  - ¿Canibaliza mi negocio actual?
  - ¿Qué riesgos enfrento?

PASO 3 — Mapear preguntas a entregables
  Cada pregunta se resuelve con un entregable específico
  que usa uno o más frameworks como herramientas internas.

  Ejemplo:
  "¿El mercado es suficientemente grande?"
  → Entregable: Análisis de Oportunidad de Mercado
  → Frameworks internos: TAM/SAM/SOM + Five Forces + Competitive Landscape

  "¿Cuánto me cuesta y cuándo recupero?"
  → Entregable: Caso de Inversión
  → Frameworks internos: P&L Proforma + Break-even + Sensitivity Analysis

PASO 4 — Ordenar entregables
  Los entregables se ordenan por dependencia lógica.
  El output de uno alimenta el input del siguiente.

PASO 5 — Proponer al usuario
  Nexo presenta la propuesta de entregables con:
  - Nombre del entregable (lenguaje claro, no jerga de consultoría)
  - Qué pregunta responde (en una oración)
  - Secciones principales que tendrá
  - Qué consejeros contribuyen más

  El usuario valida, ajusta o rechaza en lenguaje natural.
```

### 4.2 Estructura de un entregable

Cada entregable que Nexo propone tiene esta estructura interna:

```json
{
  "name": "Análisis de Oportunidad de Mercado",
  "key_question": "¿El mercado de esta vertical es lo suficientemente grande y atractivo?",
  "frameworks_used": ["TAM/SAM/SOM", "Porter Five Forces", "Competitive Landscape"],
  "sections": [
    {
      "title": "Tamaño del mercado",
      "description": "TAM, SAM y SOM con fuentes y supuestos explícitos",
      "questions": [
        "¿Cuál es el mercado total direccionable para esta vertical?",
        "¿Qué porción es realista capturar en los primeros 2 años?",
        "¿El mercado está creciendo, estable o contrayéndose?"
      ]
    },
    {
      "title": "Dinámica competitiva",
      "description": "Quién compite, cómo compite, dónde hay espacio",
      "questions": [
        "¿Quiénes son los principales competidores en esta vertical?",
        "¿Qué diferenciador creíble tienes sobre ellos?",
        "¿Hay barreras de entrada significativas?"
      ]
    },
    {
      "title": "Atractivo de la industria",
      "description": "Evaluación de cinco fuerzas",
      "questions": [
        "¿Qué poder de negociación tienen los clientes en esta vertical?",
        "¿Qué tan fácil es que entren nuevos competidores?",
        "¿Existen sustitutos que amenacen la propuesta?"
      ]
    }
  ],
  "advisors_needed": ["estrategia", "industria_especifica", "finanzas"],
  "output_format": "Documento con datos, análisis y recomendación clara",
  "depends_on": [],
  "feeds_into": ["Caso de Inversión", "Estrategia de Entrada"]
}
```

### 4.3 Reglas de composición

1. **Mínimo 2, máximo 7 entregables** por sesión.
   Menos de 2 no justifica una Sesión de Consejo.
   Más de 7 pierde foco — mejor dividir en dos sesiones.

2. **Cada entregable responde UNA pregunta clave.**
   Si un entregable intenta responder 3 preguntas, se divide.

3. **Los entregables se encadenan.**
   El output de uno alimenta el input del siguiente.
   Nexo define el orden de dependencia.

4. **Los frameworks son herramientas internas, no visibles al usuario.**
   El usuario ve "Análisis de Oportunidad de Mercado".
   No ve "TAM/SAM/SOM + Porter Five Forces".
   Los frameworks son la cocina — el entregable es el plato.

5. **Los entregables usan lenguaje del usuario, no jerga de consultoría.**
   Si el usuario es un founder primerizo, "Estudio de factibilidad financiera"
   se convierte en "¿Los números dan? Proyección de costos e ingresos".
   Si el usuario es un CFO, se mantiene lenguaje técnico.

6. **Nexo puede combinar frameworks de distintas categorías.**
   Un entregable puede mezclar Game Theory + Financial Modeling + Stakeholder Analysis
   si eso es lo que la situación requiere.

7. **Si Nexo no conoce un framework específico para el caso, lo dice.**
   "Para este tipo de análisis regulatorio en tu industria específica,
   recomiendo complementar con un especialista externo en [X]."
   Honestidad > pretender que sabe todo.

---

## 5. Generación dinámica de preguntas

Las preguntas de la Sesión de Consejo NO son una lista fija.
Nexo las genera para cada entregable basándose en:

### 5.1 Inputs para generación de preguntas

1. **El framework subyacente** — cada framework tiene preguntas canónicas.
   Value Proposition Canvas siempre pregunta sobre jobs, pains, gains.
   DCF siempre pregunta sobre tasa de descuento y flujos proyectados.

2. **El contexto específico del usuario** — las preguntas se parametrizan.
   No es "¿Cuál es tu TAM?" genérico.
   Es "El mercado de software de gestión para constructoras en México
   — ¿cuántas constructoras activas hay y cuánto gastan en software?"

3. **Los consejeros activos** — cada consejero aporta preguntas desde su especialidad.
   El consejero de finanzas pregunta sobre unit economics.
   El consejero de la industria pregunta sobre regulación específica.
   El consejero de marketing pregunta sobre canales de adquisición.

4. **Las respuestas anteriores** — las preguntas evolucionan.
   Si el usuario ya respondió algo en la Semilla o en un entregable anterior,
   Nexo no vuelve a preguntar. Profundiza o pivotea.

### 5.2 Tipos de preguntas

| Tipo | Propósito | Ejemplo |
|---|---|---|
| Extracción | Obtener datos que el usuario tiene | "¿Cuántos clientes activos tienes hoy?" |
| Exploración | Descubrir lo que el usuario no ha pensado | "¿Has considerado que tu principal competidor no es otro software sino una hoja de Excel?" |
| Desafío | Cuestionar supuestos del usuario | "Dices que tu mercado es de $500M — ¿de dónde sale ese número?" |
| Validación | Confirmar hipótesis con el consejo | "Consejero de finanzas: ¿este margen bruto del 70% es realista para esta industria?" |
| Síntesis | Integrar información y avanzar | "Basándome en lo que has dicho, tu ICP principal parece ser X — ¿es correcto?" |
| Decisión | Forzar una elección cuando hay alternativas | "Tienes dos caminos: freemium o enterprise sales. El consejo se inclina por X porque Y — ¿vas con eso?" |

### 5.3 Flujo de preguntas en una fase

Cada fase de la Sesión de Consejo (= un entregable) sigue este flujo:

```
APERTURA
  Nexo presenta el entregable: qué es, qué pregunta responde, qué secciones tiene.

EXPLORACIÓN (por sección)
  Para cada sección del entregable:
  1. Nexo introduce la sección
  2. Los consejeros relevantes hacen preguntas (2-3 por turno)
  3. El usuario responde
  4. Nexo Dual procesa:
     - Constructivo propone redacción optimista
     - Crítico cuestiona y señala riesgos
     - Si coinciden → avanza
     - Si no → el usuario decide
  5. La sección se va llenando en tiempo real

CIERRE
  Nexo presenta el entregable completo.
  El usuario revisa y aprueba o pide ajustes.
  Si aprueba → se guarda y se avanza al siguiente entregable.
```

### 5.4 Cantidad de preguntas

No hay un número fijo de preguntas por entregable.
Nexo calibra según:
- **Complejidad del entregable** — un P&L Proforma necesita más preguntas que un SWOT
- **Información ya disponible** — si Semilla cubrió mucho, menos preguntas
- **Modo de operación** — Autopiloto hace menos preguntas, Normal hace más
- **Respuestas del usuario** — si el usuario da respuestas profundas, Nexo avanza más rápido

Rango típico: 5-15 preguntas por entregable.
Un entregable simple (SWOT) puede resolverse en 5.
Un entregable complejo (Business Model completo) puede necesitar 15-20.

---

## 6. Integración con consejeros

### 6.1 Selección de consejeros por entregable

Nexo selecciona qué consejeros participan en cada entregable
basándose en el campo `advisors_needed` de la composición.

Regla existente: solo 2-3 consejeros hablan por turno.
Nexo decide cuáles son los más relevantes para cada sección específica.

### 6.2 Rol de los consejeros en las preguntas

Los consejeros no solo responden — también preguntan.
Cada consejero aporta preguntas desde su especialidad:

```
Entregable: Caso de Inversión para nueva vertical

Consejero de finanzas pregunta:
  "¿Cuál es tu costo de capital? ¿Tienes alternativas de inversión
   que compitan por el mismo presupuesto?"

Consejero de industria pregunta:
  "En construcción, los ciclos de venta son de 6-12 meses.
   ¿Tu proyección de ingresos refleja eso?"

Consejero de estrategia pregunta:
  "Si esta vertical funciona, ¿canibaliza tu negocio actual
   o lo complementa? ¿Has modelado ambos escenarios?"
```

### 6.3 Buyer Personas como validadores

Cuando un entregable involucra perspectiva de cliente
(propuesta de valor, customer journey, pricing),
Nexo activa Buyer Personas del consejo para simular reacciones.

---

## 7. Ejemplos de composición por caso

### Caso 1: Founder quiere lanzar un negocio nuevo (SaaS)

Diagnóstico de Nexo:
- Decisión: crear algo nuevo
- Fase: idea cruda
- Industria: SaaS B2B
- Sofisticación: founder primerizo

Entregables propuestos:
1. **¿A quién le resuelvo qué?** — Value Proposition Canvas + Buyer Personas
2. **¿Cómo gano dinero?** — Business Model Canvas + Pricing + Unit Economics
3. **¿Cómo llego al cliente?** — Customer Journey + Growth Loops + Channel Strategy
4. **¿Los números dan?** — P&L Proforma + Break-even + Sensitivity Analysis
5. **¿Arranco o no?** — Evaluación de preparación + Riesgos + Plan de acción

### Caso 2: Empresa quiere abrir una vertical nueva

Diagnóstico de Nexo:
- Decisión: evaluar oportunidad
- Fase: empresa consolidada
- Industria: alimentos (Sigma-like)
- Sofisticación: alta (directivos)

Entregables propuestos:
1. **Análisis de oportunidad** — TAM/SAM/SOM + Five Forces + Competitive Landscape
2. **Caso de inversión** — P&L Proforma + DCF + Sensitivity Analysis
3. **Riesgo de canibalización** — Portfolio Analysis (BCG) + Scenario Planning
4. **Plan de entrada** — Go-to-Market + Channel Strategy + Timeline

### Caso 3: Desarrollador quiere construir un fraccionamiento

Diagnóstico de Nexo:
- Decisión: evaluar factibilidad de proyecto
- Fase: tiene terreno/capital, evalúa el proyecto
- Industria: real estate / construcción
- Sofisticación: media-alta

Entregables propuestos:
1. **Estudio de demanda** — Market Analysis + Buyer Persona + Competitive Landscape
2. **Factibilidad financiera** — Real Estate Pro Forma + Sensitivity Analysis + Break-even
3. **Análisis de riesgos** — Risk Register + Regulatory Assessment + Scenario Planning
4. **Plan de comercialización** — Channel Strategy + Pricing (Conjoint) + Timeline

### Caso 4: Empresa necesita un focus group (Sigma Alimentos)

Diagnóstico de Nexo:
- Decisión: validar con clientes
- Fase: empresa consolidada con producto existente
- Industria: alimentos / CPG
- Sofisticación: alta

Entregables propuestos:
1. **Perfiles de audiencia** — Buyer Persona Development + Segmentation
2. **Guía de investigación** — Focus Group Design + Discussion Guide
3. **Framework de análisis** — VoC Framework + Kano Model + Analysis Template

### Caso 5: Alguien quiere analizar escenarios con Game Theory

Diagnóstico de Nexo:
- Decisión: analizar interacciones estratégicas
- Fase: tiene contexto claro, necesita análisis formal
- Sofisticación: alta

Entregables propuestos:
1. **Mapeo de jugadores** — Stakeholder Analysis + Game Setup
2. **Análisis de escenarios** — Game Theory (payoff matrix, Nash equilibrium) + Decision Tree
3. **Estrategia óptima** — Recommended Strategy + Sensitivity to assumptions

### Caso 6: Detectar fraude con Ley de Benford

Diagnóstico de Nexo:
- Decisión: detectar anomalías
- Fase: tiene datos, sospecha de irregularidad
- Sofisticación: alta (financiero/auditor)

Entregables propuestos:
1. **Análisis de distribución** — Benford's Law Analysis + Statistical Tests
2. **Mapa de anomalías** — Pareto Analysis + Root Cause Hypothesis
3. **Plan de acción** — Investigation Roadmap + Risk Assessment

### Caso 7: Startup quiere levantar inversión

Diagnóstico de Nexo:
- Decisión: prepararse para fundraising
- Fase: post-product, pre-Series A
- Sofisticación: media

Entregables propuestos:
1. **Narrativa de inversión** — Pitch Narrative + Market Opportunity
2. **Modelo financiero** — Financial Model + Cap Table + Use of Funds
3. **Valuación** — DCF + Comparables + Scenario Analysis
4. **Due diligence pack** — Key Metrics Dashboard + Risk Assessment

### Caso 8: Director de innovación quiere lanzar producto interno

Diagnóstico de Nexo:
- Decisión: lanzar nuevo producto dentro de corporativo
- Fase: tiene mandato pero necesita business case
- Sofisticación: alta

Entregables propuestos:
1. **Business case** — Problem Definition + Market Opportunity + Solution Concept
2. **Análisis de viabilidad** — Technical Assessment + Resource Requirements + Timeline
3. **Caso financiero** — Investment Required + ROI Projection + Break-even
4. **Plan de adopción** — Internal Stakeholder Map + Change Management + KPIs

---

## 8. Impacto en la arquitectura actual

### 8.1 Qué muere

| Componente | Estado |
|---|---|
| Document Specification Library (tabla estática en Supabase) | ELIMINADA — reemplazada por Framework Engine |
| DocumentSpec entity (tabla `document_specs`) | ELIMINADA — ya no se necesita |
| Sesión de Clarificación como pantalla separada | ELIMINADA — Nexo clarifica inline |
| 4 documentos fijos para ICP Founder | ELIMINADOS — composición dinámica |
| Campo `spec_id` en ProjectDocument | ELIMINADO — los entregables se definen dinámicamente |
| `aurum_document_specs.md` | REEMPLAZADO por este archivo (`aurum_framework_engine.md`) |

### 8.2 Qué cambia

| Componente | Antes | Después |
|---|---|---|
| ProjectDocument | Referencia a DocumentSpec vía `spec_id` | Contiene su propia `composition` (JSON con frameworks, secciones, preguntas) |
| EntregablesPropuesta (UI) | Muestra 4 cards fijas | Muestra propuesta dinámica de Nexo con N entregables |
| Sesión de Consejo | N fases = N documentos fijos | N fases = N entregables dinámicos |
| Nexo system prompt | Lista de specs como referencia | Framework Engine como referencia — la taxonomía de herramientas |
| `current_phase` en Project | Fases fijas | Se mantiene igual — las fases del pipeline no cambian |

### 8.3 Qué se mantiene

| Componente | Por qué |
|---|---|
| Pipeline de usuario (Semilla → Consejeros → Entregables → Sesión → Export) | El journey no cambia — lo que cambia es CÓMO se determinan los entregables |
| Marketplace de consejeros | Nexo sigue seleccionando consejeros del marketplace |
| Nexo Dual | El mecanismo constructivo/crítico sigue operando por entregable |
| Export Center | Los entregables se exportan igual — PDF, PPTX, JSON |
| Modos de operación (Normal, Autopiloto, Levantar Mano) | Aplican igual a entregables dinámicos |
| Buyer Personas como validadores | Se activan cuando el entregable lo requiere |

### 8.4 Cambios en schema de Supabase

```sql
-- ELIMINAR tabla document_specs (ya no se necesita)
DROP TABLE IF EXISTS document_specs;

-- MODIFICAR project_documents
ALTER TABLE project_documents DROP COLUMN IF EXISTS spec_id;
ALTER TABLE project_documents ADD COLUMN IF NOT EXISTS composition jsonb;
-- composition contiene: frameworks_used, sections con preguntas,
-- advisors_needed, key_question, depends_on, feeds_into

-- MODIFICAR session_phases
-- questions ya es jsonb — ahora contiene preguntas dinámicas
-- No requiere cambio de schema, solo cambia el contenido
```

---

## 9. System prompt de Nexo — Framework Engine

Este es el bloque que se incluye en el system prompt de Nexo
para darle acceso al Framework Engine.

```
Eres Nexo, el consultor estratégico principal de Reason.

Tu trabajo es diagnosticar la situación del usuario y componer
los entregables exactos que necesita para tomar su decisión con confianza.

NO tienes un menú fijo de documentos.
COMPONES entregables a la medida usando tu conocimiento de frameworks
estratégicos, modelos cuantitativos y metodologías de análisis.

Después de la Semilla, ejecutas este proceso:

1. CLASIFICAR la decisión del usuario
2. IDENTIFICAR las 3-7 preguntas clave que necesita responder
3. MAPEAR cada pregunta a un entregable específico
4. SELECCIONAR los frameworks internos que cada entregable usa
5. GENERAR las secciones y preguntas de cada entregable
6. ORDENAR los entregables por dependencia lógica
7. PROPONER al usuario en lenguaje claro

REGLAS:
- Mínimo 2, máximo 7 entregables por sesión
- Cada entregable responde UNA pregunta clave
- Los frameworks son herramientas internas — el usuario NO ve nombres de frameworks
- Usa lenguaje adaptado al nivel de sofisticación del usuario
- Si no conoces un framework para el caso específico, dilo honestamente
- Los entregables se encadenan — el output de uno alimenta el siguiente
- Las preguntas se generan dinámicamente, no son fijas

TIENES ACCESO A (entre otros):
- Frameworks de estrategia: BMC, Lean Canvas, VPC, Blue Ocean, Ansoff, Porter, PESTEL, SWOT, BCG, Wardley...
- Análisis de mercado: TAM/SAM/SOM, Competitive Landscape, JTBD, Kano, Win/Loss...
- Cliente y audiencia: Buyer Personas, Journey Mapping, Empathy Map, VoC, Focus Group Design...
- Modelos financieros: P&L, Unit Economics, DCF, Break-even, Monte Carlo, Benford, Regression, Pricing...
- Producto: PRD, Feature Prioritization, Tech Assessment, MVP Definition, Design Sprint...
- Go-to-market: GTM Strategy, Channel Strategy, Growth Loops, Funnel Analysis...
- Operaciones: Operating Model, Process Mapping, Capacity Planning, Risk Register...
- Legal: Regulatory Analysis, IP Strategy, Privacy Assessment, Corporate Structure...
- Análisis avanzado: Game Theory, Decision Trees, MCDA, Systems Thinking, Pre-mortem, Red Team...
- Industria específica: Real Estate Feasibility, SaaS Metrics, Franchise Model, Construction Pro Forma...

Esta lista NO es exhaustiva. Usa cualquier herramienta de análisis que conozcas
si es relevante para la situación del usuario.
```

---

## 10. Validación de la propuesta de entregables

Cuando Nexo presenta los entregables al usuario en EntregablesPropuesta,
el usuario puede:

1. **Aprobar tal cual** — "Sí, vamos con eso"
2. **Pedir agregar algo** — "También necesito un análisis de riesgos regulatorios"
   → Nexo agrega un entregable y ajusta dependencias
3. **Pedir quitar algo** — "El customer journey no me interesa ahora"
   → Nexo lo elimina y ajusta lo que dependía de él
4. **Pedir cambiar enfoque** — "En vez de un plan completo, solo necesito los números"
   → Nexo recompone desde cero con enfoque financiero
5. **Preguntar** — "¿Para qué me sirve el análisis de cinco fuerzas?"
   → Nexo explica en lenguaje claro por qué lo incluyó

Todo en lenguaje natural. Sin formularios. Sin menús.

---

## 11. Evolución del Framework Engine

El Framework Engine NO necesita actualizarse manualmente.
Claude conoce frameworks y metodologías porque son parte de su conocimiento.

Si mañana aparece un framework nuevo relevante, Claude ya lo conoce
(o lo conocerá en su próxima actualización de conocimiento).

Lo que SÍ evoluciona:
- **Ejemplos de composición** — cada sesión exitosa es un ejemplo
  de cómo Nexo compuso entregables para un caso similar.
- **Feedback del usuario** — si un usuario dice "este entregable
  no me sirvió", Nexo aprende para casos similares.
- **Nuevas industrias** — cuando llega un usuario de una industria
  nueva, los frameworks específicos se incorporan naturalmente.

---

## Resumen ejecutivo

| Antes | Después |
|---|---|
| 4 documentos fijos para founders | N entregables dinámicos para cualquier usuario |
| Lista cerrada de specs en Supabase | Conocimiento de Claude como motor |
| Nexo elige de un menú | Nexo compone como consultor senior |
| Preguntas fijas por documento | Preguntas generadas por contexto |
| Sesión de Clarificación como pantalla separada | Clarificación inline en Semilla |
| Solo sirve para planes de negocio | Sirve para cualquier decisión estratégica |
| Escalabilidad por tabla en base de datos | Escalabilidad por conocimiento de Claude |
