# Reason — Auditoría Completa

**Fecha:** 2026-03-16 / Fix pass: 2026-03-17
**Método:** Revisión estática de código (grep) + Playwright E2E contra localhost:3000
**Cobertura:** 8 pantallas, 21 rutas API, todos los componentes principales

---

## Estado general post-fix

| Categoría | Total | Resuelto | Post-MVP |
| --- | --- | --- | --- |
| Botones muertos | 19 | 16 | 3 |
| Secciones stub | 8 | 1 | 7 |
| Modales sin acción | 3 | 3 | 0 |
| Fetch sin error handling | 2 | 0 | 2 |

---

## 1. Botones muertos — estado post-fix

| Pantalla | Botón | Estado |
| --- | --- | --- |
| Settings / Facturación | "Recargar saldo →" | ✅ Toast próximamente |
| Settings / Facturación | "Cambiar plan" | ✅ Toast próximamente |
| Settings / Facturación | "Hablar con ventas" | ✅ Toast con email de contacto |
| Settings / Facturación | "Cancelar suscripción / Agregar método" | ✅ Toast contextual por estado |
| Settings / Facturación | "+ Agregar método de pago" | ✅ Toast próximamente |
| Settings / Equipo | "Enviar invitación" (modal) | ✅ POST /api/team/invite + toast fallback |
| Settings / Equipo | "Sí" (confirmar eliminar miembro) | ✅ Toast próximamente |
| Settings / Cuenta | "Cambiar contraseña" | ✅ `supabase.auth.resetPasswordForEmail` → email de reset |
| Settings / Cuenta | "Cerrar todas las sesiones" | ✅ Toast informativo |
| Settings / Cuenta | "Sí, eliminar" (modal) | ✅ Toast con instrucción de soporte |
| Settings / Planes | "Cambiar a Pro" | ✅ Toast próximamente |
| Settings / Planes | "Hablar con ventas" | ✅ Toast con email de contacto |
| Settings / Conexiones | "Conectar" (GitHub) | ✅ Navega a `/api/auth/github` — OAuth real |
| Settings / Conexiones | "Sugerir integración →" | ✅ Toast con email de contacto |
| Advisory Board | "Cambiar ↗" (6 instancias) | ✅ Toast próximamente |
| Export Center | "Exportar paquete ↑" | ⚠️ Sin handler — requiere lógica de packaging (P2) |
| Export Center | "←" / "→" (paginación) | 🔵 Post-MVP by design — `disabled` hardcoded |
| Document Viewer | Botón send "→" (panel Ajustar) | ✅ Toast próximamente |
| Project View | "Editar propósito" (icono) | ⚠️ Sin handler — requiere modal (P2) |

---

## 2. Secciones stub — estado post-fix

| Pantalla | Sección | Estado |
| --- | --- | --- |
| Settings / Conexiones | Notion, Linear, Slack, Figma | 🔵 Post-MVP — chips "Próximamente" intencionales |
| Settings / Notificaciones | "Guardar preferencias" | ⚠️ No persiste al backend — P2 |
| Settings / Equipo | Lista de colaboradores | ⚠️ Proxy via council_advisors — P2 |
| Sesión de Consejo | "Pedir revisión" | 🔵 Post-MVP — `disabled` con `title="Post-MVP"` |
| Document Viewer | Panel "Ajustar" | ✅ Toast añadido al botón send |
| Document Viewer | "↓ Google Slides" | ⚠️ Link a /export — export-to-slides no existe (P2) |
| Landing page | Productos sin lanzar | 🔵 Post-MVP — chips decorativos intencionales |
| DocumentPreview.tsx | Secciones pendientes | 🔵 Post-MVP — comentario interno |

---

## 3. Modales — estado post-fix

| Pantalla | Modal | Estado |
| --- | --- | --- |
| Settings / Cuenta | Modal "Eliminar cuenta" | ✅ "Sí, eliminar" → toast con instrucción de soporte |
| Settings / Equipo | Modal "Invitar colaborador" | ✅ "Enviar invitación" → POST + toast fallback |
| Settings / Equipo | Confirmación eliminar miembro | ✅ "Sí" → toast |

---

## 4. Botones gated por estado (no son bugs)

| Pantalla | Botón | Condición |
| --- | --- | --- |
| Project View | "Abrir consultoría →" | Se activa cuando `consultation !== null` |
| Project View | "Continuar sesión →" | Se activa cuando `activeStage >= 3` |
| Settings / Planes | "Plan actual" | Disabled decorativo en plan activo |

---

## 5. Errores de manejo pendientes

| Archivo | Función | Estado |
| --- | --- | --- |
| SettingsAccount.tsx | `handleSave()` | ⚠️ Sin catch visible — P2 |
| SettingsNotifications.tsx | `handleSave()` | ⚠️ No hace fetch — P2 |

---

## 6. Pendientes P2 (post-sprint)

- **Export Center "Exportar paquete ↑"** — requiere lógica de empaquetado ZIP de documentos
- **Project View "Editar propósito"** — requiere modal de edición + PATCH a /api/projects
- **Settings Notificaciones** — conectar "Guardar preferencias" a un endpoint real
- **Settings Equipo** — migrar proxy council_advisors a tabla real team_members + API /api/team/invite
- **Document Viewer panel Ajustar** — conectar a API de chat con contexto de documento

---

## 7. Nuevo componente creado

**`src/components/ui/Toast.tsx`** — sistema de toast global.

- `toast(message)` — función callable desde cualquier componente client
- `<ToastProvider>` — montado en `layout.tsx`
- Estilo: fondo `#0D1535`, borde `#B8860B`, 3 segundos de visibilidad

---

Generado por Faber — auditoría estática + E2E — 2026-03-16. Fix pass completado — 2026-03-17.
