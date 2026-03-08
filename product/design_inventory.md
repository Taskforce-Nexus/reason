# Design Inventory — AURUM

Fuente de verdad del estado de todos los frames en `design/aurum.pen`.

---

## Inventario congelado — 2026-03-06

| Frame ID | Nombre | Estado |
|----------|--------|--------|
| `q8SC3`  | Projects__ProjectView__Default | FROZEN ✓ |
| `EkILi`  | Projects__Incubator__Default | FROZEN ✓ |

---

## Inventario completo del archivo aurum.pen

### Auth

| Frame ID | Nombre | Estado |
|----------|--------|--------|
| `VLgFK`  | Auth__Login__Default | DEFAULT |
| `ImOMW`  | Auth__Register__Default | DEFAULT |

### Projects

| Frame ID | Nombre | Estado |
|----------|--------|--------|
| `H18Fg`  | Projects__Dashboard__Default | DEFAULT |
| `q8SC3`  | Projects__ProjectView__Default | **FROZEN** |
| `EkILi`  | Projects__Incubator__Default | **FROZEN** |
| `zNxsb`  | Projects__SeedSession__Default | DEFAULT |
| `kWlfu`  | Projects__CreateProject__Modal | DEFAULT |
| `SQiRG`  | Projects__InviteCollaborator__Modal | DEFAULT |

### Advisory Board

| Frame ID | Nombre | Estado |
|----------|--------|--------|
| `cFRkE`  | Projects__AdvisoryBoard__MyBoard | DEFAULT |
| `38xvl`  | Projects__AdvisoryBoard__CatalogDrawerModal | DEFAULT |
| `Xpdtg`  | Projects__AdvisoryBoard__AdvisorCatalogModal | DEFAULT |
| `v1cxO`  | Projects__AdvisoryBoard__InvitedAdvisorModal | DEFAULT |
| `qCeyT`  | Projects__AdvisoryBoard__BuyerPersonaModal | DEFAULT |

### Documents

| Frame ID | Nombre | Estado |
|----------|--------|--------|
| `hXo6q`  | Documents__ValueProposition__Default | DEFAULT |
| `Ol9Fc`  | Documents__ValueProposition__Contenido | DEFAULT |
| `eB1Cm`  | Documents__ValueProposition__Identidad | DEFAULT |
| `Zoeeq`  | Documents__Branding__Default | DEFAULT |

### Settings

| Frame ID | Nombre | Estado |
|----------|--------|--------|
| `xpOPA`  | Settings__Billing__Default | DEFAULT |

### Export

| Frame ID | Nombre | Estado |
|----------|--------|--------|
| `aXs5x`  | Export__Center__Default | DEFAULT |

### Marketing

| Frame ID | Nombre | Estado |
|----------|--------|--------|
| `wdDhX`  | Marketing__Landing__Default | DEFAULT |

### Shared

| Frame ID | Nombre | Estado |
|----------|--------|--------|
| `kdScq`  | Shared__ConfirmAction__Modal | DEFAULT |

---

## Reglas de freeze

- Un frame FROZEN no puede modificarse sin descongelarlo explícitamente.
- Para descongelar: cambiar estado a DEFAULT y documentar la razón.
- Solo el fundador puede aprobar un freeze o desfreeze.
- La fuente de verdad es este archivo, no el .pen.

---

## Historial de freeze

| Fecha | Frame | Acción | Aprobado por |
|-------|-------|--------|--------------|
| 2026-03-06 | Projects__ProjectView__Default | FREEZE | Fundador |
