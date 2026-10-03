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

No incluye pagos ni funciones sociales. El objetivo del MVP es el circuito
completo: descubrir → copiar o crear → estudiar → ver el progreso.

La generación de tarjetas con IA sí está, y es **opcional**: se puede crear un
mazo entero a partir de un concepto, pero solo si quien está usa pone su propia
clave de un proveedor. La aplicación no trae claves ni paga por las peticiones.
Ver [Generación con IA](#generación-con-ia) para el detalle, incluida la parte
de seguridad, que es lo más delicado de todo esto.

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
2. `supabase/migrations/20261003090000_scheduled_reviews.sql` — niveles
   personales, calendario por ficha y dirección, historial idempotente y vistas
   de cola.
3. `supabase/seed.sql` — los dos mazos oficiales con su contenido.

El seed es idempotente (identificadores fijos y `on conflict do nothing`), así
que se puede volver a aplicar sin duplicar nada.

La migración de repaso es aditiva: conserva `user_card_progress` y las
estadísticas anteriores. Como esos registros no guardaban una próxima fecha,
no los interpreta como retirados ni inventa un intervalo; al abrir un mazo, las
fichas sin una fila nueva de calendario aparecen como nuevas para el repaso por
memoria. Los niveles predeterminados son Difícil (2 horas), Normal (1 día
calendario local), Fácil (5 días) y Súper fácil (retirar). El servidor guarda
los eventos y las fechas en UTC; los días se calculan en la zona horaria IANA
del navegador para conservar la hora local ante cambios de horario.

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

- **Authentication → Providers → Google** (opcional, pero hay que activarlo para
  que el botón de las pantallas de acceso y de registro funcione): pon el
  **Client ID** y el **Client Secret** de Google Cloud, y en Google pon la
  **Authorized redirect URI**:

  ```
  https://<project-ref>.supabase.co/auth/v1/callback
  ```

  No hace falta ninguna clave en `.env`: el diálogo OAuth lo lleva Supabase y el
  canje del código ocurre en el navegador.

  El botón se muestra **solo si el proveedor está encendido**: la pantalla de
  acceso consulta `/auth/v1/settings` (público, enumera los proveedores) y
  consulta en vivo. Al activarlo en el panel, el botón aparece sin compilar ni
  republicar. La comprobación está en `app/lib/google-auth.ts` y hay una razón
  detrás: `signInWithOAuth` no consulta nada, solo lanza al navegador, así que
  con el proveedor apagado el error es un `400` con un JSON crudo en el dominio
  de Supabase que no se puede interceptar desde la aplicación.

#### Una particularidad de la vuelta de Google

Google devuelve a la persona a la **raíz del sitio**, no a la ruta que quería
abrir. No es descuido: en GitHub Pages la raíz es la única dirección que
responde con un `200` (todo lo demás se sirve con `404.html`), y además es la
única que se puede dejar en la lista blanca de Supabase sin añadir una entrada
por cada ruta de la aplicación. La ruta pretendida se guarda en
`localStorage` antes de saltar y se recupera al volver
(`app/lib/auth-redirect.ts`).

Por lo tanto, en **Redirect URLs** hay que añadir la raíz **con el prefijo**:

```
http://localhost:5173/            # desarrollo, sitio en la raíz del dominio
https://usuario.github.io/frasevia/   # Pages en una subcarpeta
https://usuario.github.io/            # Pages en la raíz del dominio
```

La CSP no necesita cambios: el canje del código es una petición al origen de
Supabase, que ya está en `connect-src`.

Un detalle al que conviene estar atento: si la cuenta se creó con Google y luego
se intenta entrar con correo y contraseña, Supabase no tiene ninguna contraseña
para esa cuenta. Es el camino que hace que «antes entraba y ahora no»: o se entra
con Google, o se usa **Authentication → Users** en el panel para ponerla.

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

## Generación con IA

`/biblioteca/mazos/nuevo-ia` crea un mazo entero a partir de un concepto
escrito en una frase. Hay dos caminos y los dos terminan en la misma pantalla de
revisión.

### Camino 1: importar, sin clave ni cuenta

Copias un prompt a tu asistente —Claude, Gemini, ChatGPT, MiniMax, el que
tengas abierto— y pegas aquí el JSON que te devuelva.

Es el camino recomendado por defecto, y no por cortesía: **no necesita clave, ni
CORS, ni cuenta, ni cuesta nada.** Funciona con cualquier modelo que la persona
ya tenga, y las tarjetas nunca pasan por ningún servicio nuestro porque la
generación ocurre entera en la conversación que ya tenía abierta.

### Camino 2: generar aquí, con clave de OpenRouter

Si prefieres que el mazo se genere dentro de la aplicación, pones una clave de
OpenRouter en tu navegador y la petición sale de tu equipo directamente a
OpenRouter. La aplicación **no tiene claves propias** y no paga por las
peticiones: pagas tú, a tu cuenta y con tus límites.

La clave **no pasa por nuestra infraestructura**, así que no se puede ver ni
registrar. Eso no es una comodidad, es la consecuencia de publicar en GitHub Pages
sin servidor, y resulta ser la mejor garantía de privacidad disponible.

### Dónde se guarda la clave, y por qué no una cookie

En `localStorage`, y no es una decisión de gusto:

| Opción | Por qué no |
| --- | --- |
| Cookie `httpOnly` | El navegador no puede leerla, así que no puede usarla para firmar la petición; y sin servidor, tampoco hay nadie que la lea. No sirve para nada. |
| Cookie legible por JS | Idéntica a `localStorage` en seguridad, y además se envía sola en cada petición a nuestro dominio, que algún día podría existir. |
| `localStorage` | Lo que hay. Se borra con un botón y sobrevive a las recargas. |

Es el patrón *bring your own key*. Y quien prefiera no guardar nada, usa el modo
de importar y no deja ninguna clave en el navegador.

### Lo que `localStorage` no protege

Conviene decirlo sin rodeos: `localStorage` **no** es un almacén de secretos.
Cualquier JavaScript que corra en la página puede leer lo que hay dentro. La
protección real es de dos capas:

1. **Restringir la clave en OpenRouter**, por presupuesto y por sitio de
   referencia. Es lo único que sobrevive a que alguien la lea.
2. **Que no haya JavaScript de terceros ni XSS.** La aplicación no carga scripts
   de terceros y nunca interpreta con `innerHTML` nada que venga de un modelo. Y
   como defensa de fondo, `app/lib/csp.ts` monta una `connect-src` que solo deja
   salir a Supabase y a `openrouter.ai`: una clave robada por un XSS no tiene a
   dónde ir.

Verificado en el navegador: un `fetch` a un origen ajeno falla con `TypeError`, uno
a `https://openrouter.ai` pasa.

### Por qué solo OpenRouter

La llamada sale del navegador, así que el servicio tiene que responder con
cabeceras CORS. Se comprobó uno por uno, en el navegador y no en la documentación:

| Servicio | Desde el navegador | Comprobación |
| --- | --- | --- |
| `openrouter.ai` | Sí | Responde, incluido el catálogo de modelos |
| `api.anthropic.com` | Sí | Pide una cabecera especial, pero responde |
| `generativelanguage.googleapis.com` | Sí | Solo su endpoint nativo |
| `api.minimax.io` | **No** | `TypeError` en el navegador y `401` desde Node: no manda cabeceras CORS |
| `api.openai.com` | No fiable | Su preflight ha devuelto `403` y `404` |

Un `401` o un `400` en esas pruebas es buena señal: significa que el preflight
pasó y llegó al servidor. Un fallo de CORS nunca devuelve un estado HTTP.

Quedan tres que en teoría funcionan, pero cada uno obliga a mantener su propio
formato de petición y de respuesta, y ninguno cubre todos los modelos. OpenRouter
los cubre a todos con **un** formato, el de OpenAI, que ya es un estándar de facto:
una clave da acceso a GPT, Claude, Gemini y MiniMax. Por eso MiniMax no aparece
como opción propia, aunque se pueda usar desde dentro de la aplicación.

> **Ojo con las credenciales de Claude Code.** No son una clave de API: son
> credenciales de suscripción, pensadas para la terminal, y usarlas desde una web
> no está permitido. Y en realidad no hacen falta aquí, porque el modo de importar
> ya usa la IA que tengas abierta.

### El catálogo de modelos se pide al momento

`GET https://openrouter.ai/api/v1/models` es público —no necesita clave— y
devolvía 464 modelos. Se consulta al abrir la pantalla en vez de escribirlos en el
código, porque `google/gemini-3.8-flash` no existía hace poco y los que se
existían se van: una lista fija se queda vieja sin avisar.

El catálogo también dice qué modelos aceptan `response_format`, que es lo que
permite pedir JSON en limpio. A los que no, no se les manda ese campo, porque
OpenRouter responde `400` si se lo mandas a un modelo que no lo admite.

### Interpretar la respuesta

Un modelo al que se le pide JSON devuelve JSON *casi* siempre, pero lo envuelve en
un bloque de código, le pone prosa delante o llama `meaning` a `meaning_es`. Como
las dos vías de entrada pasan por el mismo lector, esa tolerancia se paga una vez:
`app/features/ai/draft.ts` acepta un array suelto, quita los bloques de código,
reconoce varios nombres por campo y **recorta los textos a los límites de la base
de datos** antes de insertar. Si un significado pasara de los 400 caracteres, el
`insert` fallaría entero y se perderían también las tarjetas que estaban bien.

Tarjeta sin término o sin traducción: se descarta y se sigue. Si al final no queda
ninguna, se explica en pantalla en vez de guardar un mazo vacío.

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
│   ├── ai/            # proveedores, claves en el navegador, prompt e interpretación
│   ├── decks/         # tarjetas de mazo, previsualización del slug
│   └── study/         # motor de estudio (puro) + sus pruebas
├── lib/               # clientes de Supabase, sesión, consultas, tipos, CSP, formato
├── routes/            # un módulo por ruta
├── root.tsx           # documento, navegación, CSP y estado de autenticación
└── routes.ts          # mapa de rutas
supabase/
├── migrations/        # esquema, RLS y funciones seguras
├── tests/             # pruebas pgTAP de permisos
└── seed.sql           # mazos oficiales
```

### Un aviso sobre `redirect()` y `navigate()`

`redirect()` existe para que lo capture el enrutador, y el enrutador solo lo
captura dentro de un `loader` o un `action`. Lanzarlo desde un manejador de
evento —un `onClick` o un `onSubmit`— no lo captura nadie: la página se queda
donde está y la `Response` asoma como error sin capturar en la consola.

Se comprobó en el navegador. El caso grave es cuando el guardado ya ocurrió, que
es lo que pasaba en `mazo-nuevo.tsx`: el mazo se insertaba, la pantalla se
quedaba como si nada, y pulsar «Crear» otra vez dejaba un duplicado en la
biblioteca. Ahora usa `navigate()`.

Como el sitio se publica sin servidor, casi todo el trabajo ocurre en manejadores
de evento y el patrón se copia de un archivo a otro con facilidad.
`app/lib/navigation.test.ts` lo vigila: busca `throw redirect(` fuera de un
`clientLoader` o `clientAction`, ignorando comentarios y cadenas.

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
