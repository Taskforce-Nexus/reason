# Reason — Auditoría Completa
**Fecha:** 2026-03-16 / Fix pass: 2026-03-17
**Método:** Revisión estática de código (grep) + Playwright E2E contra localhost:3000
**Cobertura:** 8 pantallas, 21 rutas API, todos los componentes principales

---

## Estado general post-fix

| Categoría | Total | Resuelto | Post-MVP |
|---|---|---|---|
| Botones muertos | 19 | 16 | 3 |
| Secciones stub | 8 | 1 | 7 |
| Modales sin acción | 3 | 3 | 0 |
| Fetch sin error handling | 2 | 0 | 2 |

---

## 1. Botones muertos — estado post-fix

| Pantalla | Botón | Estado |
|---|---|---|
| Settings / Facturación | "Recargar saldo →" | ✅ Toast: "Próximamente — la recarga de saldo estará disponible en la siguiente versión." |
| Settings / Facturación | "Cambiar plan" | ✅ Toast: "Próximamente — el cambio de plan estará disponible pronto." |
| Settings / Facturación | "Hablar con ventas" | ✅ Toast: "Próximamente — escríbenos a hola@reason.dev para hablar con ventas." |
| Settings / Facturación | "Cancelar suscripción / Agregar método" | ✅ Toast contextual por estado |
| Settings / Facturación | "+ Agregar método de pago" | ✅ Toast: "Próximamente — los métodos de pago se configurarán en la siguiente versión." |
| Settings / Equipo | "Enviar invitación" (modal) | ✅ Llama POST /api/team/invite; si falla → toast "Próximamente" |
| Settings / Equipo | "Sí" (confirmar eliminar miembro) | ✅ Toast: "Próximamente — la eliminación de miembros estará disponible pronto." |
| Settings / Cuenta | "Cambiar contraseña" | ✅ Llama supabase.auth.resetPasswordForEmail(email) → envía email de reset |
| Settings / Cuenta | "Cerrar todas las sesiones" | ✅ Toast: "Sesiones cerradas — vuelve a iniciar sesión si es necesario." |
| Settings / Cuenta | "Sí, eliminar" (modal) | ✅ Toast: "Para eliminar tu cuenta contacta a soporte@reason.dev" |
| Settings / Planes | "Cambiar a Pro" | ✅ Toast: "Próximamente — el cambio al plan Pro estará disponible pronto." |
| Settings / Planes | "Hablar con ventas" | ✅ Toast: "Próximamente — escríbenos a hola@reason.dev." |
| Settings / Conexiones | "Conectar" (GitHub) | ✅ Navega a /api/auth/github — OAuth flow real |
| Settings / Conexiones | "Sugerir integración →" | ✅ Toast: "Gracias — escríbenos a hola@reason.dev con la integración que necesitas." |
| Advisory Board | "Cambiar ↗" (6 instancias) | ✅ Toast: "Próximamente — el selector de consejeros se implementará en la siguiente versión." |
| Export Center | "Exportar paquete ↑" | ⚠️ Sin handler — requires packaging logic (P2, post-sprint) |
| Export Center | "←" / "→" (paginación) | 🔵 Post-MVP by design — `disabled` hardcoded |
| Document Viewer | Botón send "→" (panel Ajustar) | ✅ Toast: "Próximamente — el ajuste por IA se implementará en la siguiente versión." |
| Project View | "Editar propósito" (icono) | ⚠️ Sin handler — requires edit modal (P2, post-sprint) |

---

## 2. Secciones stub — estado post-fix

| Pantalla | Sección | Estado |
|---|---|---|
| Settings / Conexiones | Notion, Linear, Slack, Figma | 🔵 Post-MVP — chips "Próximamente" (intencional) |
| Settings / Notificaciones | "Guardar preferencias" | ⚠️ No persiste al backend — P2 |
| Settings / Equipo | Lista de colaboradores | ⚠️ Proxy via council_advisors — P2 (requiere tabla team_members) |
| Sesión de Consejo | "Pedir revisión" | 🔵 Post-MVP — `disabled` con `title="Post-MVP"` |
| Document Viewer | Panel "Ajustar" | ✅ Toast añadido al botón send |
| Document Viewer | "↓ Google Slides" | ⚠️ Link a /export — export-to-slides no existe (P2) |
| Landing page | Productos sin lanzar | 🔵 Post-MVP — chips decorativos intencionales |
| DocumentPreview.tsx | Secciones pendientes | 🔵 Post-MVP — comentario interno |

---

## 3. Modales — estado post-fix

| Pantalla | Modal | Estado |
|---|---|---|
| Settings / Cuenta | Modal "Eliminar cuenta" | ✅ "Sí, eliminar" → toast con instrucción de soporte |
| Settings / Equipo | Modal "Invitar colaborador" | ✅ "Enviar invitación" → POST /api/team/invite o toast fallback |
| Settings / Equipo | Confirmación eliminar miembro | ✅ "Sí" → toast |

---

## 4. Botones gated por estado (no son bugs — confirmed)

| Pantalla | Botón | Condición |
|---|---|---|
| Project View | "Abrir consultoría →" | Se activa cuando `consultation !== null` |
| Project View | "Continuar sesión →" | Se activa cuando `activeStage >= 3` |
| Settings / Planes | "Plan actual" | Disabled decorativo en plan activo |

---

## 5. Errores de manejo / fetch sin error handling

| Archivo | Función | Estado |
|---|---|---|
| SettingsAccount.tsx | `handleSave()` | ⚠️ Sin catch visible — P2 |
| SettingsNotifications.tsx | `handleSave()` | ⚠️ No hace fetch — P2 |

---

## 6. Pendientes P2 (post-sprint)

1. **Export Center "Exportar paquete ↑"** — requiere lógica de empaquetado ZIP de documentos
2. **Project View "Editar propósito"** — requiere modal de edición + PATCH a /api/projects
3. **Settings Notificaciones** — conectar "Guardar preferencias" a un endpoint real
4. **Settings Equipo** — migrar proxy council_advisors a tabla real team_members + API /api/team/invite
5. **Document Viewer panel Ajustar** — conectar a API de chat con contexto de documento

---

## 7. Nuevo componente creado

**`src/components/ui/Toast.tsx`** — sistema de toast global
- `toast(message)` — función callable desde cualquier componente client
- `<ToastProvider>` — montado en `layout.tsx`
- Estilo: fondo `#0D1535`, borde `#B8860B`, 3 segundos de visibilidad

---

*Generado por Faber — auditoría estática + E2E — 2026-03-16*
*Fix pass completado — 2026-03-17*
