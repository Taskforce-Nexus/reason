# Reason — Backlog de Implementación

Orden de construcción basado en dependencias reales.
Cada epic depende del anterior. Dentro de cada epic, las stories van en orden.
Faber ejecuta una story a la vez, reporta, siguiente.

---

## Epic 1 — Fundación

Todo lo demás depende de esto. Schema de Supabase, auth, layout base.

### Story 1.1 — Schema de Supabase
Crear todas las tablas de `reason_entities.md` como migraciones SQL.
Incluir RLS policies básicas (usuario solo ve sus proyectos).
Tablas: User (extend auth.users), Project, TeamMember, Council, Advisor, Cofounder, CouncilAdvisor, CouncilCofounder, Specialist, BuyerPersona, DocumentSpec, ProjectDocument, Conversation, Session, SessionPhase, NexoDualResponse, Consultation, Subscription, TokenBalance, TokenUsage, Invoice, PaymentMethod, Notification, NotificationPreference, Connection, ConsumptionAlert.

Tasks:
- Migración SQL con todas las tablas
- RLS: cada usuario solo accede a sus proyectos y datos derivados
- Seed de catálogos: 7 Advisors nativos, 4 Cofounders nativos, 4 DocumentSpecs ICP Founder
- Verificar que todas las FK y constraints están correctos

### Story 1.2 — Auth completo
Login, registro, verificación de email, forgot password.
Frames de referencia: Auth__Login, Auth__Register, Auth__VerifyEmail, Auth__ForgotPassword, Auth__ForgotPasswordSent.

Tasks:
- Ruta `/login` con form email + password + magic link
- Ruta `/register` con form nombre + email + password
- Flujo de verificación de email
- Flujo de forgot password
- Middleware de auth protegiendo rutas `/dashboard` y `/project/*`
- Redirect post-login a dashboard

### Story 1.3 — Layout global y navegación
Shell de la app: header global, sidebar donde aplique, routing.

Tasks:
- Layout global: header con "Reason" gold + nombre de proyecto + saldo + avatar
- Componente de header reutilizable
- Routing de Next.js App Router:
  - `/(auth)/login`
  - `/(auth)/register`
  - `/(dashboard)` — lista de proyectos
  - `/project/[id]` — ProjectView
  - `/project/[id]/semilla` — SeedSession
  - `/project/[id]/sesion-consejo` — SesionConsejo
  - `/project/[id]/consultoria` — Consultoría
  - `/project/[id]/export` — Export Center
  - `/project/[id]/documento/[docId]` — Documents Viewer
  - `/settings/cuenta`
  - `/settings/facturacion`
  - `/settings/equipo`
  - `/settings/planes`
  - `/settings/notificaciones`
  - `/settings/conexiones`

### Story 1.4 — Dashboard
Lista de proyectos del usuario + crear proyecto.
Frame de referencia: Projects__Dashboard__Default.

Tasks:
- Fetch proyectos del usuario desde Supabase
- Cards de proyecto con: nombre, fase actual, última actividad, progreso
- Header con saldo ($X.XX disponible) + campanita + avatar
- Modal "Nuevo Proyecto" (CreateProject): nombre + nivel de entrada
- CRUD: crear, ver lista, eliminar (con ConfirmAction modal)
- Estado vacío si no hay proyectos

---

## Epic 2 — Semilla

El primer flujo que el usuario experimenta después de crear un proyecto.

### Story 2.1 — SeedSession Default (Paso 1 — conversación con Nexo)
Chat 1:1 entre el usuario y Nexo para extraer contexto.
Frame de referencia: Projects__SeedSession__Default.

Tasks:
- UI de chat: burbujas usuario (derecha) + Nexo (izquierda) con avatar
- Sidebar izquierdo: proyecto activo, artefactos cargados, progreso de extracción, temas, resumen del fundador
- Input con adjuntar + micrófono + enviar
- API route `POST /api/chat` con system prompt de Nexo para Semilla
- Persistir mensajes en Conversation (type: "semilla")
- Progreso de extracción: actualizar % basándose en temas cubiertos
- Header: "Paso 1 de 7"
- Botón para cargar archivos (brief-inicial.md, etc.)

### Story 2.2 — Voice mode (Deepgram + Cartesia)
Modo voz para la Semilla.

Tasks:
- `POST /api/voice/stt` — Deepgram Nova-3 WebSocket
- `POST /api/voice/tts` — Cartesia Sonic-3 (voz Pedro)
- VoiceModePanel: MediaRecorder + VAD + sentence streaming
- Botón "Modo voz" en header que activa/desactiva
- Interrupt: usuario habla durante TTS → cancela audio → vuelve a escuchar
- Mic mute durante TTS para evitar eco

### Story 2.3 — Generación del Resumen del Fundador
Al completar la Semilla, Nexo genera el Resumen.

Tasks:
- API route `POST /api/chat/brief` — genera resumen desde conversación
- Guardar en Project.founder_brief
- Marcar Project.seed_completed = true
- Mostrar banner "Semilla completada" en sidebar
- Transición automática al Paso 2

---

## Epic 3 — Configuración del Consejo (Pasos 2-7)

Post-Semilla: el usuario configura entregables, consejo, cofounders, especialistas, perspectivas de cliente.

### Story 3.1 — EntregablesPropuesta (Paso 2)
Nexo propone documentos basándose en el propósito + Resumen.
Frame de referencia: Projects__SeedSession__EntregablesPropuesta.

Tasks:
- API: Nexo analiza founder_brief + purpose → sugiere DocumentSpecs relevantes
- UI: lista de documentos con expandible (secciones, decisión, criterio de calidad)
- Botones Aceptar/Rechazar individual (futuro), por ahora "Aprobar todos"
- "Agregar o quitar documentos" → abre chat para modificar lista
- "Pedir ajuste" por documento → focus en input con prefijo
- Paginación si > 5 documentos
- Crear ProjectDocument por cada entregable aprobado (status: "pendiente")

### Story 3.2 — ConsejoPrincipalPropuesta (Paso 3)
Nexo presenta el consejo base por niveles.
Frame de referencia: Projects__SeedSession__ConsejoPrincipalPropuesta.

Tasks:
- API: Nexo selecciona advisors del catálogo basándose en entregables + founder_brief
- Crear Council + CouncilAdvisor por cada advisor seleccionado
- UI: cards por nivel (Lidera/Apoya/Observa) con nombre, estilo comunicación, dots de sombreros
- Leyenda de sombreros
- Botones "Cambiar" + "Ver perfil" por asesor
- CTA "Entendido, continuar →"

### Story 3.3 — AdvisorSelector Drawer
Catálogo para cambiar un asesor.
Frame de referencia: SeedSession__AdvisorSelector__Drawer.

Tasks:
- Drawer con grid de advisors del catálogo
- Search + filtros por categoría (Investigación, UX, Negocio, Técnico, Precios, Favoritos)
- Detail panel derecho: sobre, especialidades, industrias, experiencia, estilo comunicación, sombreros, configuración
- Barra de contexto: "Llenando: [slot] — [nivel]"
- "Pídele a Nexo" → crea advisor personalizado
- Botón "Agregar al Consejo" → reemplaza el advisor en el slot
- Paginación

### Story 3.4 — CofoundersPropuesta (Paso 4)
Nexo presenta los cofounders IA asignados.
Frame de referencia: Projects__SeedSession__CofoundersPropuesta.

Tasks:
- API: Nexo selecciona 1 constructivo + 1 crítico del catálogo
- Crear CouncilCofounder por cada uno
- UI: cards con nombre, rol, especialidad, descripción
- Botones "Cambiar" → abre CofounderSelector Drawer
- CTA "Entendido, continuar →"

### Story 3.5 — CofounderSelector Drawer
Catálogo para cambiar cofounders.
Frame de referencia: SeedSession__CofounderSelector__Drawer.

Tasks:
- Mismo patrón que AdvisorSelector pero filtrado a cofounders
- Filtros: Constructivo / Crítico / Favoritos
- "Mis Cofounders Activos" arriba
- "Reemplazar [Rol]" context-aware
- Detail panel con sombreros, estilo, configuración

### Story 3.6 — EspecialistasPropuesta (Paso 5)
Nexo sugiere especialistas de industria.
Frame de referencia: Projects__SeedSession__EspecialistasPropuesta.

Tasks:
- API: Nexo genera especialistas basándose en venture_profile + industria
- Crear Specialist por cada sugerencia
- UI: lista con nombre, descripción, categoría pill, justificación de Nexo
- Aceptar/Descartar individual
- "Ver perfil" → abre EspecialistaSelector Drawer
- "Pedir otro especialista" → chat con Nexo

### Story 3.7 — EspecialistaSelector Drawer
Gestión de especialistas invitados.
Frame de referencia: SeedSession__EspecialistaSelector__Drawer.

Tasks:
- Lista de sugerencias de Nexo con Aceptar/Descartar
- Detail panel: sobre, especialidades, industrias, experiencia
- "Pídele a Nexo" + "Crear manualmente"
- Confirmar/Editar/Eliminar invitado
- Confirmación inline para eliminar

### Story 3.8 — ICPsPropuesta (Paso 6)
Nexo presenta perspectivas de cliente.
Frame de referencia: Projects__SeedSession__ICPsPropuesta.

Tasks:
- API: Nexo genera 2-3 BuyerPersonas basándose en founder_brief + ICP detectado
- UI: lista con nombre arquetipo, demografía, cita textual
- Aceptar/Descartar individual
- "Ver perfil" → abre BuyerPersonaSelector Drawer
- "+ Agregar otra perspectiva"
- "Pedir otra perspectiva" → chat con Nexo

### Story 3.9 — BuyerPersonaSelector Drawer
Gestión de buyer personas.
Frame de referencia: SeedSession__BuyerPersonaSelector__Drawer.

Tasks:
- Lista de personas generadas por Nexo
- Detail panel: necesidades, miedos/objeciones, canales de descubrimiento, alternativas actuales, journey de compra, comportamiento
- Editar/Eliminar con confirmación inline
- "Pídele a Nexo" + "Crear manualmente"
- "Confirmar Perfil"

### Story 3.10 — ConsejoListo (Paso 7)
Resumen final antes de iniciar la Sesión de Consejo.
Frame de referencia: Projects__SeedSession__ConsejoListo.

Tasks:
- UI: resumen completo — consejo base (Nexo + cofounders con nombres), asesores por nivel, especialistas con nombres, perspectivas de cliente, entregables
- CTA "Iniciar Sesión de Consejo →" → crea Session + navega a /sesion-consejo
- "Revisar consejo antes" → navega a MyBoard
- Council.status → "listo"

### Story 3.11 — AdvisoryBoard MyBoard
Vista completa del consejo armado.
Frame de referencia: AdvisoryBoard__MyBoard.

Tasks:
- Cards de asesores por nivel con dots de sombreros + estilo comunicación
- Sidebar: cofounders IA + humanos con participación
- Sombreros 6/6 con leyenda
- Asesores invitados + Perspectivas de cliente
- "Cambiar ↗" en cada card → abre drawer correspondiente
- Breadcrumb: ← FinTrack / Mi Consejo

---

## Epic 4 — Sesión de Consejo

El corazón del producto. El consejo IA produce documentos.

### Story 4.1 — Motor de Sesión de Consejo
Backend que orquesta la sesión.

Tasks:
- Crear Session al iniciar desde ConsejoListo
- Crear SessionPhase por cada ProjectDocument (en orden)
- API route para generar preguntas por fase basándose en DocumentSpec
- API route para generar respuestas de advisors (2-3 por turno, seleccionados por Nexo)
- API route para Nexo Dual: constructivo propone → crítico objeta → síntesis
- Lógica de acuerdo/desacuerdo: si coinciden → 1 borrador, si no → 2 posiciones
- Guardar NexoDualResponse por cada pregunta
- Avanzar question_index y document_index automáticamente

### Story 4.2 — UI de Sesión de Consejo
Pantalla principal con 3 columnas.
Frame de referencia: Projects__SesionConsejo__Default.

Tasks:
- Header: "Documento X de N · [nombre] · Pregunta Y de Z"
- Toggle de modo: Normal / Autopiloto / Levantar Mano
- Sidebar izquierdo: El Consejo por nivel con participación %
- Área central: pregunta activa + respuestas de asesores + cards Nexo Dual (Constructivo vs Crítico)
- Botones: "Elegir Constructiva" / "Elegir Crítico" / "Responder yo"
- Anteriores: historial de preguntas resueltas
- Próximas preguntas: lo que viene
- "Levantar mano" en footer
- Sidebar derecho: Turno Activo, Ya Participaron, Debate, Preview en Vivo, Progreso, Momentum

### Story 4.3 — Preview en vivo de documento
El documento se forma en tiempo real.

Tasks:
- A medida que se resuelven preguntas, alimentar ProjectDocument.content_json
- Mostrar preview parcial en sidebar derecho
- Indicador "Generando..." con progreso
- Link "Ver →" que abre Documents Viewer con contenido parcial

### Story 4.4 — Completar fase y avanzar
Cuando todas las preguntas de un documento se resuelven.

Tasks:
- Marcar SessionPhase como completada
- Marcar ProjectDocument como "generado"
- Generar content_json final del documento
- Avanzar a siguiente fase automáticamente
- Si es la última fase: Session.status = "completada", Project.current_phase = "completado"
- Mostrar resumen de sesión

---

## Epic 5 — Documentos

Viewer y export de documentos generados.

### Story 5.1 — Documents Viewer (3 tabs)
Editor de documentos generados.
Frames de referencia: Documents__Viewer__Ajustes, __Contenido, __Identidad.

Tasks:
- Ruta `/project/[id]/documento/[docId]`
- Tab Ajustes: chat con Nexo para pedir cambios al documento. Chips de sugerencias rápidas.
- Tab Contenido: campos editables por sección (tipo Elementor). El sidebar refleja los campos de la sección activa en el panel derecho.
- Tab Identidad: subir logo, seleccionar colores, tipografía. Guardar en ProjectDocument.brand_settings.
- Panel derecho: renderizar content_json como documento visual con secciones/diapositivas
- Navegación entre documentos via tabs en header

### Story 5.2 — Export Center
Lista de documentos con descarga.
Frame de referencia: Export__Center__Default.

Tasks:
- Ruta `/project/[id]/export`
- Tabla de documentos: nombre, descripción, estado, última edición, acciones
- Acciones: Vista previa (→ Viewer), Descargar PDF, menú ⋯ (Markdown, regenerar)
- Barra de progreso: "X de Y documentos listos"
- Checkboxes para selección múltiple → "Descargar selección"
- "Descargar todo (PDF)" + dropdown "Exportar paquete" (PDF completo, Markdown .zip, Slides, Paquete Inversionista)
- Paginación

### Story 5.3 — Generación de PDF
Convertir content_json a PDF descargable.

Tasks:
- Usar PptxGenJS para PPTX (ya en tech stack)
- Usar librería de PDF (jsPDF o puppeteer) para PDF
- Aplicar brand_settings al documento exportado
- API route `POST /api/export/pdf` — recibe document_id, retorna PDF
- API route `POST /api/export/pptx` — recibe document_id, retorna PPTX

---

## Epic 6 — Consultoría Activa

Chat post-sesión con el consejo.

### Story 6.1 — Consultoría
Chat con consejeros post-sesión.
Frame de referencia: Projects__Consultoria__Default.

Tasks:
- Ruta `/project/[id]/consultoria`
- Sidebar izquierdo: consejeros disponibles, cofounders, consultas anteriores, "+ Nueva consulta"
- Área de chat: Nexo modera, selecciona consejeros relevantes, ellos responden
- Sidebar derecho: documentos de referencia, contexto acumulado, acciones rápidas
- Input con adjuntar + micrófono
- Persistir en Consultation
- API: Nexo analiza la pregunta → selecciona 1-3 advisors → genera respuestas con contexto del proyecto completo

### Story 6.2 — Card en ProjectView
Módulo de acceso desde el hub.

Tasks:
- Card "Consultoría Activa" con: última consulta, preview de pregunta, "Abrir consultoría →"
- Estado bloqueado si Sesión de Consejo no completada
- Conteo de consultas realizadas

---

## Epic 7 — Settings

Configuración, billing, equipo, planes.

### Story 7.1 — Settings Account
Perfil, preferencias, seguridad.
Frame de referencia: Settings__Account__Default.

Tasks:
- Layout compartido: sidebar con 6 tabs + contenido
- Perfil: nombre, email, avatar, guardar cambios
- Preferencias: idioma, zona horaria, notificaciones email, modo voz
- Seguridad: cambiar contraseña, sesiones activas
- Zona de peligro: eliminar cuenta (con ConfirmAction)

### Story 7.2 — Settings Billing
Saldo, plan, consumo, facturas.
Frame de referencia: Settings__Billing__Default.

Tasks:
- Tu Saldo: balance actual + "Recargar saldo" + consumo del mes
- Tu Plan: plan activo + precio + renovación + cambiar/cancelar
- Historial de consumo: tabla con fecha, proyecto, actividad, tokens, costo
- Método de pago: tarjeta actual + cambiar
- Facturas: tabla con descargar PDF
- Integración con Stripe para pagos

### Story 7.3 — Settings Team
Gestión de equipo del proyecto.
Frame de referencia: Settings__Team__Default.

Tasks:
- Tabla de miembros: nombre, email, rol, participación, último acceso, acciones
- El founder no se puede eliminar
- Menú ⋯: cambiar rol, cambiar participación, eliminar
- Invitaciones pendientes: reenviar, cancelar
- "+ Invitar colaborador" → abre InviteCollaborator modal

### Story 7.4 — Settings Plans
Comparación de planes + alertas.
Frame de referencia: Settings__Plans__Default.

Tasks:
- Plan actual con detalles
- Comparación: Core / Pro / Enterprise
- Upgrade flow → Stripe checkout
- Alertas de consumo: threshold + toggles email/app

### Story 7.5 — Settings Notifications
Centro de notificaciones + preferencias.
Frame de referencia: Settings__Notifications__Default.

Tasks:
- Lista de notificaciones recientes (read/unread)
- "Marcar todo como leído"
- Preferencias por categoría: Sesión de Consejo, Equipo, Facturación, Producto
- Toggles por tipo de notificación
- Campanita en header global con badge de count unread

### Story 7.6 — Settings Connections
GitHub + Google Drive.
Frame de referencia: Settings__Connections__Default.

Tasks:
- GitHub: OAuth flow, mostrar repo conectado, configurar, desconectar
- Google Drive: OAuth flow, conectar para export
- Estado: Conectado/No conectado con dot

---

## Epic 8 — Marketing Landing

Página pública, no requiere auth.

### Story 8.1 — Landing page
Frame de referencia: Marketing__Landing__Default.

Tasks:
- Ruta `/` — landing pública
- 10 secciones estáticas según el frame freezado
- Hero con mockup de SesionConsejo
- Responsive: mobile + tablet + desktop
- CTAs: "Crear Cuenta Gratis" → /register, "Ver cómo funciona" → scroll a sección
- Footer con links
- Meta tags + OG para SEO

---

## Epic 9 — Polish y Deploy

### Story 9.1 — Estados (EXPAND)
Agregar estados faltantes a todas las pantallas.

Tasks:
- Loading: skeletons para cada pantalla que carga datos
- Empty: estado vacío para listas (proyectos, documentos, notificaciones, consultas)
- Error: mensajes inline + retry
- Success: toasts para acciones completadas

### Story 9.2 — ProjectView actualización
Actualizar ProjectView para reflejar estados reales.
Frame de referencia: Projects__ProjectView__Default.

Tasks:
- Card Semilla: estado dinámico (en progreso / completada)
- Card Sesión de Consejo: estado dinámico + documento actual
- Card Consultoría: última consulta o bloqueado
- Card Consejo Asesor: count de asesores configurados
- Card Exportación: count de docs listos / pendientes
- Progreso del journey: 5 etapas con estado real
- Sidebar: resumen del proyecto con stats reales

### Story 9.3 — Testing y QA

Tasks:
- Test end-to-end: crear proyecto → semilla → configurar consejo → sesión → export
- Verificar RLS en Supabase
- Verificar billing flow con Stripe test mode
- Testing de voice mode en browsers reales
- Performance: tiempos de carga < 2s por pantalla

### Story 9.4 — Deploy producción

Tasks:
- Vercel: configurar dominio reason.app (o el que sea)
- Railway: verificar env variables
- Supabase: migrar schema a producción
- Stripe: activar modo live
- DNS + SSL

---

## Resumen de dependencias

```
Epic 1 (Fundación)
  → Epic 2 (Semilla)
    → Epic 3 (Configuración del Consejo)
      → Epic 4 (Sesión de Consejo)
        → Epic 5 (Documentos + Export)
        → Epic 6 (Consultoría)
  → Epic 7 (Settings) — paralelo después de Epic 1
  → Epic 8 (Landing) — paralelo, no depende de nada
Epic 9 (Polish) — al final
```

Epics 7 y 8 se pueden construir en paralelo con 2-6.
Epic 9 va al final después de que todo funcione.

---

## Estimación rough

| Epic | Stories | Complejidad | Estimación |
|---|---|---|---|
| 1. Fundación | 4 | Media | 3-4 días |
| 2. Semilla | 3 | Alta | 4-5 días |
| 3. Config Consejo | 11 | Alta | 7-10 días |
| 4. Sesión de Consejo | 4 | Muy alta | 8-12 días |
| 5. Documentos | 3 | Alta | 5-7 días |
| 6. Consultoría | 2 | Media | 3-4 días |
| 7. Settings | 6 | Media | 5-7 días |
| 8. Landing | 1 | Baja | 1-2 días |
| 9. Polish | 4 | Media | 4-5 días |
| **Total** | **38** | | **40-56 días** |

Con Faber trabajando full time: ~2 meses para MVP funcional.
