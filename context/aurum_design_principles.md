# Reason — Principios de Diseño UI/UX

Lectura obligatoria antes de modificar cualquier frame.

---

## 1. Contención de texto

- Todo texto dentro de contenedor de ancho fijo: textGrowth: "fixed-width" + width: "fill_container"
- Nunca texto con crecimiento libre dentro de cards, burbujas, columnas o tablas
- El texto nunca desborda fuera de su contenedor visible
- Texto largo: usar truncado con ellipsis, nunca romper el layout

---

## 2. Jerarquía visual

- Cada pantalla tiene exactamente un elemento de máximo peso visual
- Labels de sección: mayúsculas, 10-11px, tracking amplio, opacidad 50-60%
- El contenido principal nunca compite con navegación o chrome del sistema
- Escala tipográfica estricta: título > subtítulo > body > label > caption
- Nunca dos elementos del mismo peso visual en la misma zona

---

## 3. Espaciado y respiro

- Padding interno de cards y burbujas: mínimo 12px vertical, 16px horizontal
- Separación entre secciones del sidebar: mínimo 20px
- Separación entre párrafos dentro de una burbuja: mínimo 8px
- Nunca pegar elementos al borde del frame sin padding
- Grupos de elementos relacionados: 8px entre ellos, 20px entre grupos

---

## 4. Burbujas de chat

- Burbuja usuario (derecha): máximo 65% del ancho del área de chat
- Burbuja agente (izquierda): máximo 75% del ancho del área de chat
- Margen mínimo entre burbuja y borde del frame: 16px
- Padding interno: 12px vertical, 16px horizontal
- Avatar del agente: 28-32px, alineado al inicio de la burbuja
- Nunca dos burbujas del mismo lado sin separación mínima de 8px

---

## 5. Densidad por tipo de pantalla

- Pantallas operativas (ProjectView, Incubator): densidad media-alta
- Pantallas de conversación (SeedSession): densidad baja — el fundador respira
- Pantallas de documento (Branding, ValueProposition): densidad media — lectura cómoda
- Pantallas de lista (Dashboard): densidad alta — máxima información útil por viewport

---

## 6. Patrones CRUD

### Listas
- Siempre mostrar estado vacío cuando no hay items — nunca lista en blanco sin mensaje
- Cada item de lista tiene: identificador principal + metadata secundaria + acciones contextuales
- Acciones de item: visibles en hover o en menú de tres puntos — nunca siempre visibles para todos los items
- Orden por defecto explícito: más reciente primero salvo contexto diferente
- Paginación o scroll infinito — nunca cargar todo sin control

### Formularios
- Label siempre arriba del campo, nunca solo placeholder
- Placeholder describe el formato esperado, no repite el label
- Campos requeridos marcados — nunca asumir que el usuario sabe cuáles son
- Validación inline al perder foco — nunca solo al submit
- Botón primario siempre al final del formulario, alineado a la derecha o full width
- Botón cancelar/secundario a la izquierda del primario
- Nunca deshabilitar el botón de submit — mejor mostrar errores al intentar

### Estados de items individuales
- Pendiente: gris / sin acción disponible hasta completar prerrequisito
- En progreso: azul / acción disponible
- Completado: verde o gold / opcionalmente colapsado
- Error: rojo / con mensaje de qué falló y cómo resolverlo
- Bloqueado: candado + tooltip explicando por qué

### Confirmación de acciones destructivas
- Eliminar / archivar / resetear siempre piden confirmación
- Modal de confirmación: describe exactamente qué se va a perder
- Botón destructivo en rojo, botón cancelar prominente
- Nunca acción destructiva en un solo clic sin confirmación

---

## 7. Navegación y orientación

- El header siempre muestra: nombre del proyecto + fase actual + acción de salida
- Indicador de fase: "Fase X de 13"
- Breadcrumb en pantallas de documento: Proyecto → Sección → Documento
- El usuario siempre sabe dónde está, de dónde vino y cómo volver
- Acción de volver siempre visible — nunca atrapar al usuario en una pantalla

---

## 8. Feedback y estados del sistema

- Toda acción asíncrona tiene estado de loading visible
- Spinner solo para operaciones cortas (<3s) — para largas usar progress bar con descripción
- Éxito: toast o badge verde, desaparece solo después de 3-4s
- Error: mensaje inline cerca del origen del error, nunca solo en toast
- Estado vacío: ilustración o icono + mensaje descriptivo + acción principal sugerida
- Skeleton screens en lugar de spinners para cargas de contenido

---

## 9. Acciones y botones

- Jerarquía de botones por pantalla: un primario, máximo dos secundarios, ghostes ilimitados
- Botón primario: gold fill con texto negro — acción más importante de la pantalla
- Botón secundario: borde sutil, fondo oscuro
- Botón ghost/terciario: solo texto o ícono, sin borde ni fondo
- Botones destructivos: rojo, siempre con confirmación
- Nunca más de un botón primario visible al mismo tiempo
- Iconos en botones: siempre acompañados de texto salvo casos de espacio muy reducido
- Botones deshabilitados: opacidad 40%, cursor not-allowed, tooltip explicando por qué

---

## 10. Tablas y listas de datos

- Header de columna siempre fijo al hacer scroll
- Columna de acciones siempre a la derecha
- Filas con hover state visible
- Datos numéricos alineados a la derecha
- Texto alineado a la izquierda
- Celdas con texto largo: truncado con tooltip al hover
- Checkbox de selección múltiple a la izquierda si aplica

---

## 11. Modales y drawers

- Modal: para acciones críticas, confirmaciones, formularios cortos
- Drawer: para formularios largos, detalles de item, configuración contextual
- Siempre con overlay oscuro detrás
- Siempre con X visible para cerrar
- Nunca modal dentro de modal
- El foco se mueve al modal al abrirse
- Cerrar con Escape o clic en overlay

---

## 12. Hacks y patrones avanzados

- **Perceived performance**: mostrar skeleton/placeholder inmediatamente, cargar datos en background
- **Progressive disclosure**: mostrar solo lo necesario, expandir bajo demanda — nunca dump de información
- **Anchoring**: el elemento más importante siempre en la misma posición entre sesiones — el usuario aprende dónde está
- **Affordance**: los elementos interactivos deben verse interactivos — hover state, cursor pointer, borde o sombra
- **Chunking**: agrupar información relacionada — el ojo humano procesa grupos, no elementos individuales
- **F-pattern reading**: lo más importante en la parte superior izquierda — el usuario escanea en F
- **Friction reduction**: reducir clics al mínimo para acciones frecuentes — acciones frecuentes deben ser de un clic
- **Reversibility**: cuando sea posible, las acciones deben ser reversibles — si no, advertir antes
- **Consistency**: mismos patrones para mismas acciones en todo el producto — el usuario no debe reaprender

---

## 13. Estilo global Reason

- Fondo oscuro, premium, estructurado
- Colores de acento: gold = acciones primarias / azul = Nexo y sistema / verde = estados activos / gris = pendiente / rojo = destructivo o error
- Tipografía: jerarquía clara, sin más de 3 tamaños por pantalla
- Bordes: sutiles, radio consistente — 6-8px para cards, 4px para inputs, 999px para badges y pills
- Sombras: solo para modales y elementos flotantes — no decorativas
- Sin decoración innecesaria — cada elemento tiene función

---

## Checklist antes de aprobar cualquier frame

- [ ] Ningún texto desborda su contenedor
- [ ] Jerarquía visual clara — un elemento dominante por pantalla
- [ ] Todos los estados representados: normal, hover, vacío, error si aplica
- [ ] Acciones CRUD con confirmación en destructivas
- [ ] Header con orientación completa
- [ ] Espaciado consistente entre grupos
- [ ] Botones con jerarquía correcta — un solo primario
- [ ] Densidad apropiada para el tipo de pantalla
