# AGENTS.md

Instrucciones para trabajar en Frasevia. Las **decisiones** y sus motivos están en el [README](./README.md); aquí están las **prácticas** que hay que seguir al escribir código. Si dudas de *por qué*, el README; si dudas de *cómo*, este archivo.

## El proyecto en tres líneas

Aplicación de tarjetas (idiomas y repaso general) en español e inglés.
React Router 8 en **modo Framework SPA** (`ssr: false`), Vite, TypeScript,
Tailwind v4, Supabase con RLS. Se publica como estático en **GitHub Pages**: no hay servidor.

## Comandos

```bash
npm run dev         # servidor de desarrollo en :5173
npm run check       # lint + tipos + pruebas + build. La puerta única.
npm run lint:fix    # aplica correcciones de Biome
npm run test        # solo vitest
npm run typecheck   # react-router typegen + tsc
npm run build:pages # build + paso de preparación para Pages
```

Antes de dar algo por terminado, `npm run check`. CI corre los mismos cuatro pasos, uno a uno, y `main` publica automáticamente.

Base de datos (manual, no está en CI):

```bash
supabase start && supabase db reset && supabase test db
```

## La regla que manda sobre las demás

**Los comentarios explican el *por qué*, no el *qué*.** Cada módulo y cada función exportada abre con un bloque `/** … */` de 3 a 12 líneas que dice qué motivo tiene existir y qué se decidió descartar. Cuando una decisión parece raro, está escrita **en el sitio donde pasa**, no en un documento aparte.

Es la característica más importante del repositorio. Un comentario que repite el código no vale; uno que explica por qué se eligió así, sí.

```ts
/** Acepta `httpOnly` no sirve... */   // ✅ explica la consecuencia
/** Devuelve el cliente de supabase. */ // ❌ repite la firma
```

## Dónde vive cada cosa

```
app/routes/       un módulo por ruta: trae datos, guarda, pinta. Nada más.
app/features/     lógica de dominio: lo que sabe de mazos, estudio o IA
app/components/   UI compartida: sabe de sesión, no de dominio
app/components/ui primitivas sin dominio ni i18n (salvo ConfigNotice)
app/lib/          lo que sabe de la base de datos, un módulo por dominio
app/lib/locales/  catálogos de traducción, en español e inglés
supabase/         esquema, RLS y pruebas pgTAP
```

Reglas de dependencia, en este orden:

- Una **ruta** es una tabla de contenidos: su `clientLoader`, su `clientAction` y la lógica que llevan están en `features/` o `lib/`.
- Lo que sabe de **dominio** va en `features/`, nunca en `components/`.
- Lo que sabe de la **base de datos** va en `lib/<dominio>/`, y siempre a través de su barril (`~/lib/decks`, `~/lib/reviews`). Nadie importa de `./read` o `./write` directamente, salvo el propio `index.ts`.
- La **lógica pura** va en un archivo sin React y con su `.test.ts` al lado. Es lo único que se puede probar sin navegador ni base de datos.

Usa el alias `~/*` → `app/*`. Los tipos de ruta son `./+types/<nombre>`.

### Dentro de `lib/<dominio>/`

`read.ts` es lo que se **pregunta**, `write.ts` lo que se **cambia**, y `rows.ts` tiene la forma exacta de una fila y sus reglas. El barril declara en su cabecera el motivo de cada archivo.

Cuidado: `read.ts` y `write.ts` no deben importarse mutuamente. Si comparten columnas, se sacan a un `columns.ts` (como `decks/rows.ts`), no a través del otro módulo.

## Convenciones de UI

`app/components/ui/` es el molde a imitar:

```tsx
// 1. Constante base + diccionario de variantes con `as const`
const BUTTON_BASE = "…";
const BUTTON_VARIANTS = { primary: "…", ghost: "…" } as const;
export type ButtonVariant = keyof typeof BUTTON_VARIANTS;

// 2. Se exporta la función de clases, para no reescribirlas a mano
export function buttonClass(variant: ButtonVariant = "primary") { … }

// 3. Componente con `className` como ranura y `...props` al final
export function Button({ variant = "primary", className, ...props }
  : ComponentProps<"button"> & { variant?: ButtonVariant }) { … }
```

- Importa siempre desde el barril `~/components/ui`, nunca de `./ui/button`.
- El tipo sale del diccionario (`keyof typeof VARIANTS`), nunca se duplica.
- `cx()` solo filtra y une: **no resuelve conflictos** como `tailwind-merge`. Una clase que compita con la variante se gana por orden en el CSS, no por posición en el `className`. Si necesitas sobrescribir, usa una variante.
- `memo`, `useMemo` y `useCallback` se justifican con un comentario sobre el coste concreto que evitan.
- Todo componente exportado abre con su bloque de comentario.

### Estilos

- **Nunca escribas un color literal.** Siempre un token de `@theme` (`bg-paper`, `text-ink`, `border-line`, `text-brand`, `bg-brand-solid`…).
- **No uses `dark:` para decidir color.** El tema noche redefine las mismas variables de `@theme` en `.dark`. `dark:` solo sirve para mostrar u ocultar.
- `style={{ }}` solo cuando el valor es dinámico y no derivable de clases.
- Foco visible, `prefers-reduced-motion` y `cursor: pointer` ya están resueltos globalmente en `app.css`. No los repitas.

### Accesibilidad

Viene bien resuelta, así que hay que mantenerlo:

- `<label htmlFor>` obligatorio (`Field` lo exige en el tipo).
- Iconos decorativos con `aria-hidden`.
- `role="alert"` en errores de campo, `role="status"` en avisos.
- `<dialog>` nativo a través de `components/dialog.tsx`, que exige `aria-labelledby`.
- Excepciones al lint de Biome van con `biome-ignore` **y el motivo**.

## Convenciones de i18n

- **Ningún texto visible, `aria-label` ni `placeholder` hardcodeado en JSX.** Siempre `tr(...)` (dentro de un componente) o `t(...)` (fuera de React, en `format.ts`, `locale.ts`, `meta()` de rutas).
- Dentro de los componentes, `useT()` se renombra a `tr` para poder llamarla inline: `const tr = useT()`.
- Las claves van **por pantalla**, no por texto: `biblioteca.metaTitle`, `estudiar.jumpToCard`. Así cambiar una redacción no toca el código que la usa.
- Los catálogos son objetos planos de **valores sin clave**, con `satisfies Messages`, partidos en `locales/es/*.ts` y `locales/en/*.ts` y unidos en `es.ts` / `en.ts`.
- `es.ts` es la fuente de verdad: define `SpanishKey` y el inglés se comprueba contra él.
- Al añadir una clave hay que escribir **los dos idiomas**, con los mismos marcadores `{placeholder}` y sin dejar ningún mensaje vacío.
- El contenido de demostración de los mazos de muestra **no se traduce**: el idioma de la interfaz no es el del contenido.
- Si añades un idioma a `LOCALES`, hay que escribir su catálogo.

## Convenciones de datos

- El cliente se pide con `getSupabaseBrowser()`, que devuelve `null` si faltan credenciales. La app **arranca igual** y muestra `<ConfigNotice />`; no falles, no simules y no inventes datos.
- El estado `unconfigured` viaja como unión discriminada (`status: "unconfigured" | "ready" | "error" | "not-found"`) y cada ruta tiene sus ramas explícitas.
- La capa de datos **nunca lanza**: devuelve `{ error }` o un tipo discriminado con la etapa (`stage: "deck" | "cards"`). Las rutas traducen ese error.
- Las columnas se centralizan (`DECK_COLUMNS`, `CARD_COLUMNS`, `CARD_EDITABLE_FIELDS`); no escribas listas de columnas a mano dos veces.
- El mapeo `snake_case` ↔ dominio ocurre **en un solo punto** (`rows.ts`, `toStudyCard`). Los borradores de entrada son `camelCase`.
- Las lecturas del catálogo público se llaman solas; las de datos propios reciben `supabase` y `userId` explícitos.
- No uses tipos generados de Supabase: los tipos del dominio están a mano en `app/lib/types.ts` y reflejan `supabase/migrations/`.
- Nunca una clave `service_role` en el frontend ni en `.env.example`.
- Toda redirección pasa por `safeRedirectTo` / `internalPath`; nunca construyas una ruta a mano desde un parámetro.

## Convenciones de SQL

- Toda función `security definer` lleva **`set search_path = ''`** y cualifica sus tablas. Sin eso, la política de `cards` que consulta `decks` se llama recursivamente a sí misma.
- Toda función expuesta lleva `revoke ... from public` y `grant execute ... to authenticated`.
- Las vistas de resumen son `with (security_invoker = on)`.
- Una migración se llama `YYYYMMDDHHMMSS_snake_case.sql` y **reemplaza funciones y vistas enteras con `create or replace`**, nunca con `alter` incremental.
- El **error de una regla de negocio vive en la base** (`raise exception` con `errcode` explícito: `42501` no autorizado, `22023` parámetro inválido, `P0002` no encontrado), no en el cliente.
- Las claves ajenas, cascadas y disparadores se resuelven en SQL. El cliente no calcula `card_count` ni `slug`.
- El seed es idempotente: UUID fijos y `on conflict do nothing`.
- Si añades una migración, actualiza la lista de la sección «Configurar Supabase» del README.

## Pruebas

- **`describe` e `it` en español**, con el nombre de la función (`describe("normalizeAnswer")`) y frases en castellano cuando el nombre no explica lo suficiente.
- **Nada de mocks.** Ni `vi.mock`, ni `vi.fn`, ni `vi.spyOn`. Los fakes se escriben a mano y se **inyectan por parámetro** (`SupabaseClient`, `StorageLike`, `tr`), que es lo que hace testeable el código de producción sin tocarlo. `app/lib/decks/write.test.ts` es el ejemplo a copiar.
- Determinismo: reloj y RNG inyectados, fixtures con fecha fija. Nunca `Date.now()` ni `Math.random()` dentro de una función de producción.
- Tablas de casos con `it.each`.
- Importa `{ describe, expect, it } from "vitest"`: no hay `globals`.
- `vitest.config.ts` usa `environment: "node"` y solo recoge `*.test.ts`, así que un `.test.tsx` **no se ejecutaría en silencio**. Los componentes no se prueban; su lógica se extrae a un módulo puro que sí se prueba.
- Lo que toca la base de datos se prueba en pgTAP, en `supabase/tests/`, con `set_config('request.jwt.claims', …)` **y `set local role`**, dentro de `begin` / `rollback`.

### Los meta-tests

Cinco pruebas leen el sistema de archivos y vigilan la arquitectura. Antes de tocar algo, mira esta tabla: **si rompes una de estas reglas, el sitio no funciona y ni los tipos ni el lint avisan.**

| Prueba | Qué prohibe |
| --- | --- |
| `app/lib/static.test.ts` | `export function loader`, `action`, `headers` o `middleware` en cualquier ruta; `HydrateFallback` fuera de `root.tsx` |
| `app/lib/navigation.test.ts` | `throw redirect(` en **todo** `app/` fuera del cuerpo de un `clientLoader` / `clientAction` |
| `app/lib/naming.test.ts` | Módulos `*.client.ts` (se pierden en el bundle) |
| `app/lib/size.test.ts` | Que un archivo supere el techo de su zona |
| `app/lib/routes-paths.test.ts` | Que `routes.ts` y `ROUTE_PATTERNS` se desincronicen |

Los techos de `size.test.ts` están **por encima del objetivo** en casi todas las zonas, porque el refactor sigue a medias:

| Zona | Techo actual | Objetivo |
| --- | --- | --- |
| Un módulo de ruta | 830 | 130 |
| Componente compartido (`components/`) | 540 | 300 |
| Código de dominio (`features/`) | 470 | 300 |
| Código de biblioteca (`lib/`) y raíz de la app | 330 | 300 |
| Un catálogo de traducción | 240 | ya cumplido |

Quedan tres archivos sobre el techo, y son el trabajo pendiente: `routes/mazo-ia.tsx` (821), `components/selection-quick-add.tsx` (526) y `root.tsx` (318).

Cuando partes un archivo, **baja el techo en el mismo commit**. Subirlos sin motivo es tan malo como dejar que un archivo crezca solo.

## Rutas

Al añadir una ruta hay que tocar **los dos sitios**, o la pantalla nueva saldrá con un rectángulo gris durante la carga sin dar ningún error:

1. `app/lib/routes-paths.ts` — el patrón y, si es privada, `PRIVATE_ROUTES`.
2. `app/routes.ts` — dónde vive el módulo.
3. `app/components/navigation-skeleton/target.ts` — qué esqueleto se pinta.

`routes-paths.test.ts` cruza 1 y 2 contra el disco; no cubre 3, esa va a mano.

## Commits

Conventional Commits, **en español y sin tildes ni ñ** (para evitar líos de codificación entre entornos):

```
refactor: saca las escrituras de las pantallas a lib/
feat: anade el modo de repaso general
fix: no lanza el redirect desde el manejador
test: agrega techo de tamano por archivo
```

Mantén los commits ajustados al cambio. El cuerpo, cuando haga falta, dice por qué y no qué.

## Lo que no hay que romper nunca

- `ssr: false`. No introduzcas un `loader` de servidor, ni un `*.client.ts`, ni un `HydrateFallback` en una ruta hija.
- No toques `base` de Vite ni `assetsDir`: rompe el build SPA (react-router#15350). El prefijo de los assets lo pone `scripts/prepare-pages.mjs` **después** de compilar.
- No añadas JavaScript de terceros ni pases nada por `innerHTML` venga de donde venga. La CSP es la última línea de defensa de la clave de OpenRouter.
- No subas el techo de un archivo en `size.test.ts` para que quepa tu cambio.
- No inventes datos cuando faltan las credenciales: avisa.
- No uses `Math.random()` para barajar: las sesiones tienen que ser reproducibles con semilla.
