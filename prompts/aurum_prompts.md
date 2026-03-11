# Reason Prompt Library

Este archivo documenta los prompts validados para uso en Claude Code / VS Code.
Incluye aprendizajes sobre estructura y control de agentes.

---

## Principios para prompts de agente (Claude Code)

Reglas aprendidas para evitar que el agente improvise o se vaya por ramas:

- **leer antes de modificar** — siempre instruir al agente a leer el estado actual antes de actuar
- **no crear frames nuevos** — si la tarea es iterar, no expandir
- **no modificar frames no relacionados** — acotar el scope explícitamente
- **mantener nombres de frames** — evitar que el agente renombre o reestructure sin instrucción
- **output esperado definido** — screenshot final + reporte estructurado
- **proceso esperado definido** — pasos en orden para que el agente no improvise secuencia
- **texto siempre dentro de bounds** — todo nodo de texto dentro de burbujas, cards o contenedores debe usar `textGrowth: "fixed-width"` con `width: "fill_container"`. Nunca dejar texto con crecimiento libre (`textGrowth: "free"`) dentro de contenedores de ancho fijo. Este error causa que el texto se desborde fuera del frame visible y es un problema recurrente — incluir esta regla explícitamente en todos los prompts que involucren texto en burbujas de chat, cards o cualquier contenedor con ancho definido.

---

## Prompt: Iterar frame en Pencil.dev MCP

**Uso:** Iterar cualquier frame de Reason en Claude Code usando Pencil.dev MCP.
**Etapa:** ITERATE (antes de FREEZE)

```
Contexto del proyecto:
Estoy trabajando en Reason, un sistema de creación de ventures guiado por IA.
El stack de diseño UI usa Pencil.dev MCP.
Estamos en la etapa ITERATE del workflow: default → iterate → freeze → expand → scaffold.
No generar estados (loading, error, empty) todavía.

Frame a iterar:
[NOMBRE_DEL_FRAME]

Decisiones ya tomadas:
- ProjectView es el hub central operativo del venture. No existe un Document Hub separado.
- Export Center es el handoff center (docs, markdown, repo, pitch, investor materials).
- Advisory Board es configurado automáticamente por Nexo post-seed session.
- El sistema debe sentirse premium, serio, estructurado, como un venture operating system.

Objetivo de la iteración:
[DESCRIPCIÓN DEL OBJETIVO]

El frame debe integrar:
[LISTA DE SECCIONES Y CONTENIDO]

Reglas de diseño:
- jerarquía de información clara, con lo más importante arriba
- densidad media-alta: esta es una pantalla operativa, no decorativa
- sin espacio vacío innecesario
- navegación consistente con el resto del producto
- no duplicar superficies de control que ya existen en otras pantallas
- estilo oscuro, premium, estructurado
- no crear frames nuevos
- no modificar frames no relacionados
- mantener el nombre del frame igual: [NOMBRE_DEL_FRAME]
- todo texto dentro de burbujas, cards o contenedores debe usar textGrowth: "fixed-width" con width: "fill_container" — nunca texto con crecimiento libre dentro de contenedores de ancho fijo

Proceso esperado:
1. leer el frame actual antes de modificarlo
2. iterarlo con cambios focalizados
3. mostrar screenshot final
4. reportar:
   - design objective
   - cambios aplicados
   - checklist de revisión
   - next step recommendation

Acción:
Usa Pencil.dev MCP para iterar el frame [NOMBRE_DEL_FRAME] aplicando estos cambios. Mantén el nombre del frame igual.
```

---

## Instancia: Projects__ProjectView__Default

**Fecha:** 2026-03
**Objetivo:** Convertir ProjectView en el hub central operativo del venture.

```
Contexto del proyecto:
Estoy trabajando en Reason, un sistema de creación de ventures guiado por IA.
El stack de diseño UI usa Pencil.dev MCP.
Estamos en la etapa ITERATE del workflow: default → iterate → freeze → expand → scaffold.
No generar estados (loading, error, empty) todavía.

Frame a iterar:
Projects__ProjectView__Default

Decisiones ya tomadas:
- ProjectView es el hub central operativo del venture. No existe un Document Hub separado.
- Export Center es el handoff center (docs, markdown, repo, pitch, investor materials).
- Advisory Board es configurado automáticamente por Nexo post-seed session.
- El sistema debe sentirse premium, serio, estructurado, como un venture operating system.

Objetivo de la iteración:
Rediseñar Projects__ProjectView__Default para que funcione como el control center real del venture.

El frame debe integrar en una sola pantalla:
1. Header del proyecto
   - nombre del venture
   - etapa actual del pipeline
   - progreso general

2. Seed Session / Incubadora
   - estado de la sesión
   - acceso directo a continuar con Nexo

3. Advisory Board
   - miembros activos del consejo
   - acceso al board

4. Documentos generados
   - lista de documentos del venture
   - estado de cada documento (pendiente / generado / listo)
   - acceso directo a cada uno

5. Export / Handoff
   - acceso al Export Center
   - resumen de qué está listo para exportar

6. Pipeline progress
   - indicador visual de la etapa actual del venture

Reglas de diseño:
- jerarquía de información clara, con lo más importante arriba
- densidad media-alta: esta es una pantalla operativa, no decorativa
- sin espacio vacío innecesario
- navegación consistente con el resto del producto
- no duplicar superficies de control que ya existen en otras pantallas
- estilo oscuro, premium, estructurado
- no crear frames nuevos
- no modificar frames no relacionados
- mantener el nombre del frame igual: Projects__ProjectView__Default

Proceso esperado:
1. leer el frame actual antes de modificarlo
2. iterarlo con cambios focalizados
3. mostrar screenshot final
4. reportar:
   - design objective
   - cambios aplicados
   - checklist de revisión
   - next step recommendation

Acción:
Usa Pencil.dev MCP para iterar el frame Projects__ProjectView__Default aplicando estos cambios. Mantén el nombre del frame igual.
```
