# Venture Builder — Reason Framework

Herramienta interna de incubación de negocios. Permite concebir y documentar productos de alto valor usando el Reason Framework, guiado por un consejo asesor de IA.

## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- [VS Code](https://code.visualstudio.com/)
- Extensión de VS Code: **Pencil** (para ver los archivos `.pen` de diseño)
- Git

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/Taskforce-Nexus/venture-builder.git
cd venture-builder

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con las claves reales (te las pasa el fundador por separado)

# 4. Levantar el servidor de desarrollo
npm run dev -- -p 3047
```

La app corre en **http://localhost:3047**

## Variables de entorno

Copia `.env.example` como `.env.local` y rellena con los valores reales:

```
NEXT_PUBLIC_SUPABASE_URL=        # URL del proyecto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Clave pública Supabase
SUPABASE_SERVICE_ROLE_KEY=       # Clave de servicio Supabase (solo servidor)
ANTHROPIC_API_KEY=               # Clave de Claude API
CLAUDE_USE_CHEAP=true            # true = usa Haiku (pruebas), omitir = Sonnet (produccion)
```

> Las claves reales NO estan en el repo. El fundador te las pasa por separado.

## Ver los disenos en Pencil

Los archivos `.pen` contienen los mockups y pantallas del sistema:

- `Reason.pen` — Pantallas del Reason Framework
- `venture-builder.pen` — Pantallas de la Incubadora

Para abrirlos:
1. Instala la extension **Pencil** en VS Code
2. Abre VS Code en la carpeta del proyecto
3. Haz clic derecho sobre el archivo `.pen` y selecciona **Abrir con Pencil**

## Estructura del proyecto

```
src/
  app/
    (auth)/           # Login y registro
    (dashboard)/      # Panel principal y proyectos
    api/              # Rutas de API (chat, extract, advisors)
  components/
    incubadora/       # Componentes de La Incubadora
    dashboard/        # Componentes del panel
    ui/               # Componentes shadcn/ui
  lib/
    claude.ts         # Wrapper Claude API con reintentos
    prompts.ts        # Prompts del sistema
    advisors.ts       # Configuracion de 9 asesores
    types.ts          # Tipos TypeScript
```

## Rutas principales

| Ruta | Descripcion |
|------|-------------|
| `/` | Landing / redireccion |
| `/login` | Inicio de sesion |
| `/register` | Registro |
| `/(dashboard)` | Lista de proyectos |
| `/project/[id]` | Vista del proyecto |
| `/project/[id]/incubadora` | Sesion de La Incubadora |

## Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Base de datos:** Supabase (Postgres + Auth)
- **IA:** Claude API (Anthropic) — Sonnet para produccion, Haiku para pruebas
- **Diseno:** Pencil (archivos `.pen`)
