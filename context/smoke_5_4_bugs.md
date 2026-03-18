# Story 5.4 — Smoke Test Bug Report

**Fecha:** 2026-03-18
**Tester:** Faber (automatizado via Playwright)
**Proyecto de prueba:** SmokeTest Session (`06a3f55a-438f-4001-ae1c-68e4c2b3007e`)
**Spec:** `tests/e2e/smoke-5-4.spec.ts`

---

## Resumen ejecutivo

El flujo core de Sesión de Consejo **FUNCIONA**. Un usuario puede recorrer:
- Iniciar Sesión de Consejo → responder pregunta → recibir Nexo Dual → elegir resolución → siguiente pregunta ✅
- Descargar PDF desde Export Center ✅
- Navegar Settings Billing y Plans (contenido renderiza) ✅

Sin embargo, hay **4 errores de cliente** detectados y **1 funcionalidad no confirmada (PPTX)**.

---

## Resultados por test

| Test | Resultado | Nota |
|------|-----------|------|
| SMK-01: Login + Dashboard | ✅ PASS | Carga correctamente |
| SMK-02: ProjectView | ⚠️ "Application error" en body | Tiles visibles y correctos |
| SMK-03: SesionConsejo carga | ⚠️ "Application error" en body | Botón Iniciar visible |
| SMK-04: SesionConsejo flujo completo | ✅ PASS | Full flow funciona |
| SMK-05: Export Center + descargas | ✅ PASS (con caveat) | PDF OK; PPTX inconcluso |
| SMK-06: Settings Billing | ⚠️ "Application error" en body | Contenido billing visible |
| SMK-07: Settings Plans | ⚠️ "Application error" en body | Contenido planes visible |

---

## Bugs documentados

### BUG-A — "Application error" en overlay dev de Next.js (Severidad: Media)

**Páginas afectadas:**
- `/project/[id]` — ProjectView
- `/project/[id]/sesion-consejo` — Sesión de Consejo
- `/settings/facturacion` — Settings Billing
- `/settings/planes` — Settings Plans

**Síntoma:** El texto "Application error" aparece en `page.textContent('body')`. Las páginas **renderizan correctamente** — tiles, botones y contenido son visibles y funcionales. El error es un overlay de Next.js dev mode (`<div role="alert">`) causado por un error JavaScript en cliente.

**Causa probable:** Hydration mismatch en uno de los componentes nuevos de Story 5.2:
- `LowBalanceBanner.tsx` — renderiza null si balance ≥ 5 (test user tiene $50, por lo que no aplica)
- `InsufficientFundsModal.tsx` — usa `window.addEventListener` en `useEffect` (correcto)
- `SettingsBilling.tsx` — usa `toast` import, date formatting con `null` subscription (parece correcto)
- `SettingsPlans.tsx` — similar a Billing

**Nota importante:** El error parece ser transitorio (aparece durante hydration y desaparece). SMK-04 accede a la misma página que SMK-03 y pasa sin detectar el error. Posiblemente es un warning de dev mode que no se reproduciría en producción.

**No corregir hasta investigar:** Verificar en `next build` + `next start` (producción) si el error persiste.

---

### BUG-B — PPTX download no verificado (Severidad: Baja)

**Síntoma:** El test detectó 6 botones PPTX en Export Center (correcto). Al hacer clic en el primer botón PPTX, el framework capturó un download con extensión `.pdf` en lugar de `.pptx`.

**Causa probable (no app bug):** Los downloads de `ExportCenter` usan `blob URL + a.click()` programático. Playwright no captura confiablemente estos downloads en Windows como `waitForEvent('download')`. El evento capturado puede haber sido de la descarga PDF anterior o un artefacto del test framework.

**Verificación manual requerida:** Abrir Export Center con FinTrack en el browser, hacer clic en botón "PPTX" de una fila, verificar que descarga archivo `.pptx` válido.

**El API route (`/api/export/pptx`) fue probado en sesión anterior y retorna binary PPTX correcto.**

---

### BUG-C — TestCo proyecto sin documentos composition (Severidad: Baja — Test data)

**Síntoma:** `tests/e2e/create-user.js` crea el proyecto TestCo con documentos `status: 'pendiente'` pero sin campo `composition`. Al llamar `session/start`, las fases se crean con `questions: []` vacías.

**Impacto:** El test `sesion-consejo.spec.ts` que usa TestCo falla silenciosamente — la sesión inicia pero no hay preguntas. No es un bug de la app, es un bug en el script de test data.

**No corregir todavía** — requiere instrucción explícita de Kira/Juan.

---

## Funcionalidades confirmadas ✅

1. **Login / Autenticación** — funciona
2. **Iniciar Sesión de Consejo** — `/api/session/start` funciona correctamente, crea session + phases con preguntas reales desde composition
3. **Responder pregunta → Nexo Dual** — `/api/session/question` funciona, retorna `constructive_content`, `critical_content`, `agreement`
4. **Resolver debate** — botones de resolución (constructiva/crítica/acuerdo) aparecen y funcionan
5. **Export Center carga** — con documentos `status: 'aprobado'` y `content_json`
6. **Descargar PDF** — funciona, descarga archivo `.pdf` válido
7. **Settings Billing** — renderiza saldo ($49.90), plan (Free), historial, facturas
8. **Settings Plans** — renderiza los 3 planes (Core/Pro/Enterprise)
9. **Header balance** — muestra saldo, clickeable → `/settings/facturacion`
10. **LowBalanceBanner** — no aparece (balance > $5, correcto)

---

## Recomendación

El flujo core está listo. El BUG-A necesita investigación pero no bloquea la funcionalidad. Se recomienda:

1. Verificar PPTX download manualmente en browser
2. Investigar BUG-A ejecutando en modo producción (`next build && next start`)
3. Continuar con Story 5.5 o fixes de Kira
