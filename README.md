# Frasevia

Aplicación para aprender inglés desde el español: se exploran mazos de contenido,
se crean los propios y se registra el progreso de estudio.

- **Interfaz en español**, contenido de aprendizaje en inglés con explicación y
  traducción al español.
- Cuatro formas de practicar: explorar, elegir significado, completar la frase y
  repaso.
- Sesiones cortas, sin rachas obligatorias.
- El modelo guarda el par de idiomas en cada mazo, así que más adelante se
  pueden agregar otros pares sin cambiar las tablas.

No incluye generación de contenido con IA, pagos ni funciones sociales. El
objetivo de este MVP es el circuito completo: descubrir → copiar o crear →
estudiar → ver el progreso.

---

## Stack

| Pieza | Elección |
| --- | --- |
| Aplicación | React Router 8 en modo Framework (SPA) + Vite 8 |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS v4 |
| Datos, Auth y RLS | Supabase (PostgreSQL) |
| Alojamiento | GitHub Pages (archivos estáticos) |
| Lint y formato | Biome |
| Pruebas | Vitest (lógica) + pgTAP (permisos, vía Supabase CLI) |

El proyecto conserva la configuración de React Router que ya traía el
repositorio: modo Framework y Tailwind v4. Lo que cambió es `ssr: false`: la
aplicación se compila a un único `index.html` y **todos** los datos viajan en
`clientLoader` / `clientAction`, sin ninguna función de servidor. Es lo que
permite publicarla en GitHub Pages sin infraestructura, y no costó nada
particular porque la sesión de Supabase ya vivía en el navegador.

`app/lib/static.test.ts` vigila que no se reintroduzca un `loader` de servidor:
en modo SPA React Router los rechaza al compilar, y conviene enterarse en una
prueba y no a mitad de un despliegue.

## Puesta en marcha

```bash
npm install
cp .env.example .env   # completa las dos variables
npm run dev
```

La aplicación queda en `http://localhost:5173`.

**Sin credenciales la aplicación igual arranca**: muestra un aviso de
configuración en vez de fallar o simular que guardó algo. Es intencional, no
quiere decir que los datos se estén guardando.

### Variables de entorno

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Se acepta también `VITE_SUPABASE_ANON_KEY`, que es el nombre histórico de la
misma clave.

> La clave publicable (antes `anon`) está pensada para el navegador: es segura
> solo si las políticas RLS están correctas, y por eso lo están. **Nunca** uses
> una `service_role` ni ninguna clave secreta en el frontend, ni en
> `.env.example`.

Como Vite reemplaza `VITE_*` en tiempo de compilación, las variables deben estar
definidas **al compilar**, no solo al arrancar.

## Configurar Supabase

### 1. Crear el proyecto y pegar el esquema

En el panel de Supabase, abre el **SQL Editor** y ejecuta:

1. `supabase/migrations/20260930230000_init_frasevia.sql` — tablas, RLS,
   funciones y vistas.
2. `supabase/seed.sql` — los dos mazos oficiales con su contenido.

El seed es idempotente (identificadores fijos y `on conflict do nothing`), así
que se puede volver a aplicar sin duplicar nada.

O, con la CLI de Supabase en local:

```bash
supabase start
supabase db reset    # aplica migraciones + seed
```

### 2. Configurar Auth

En **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:5173` en desarrollo; el dominio real en
  producción.
- **Redirect URLs**, agrega como mínimo:

  ```
  http://localhost:5173
  http://localhost:5173/recuperar-contrasena
  http://localhost:5173/biblioteca
  ```

  Supabase valida contra una lista blanca, así que si usas otro puerto
  (5174, 3000) o un prefijo hay que agregarlos.

- **Authentication → Providers → Email**: activa el correo y contraseña, y deja
  habilitada la recuperación de contraseña (lo usa `/recuperar-contrasena`).

Si el proyecto exige confirmar el correo antes de entrar, el formulario de
registro lo avisa en vez de dar por hecho que la cuenta ya está lista.

### 3. Publicar en GitHub Pages

`main` publica solo. El flujo está en `.github/workflows/pages.yml`:

1. Calcula `BASE_PATH` a partir del nombre del repositorio: `/` si es un
   repositorio de usuario (`usuario.github.io`) y `/<repositorio>` si no.
2. Compila con `npm run build:pages`, que además ejecuta
   `scripts/prepare-pages.mjs`.
3. Sube `build/client` como artefacto y lo despliega.

Antes del primer despliegue hay que:

- **Settings → Pages → Source: GitHub Actions**.
- Añadir `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` en
  **Settings → Secrets and variables → Actions** (el workflow las lee de ahí).
  Sin ellas el sitio arranca igual, pero muestra el aviso de «falta configurar»
  y no guarda nada.
- En Supabase, agregar el dominio real a las **Redirect URLs** y a la lista
  blanca de correo.

Para probarlo en local, imitando lo que hace Pages:

```bash
BASE_PATH=/frasevia npm run build:pages
npx sirv-cli build/client --single
# y abrir http://localhost:4180/frasevia/
```

Dos detalles de Pages que conviene tener presentes:

- **No hay reglas de reescritura.** Una ruta como `/frasevia/biblioteca` no
  corresponde a ningún archivo, así que Pages devuelve el `404.html`, que es
  una copia del shell de la aplicación. El enrutador del cliente recibe la URL
  real y decide qué página mostrar. Por eso una URL inexistente responde 200 y
  termina en la página de «no encontrada» de la propia aplicación, en vez de en
  el 404 de Pages.
- **Los assets llevan el prefijo de la subcarpeta.** Vite emite sus rutas con
  `base: "/"`, y `scripts/prepare-pages.mjs` las antepone después de compilar.
  No se arregla con `base` de Vite porque, en modo SPA, ese valor hace que
  React Router no llegue a escribir `index.html` (react-router#15350). Si algún
  día el sitio se publica en la raíz del dominio, el script no hace nada.

## Seguridad

Las reglas de acceso viven **en la base de datos**, no en los componentes. La
aplicación usa la clave publicable, así que cualquier cosa que no esté permitida
por RLS simplemente no se puede leer ni escribir.

| Regla | Dónde |
| --- | --- |
| Visitantes leen mazos públicos y oficiales | política `decks_select_visible` |
| Las tarjetas se leen solo si su mazo es visible | política `cards_select_visible` |
| Cada quien crea, edita y borra solo sus mazos | políticas `*_own` de `decks` y `cards` |
| Nadie marca un mazo como oficial | `with check (... and not is_official)` |
| Los mazos oficiales son de solo lectura | `author_id` nulo + políticas de escritura |
| El progreso es privado por persona | políticas `progress_*` |
| No se copia ni se estudia nada ajeno | funciones `copy_deck` y `record_practice` |

Detalles que importan:

- `is_deck_visible`, `is_deck_editable` e `is_card_visible` son
  `SECURITY DEFINER` con `search_path` vacío. Sin eso, la política de `cards`
  que consulta `decks` se llamaría recursivamente a sí misma.
- Copiar un mazo lo hace la función `copy_deck`, que valida `auth.uid()` a mano
  (es `SECURITY DEFINER`, así que no puede confiar en RLS) y crea filas con
  identificadores nuevos: editar la copia nunca toca el original.
- El progreso se escribe por `record_practice`, que recibe los deltas de la
  sesión y los acumula. Así dos sesiones simultáneas no se pisan.
- Ambas funciones tienen `revoke ... from public` y `grant` solo a
  `authenticated`.
- Las vistas de resumen usan `security_invoker = on`, así que respetan el RLS de
  las tablas base.
- `redirectTo` se valida en `safeRedirectTo`: sin eso, el formulario de acceso
  sería un redirector abierto.

## Pruebas

```bash
npm run test     # lógica pura: corrección de respuestas, modos, progreso, slugs
npm run check    # lint + tipos + pruebas + build
```

Las pruebas de permisos, de copia de mazos y de progreso necesitan la base de
datos real, y viven en SQL con pgTAP:

```bash
supabase start
supabase db reset
supabase test db
```

## Estructura

```
app/
├── components/        # UI compartida: botones, campos, avisos, diálogo de confirmación
├── features/
│   ├── decks/         # tarjetas de mazo, previsualización del slug
│   └── study/         # motor de estudio (puro) + sus pruebas
├── lib/               # clientes de Supabase, sesión, consultas, tipos, formato
├── routes/            # un módulo por ruta
├── root.tsx           # documento, navegación y estado de autenticación
└── routes.ts          # mapa de rutas
supabase/
├── migrations/        # esquema, RLS y funciones seguras
├── tests/             # pruebas pgTAP de permisos
└── seed.sql           # mazos oficiales
```

### El motor de estudio

`app/features/study/engine.ts` es JavaScript puro, sin React ni Supabase. Ahí
decide qué se muestra y si una respuesta escrita es correcta, lo que permite
probarla sin navegador ni base de datos. Las rutas solo pintan lo que el motor
devuelve.

Cosas que resuelve y que están cubiertas por pruebas:

- Normaliza mayúsculas, comillas tipográficas y puntuación final, y acepta
  responder sin el artículo inicial (`good fit` vale por `a good fit`).
- **Nunca** usa una tarjeta como alternativa correcta de sí misma ni repite su
  propio significado entre las opciones.
- Si el mazo tiene pocas tarjetas para crear alternativas, o si ningún ejemplo
  contiene el término, cambia a un modo que sí funciona con ese contenido y lo
  explica en pantalla.
- Las sesiones son reproducibles: el barajado usa una semilla, no
  `Math.random`.

### Un aviso sobre los nombres de archivo

Los módulos `*.client.ts` **se eliminan del bundle del servidor**. Si uno de esos
módulos se importa desde el código de un componente —que también se renderiza en
el servidor— sus exportaciones llegan como `undefined` y la ruta responde 500 con
`TypeError: (void 0) is not a function`, sin que ni los tipos ni el lint
avisiesten nada.

Por eso los módulos compartidos se llaman `session.ts`, `decks.ts` y
`supabase.ts`, y no con sufijo. `app/lib/naming.test.ts` falla si alguien vuelve a
usar `.client.ts`. Ya no queda ningún `.server.ts`: sin servidor de por medio, el
código de servidor tendría que mudarse al cliente o desaparecer, y
`app/lib/static.test.ts` vigila que no vuelvan los `loader` de servidor.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción (SPA) |
| `npm run build:pages` | Build + el paso de preparación para GitHub Pages |
| `npm run typecheck` | Genera los tipos de ruta y corre `tsc` |
| `npm run lint` | Biome (lint y formato) |
| `npm run test` | Vitest |
| `npm run check` | Todo lo anterior, en orden |

Hay dos flujos en GitHub: `ci.yml` corre lint, tipos, pruebas y build en cada
push y pull request, y `pages.yml` publica el sitio.
