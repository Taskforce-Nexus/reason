# Reason — Sesión de Consejo

La Sesión de Consejo es el corazón de Reason. Es donde el usuario convierte
su decisión estratégica en documentos estructurados con ayuda de un consejo IA especializado.

No está limitada a founders. El consejo y los documentos se adaptan al ICP y al propósito.

---

## Flujo completo previo a la Sesión de Consejo

### 1. Semilla (1:1 Nexo / Usuario)

Nexo extrae contexto completo:
- La decisión o problema que necesita resolver
- Experiencia y contexto del usuario
- Recursos disponibles
- Visión y expectativas
- Restricciones

Output: Resumen del Fundador — documento de referencia para todo lo que sigue.

### 2. Propósito del Consejo

El usuario declara para qué necesita su consejo. Ejemplos:
- Validar mi modelo de negocio
- Diseñar una estrategia de crecimiento
- Lanzar un producto interno
- Entrar a un mercado nuevo

### 3. Marketplace de Consejeros

Nexo recomienda perfiles IA relevantes basándose en propósito + Resumen.
El usuario confirma o ajusta el consejo.

### 4. Definición de Entregables

Nexo analiza el Resumen del Fundador y compone los entregables
que el caso necesita. No hay menú fijo de documentos.

Proceso interno de Nexo:
1. Clasificar la decisión del usuario
2. Identificar las 3-7 preguntas clave
3. Mapear cada pregunta a un entregable con frameworks internos
4. Ordenar por dependencia lógica
5. Proponer al usuario en lenguaje claro

El usuario valida, ajusta o rechaza en lenguaje natural.
La Sesión de Clarificación como pantalla separada ya no existe —
Nexo clarifica inline dentro de Semilla si el diagnóstico es ambiguo.

Detalle completo: /context/aurum_framework_engine.md

---

## La Sesión de Consejo

Una vez definidos los documentos, comienza la Sesión de Consejo.
N fases según los documentos definidos. Cada fase produce un documento aprobado.

En cada fase: el consejo hace preguntas y plantea retos. Solo 2-3 roles hablan por turno.

---

## Mecanismo Nexo Dual

El sistema no expone directamente la respuesta de IA al usuario. Primero debate internamente:

```
Nexo Constructivo → redacta respuesta optimista basada en hechos
        ↓
Nexo Crítico → critica, identifica riesgos y debilidades
        ↓
Síntesis → produce resultado final
```

Si coinciden: el usuario ve UN borrador mejorado.
Si no coinciden: el usuario ve DOS posiciones y elige.

---

## Modos de operación

| Modo | Descripción |
|------|-------------|
| Normal | Nexo Dual completo — debate + revisión del usuario |
| Autopiloto | Nexo Constructivo solo, sin debate (velocidad) |
| Levantar Mano | El usuario habla directo al consejo, saltando el proxy |

---

## Consejo Asesor — Marketplace de Consejeros IA

100% agentes IA. Sin consejeros humanos reales en v1.

### Especialidades core del catálogo

| Especialidad | Enfoque |
|---|---|
| Estrategia de negocio | visión general, modelo de ingresos, orquestación |
| Finanzas | economía unitaria, P&L, monetización |
| Marketing y crecimiento | adquisición, posicionamiento, canales |
| Ventas | modelo comercial, incentivos, pipeline |
| Producto / UX | experiencia de usuario, features, encaje |
| Tecnología | arquitectura, viabilidad técnica, alcance MVP |
| Legal / Regulatorio | riesgos, estructura, cumplimiento |
| Operaciones | ejecución, procesos, escala |
| Industria específica | contexto vertical del venture |

Regla: solo 2-3 roles hablan por turno.

---

## Ruta en la app

Semilla: `/project/[id]/semilla`
Sesión de Consejo: `/project/[id]/sesion-consejo`
Componentes en: `src/components/incubadora/`
Prompts del sistema en: `src/lib/prompts.ts`
Configuración de consejeros en: `src/lib/advisors.ts`
