# Reason Document System

Reason genera entregables estratégicos estructurados a través de la Sesión de Consejo.
Los entregables se componen dinámicamente según el usuario y su decisión.

La fuente de verdad es el Framework Engine.

---

## Dynamic Deliverables — Framework Engine

Reason no genera documentos fijos. Nexo compone entregables dinámicamente
usando frameworks estratégicos, modelos cuantitativos y metodologías
de análisis según la situación del usuario.

Cada entregable tiene: nombre, pregunta clave que responde, frameworks
internos, secciones con preguntas, consejeros necesarios y dependencias.

La composición se almacena como JSON en `ProjectDocument.composition`.

Detalle completo: /context/aurum_framework_engine.md

---

## Ejemplos de entregables por caso de uso

Los siguientes son ejemplos de cómo Nexo compone entregables para distintos ICPs.
No son specs fijas — son ilustraciones de la composición dinámica.

### ICP: Founder lanzando negocio nuevo (SaaS)
1. ¿A quién le resuelvo qué? — VPC + Buyer Personas
2. ¿Cómo gano dinero? — BMC + Pricing + Unit Economics
3. ¿Cómo llego al cliente? — Customer Journey + Growth Loops
4. ¿Los números dan? — P&L + Break-even + Sensitivity
5. ¿Arranco o no? — Evaluación + Riesgos + Plan de acción

### ICP: Empresa abriendo vertical nueva
1. Análisis de oportunidad — TAM/SAM/SOM + Five Forces
2. Caso de inversión — P&L + DCF + Sensitivity
3. Riesgo de canibalización — BCG + Scenario Planning
4. Plan de entrada — GTM + Channel Strategy

### ICP: Director de innovación — producto interno
1. Business case — Problem + Market + Solution Concept
2. Análisis de viabilidad — Tech Assessment + Resources + Timeline
3. Caso financiero — Investment + ROI + Break-even
4. Plan de adopción — Stakeholder Map + Change Management + KPIs

---

## Formato de export

Cada documento se genera en:
- Vista interactiva en Export Center
- PDF
- PPTX (via PptxGenJS)
- JSON estructurado (para consumo por otros módulos AVA)
- Google Slides (v2)
