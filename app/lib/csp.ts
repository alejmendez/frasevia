/**
 * Content Security Policy de la aplicación.
 *
 * ## Por qué hace falta ahora
 *
 * Las claves de IA viven en `localStorage`, que no es un almacén de secretos:
 * cualquier JavaScript que corra en la página puede leerlas. La forma de que eso
 * no importa en la práctica es que no haya JavaScript ajeno al que escribimos
 * nosotros, y de que ese JavaScript no pueda enviar la clave a un atacante. La
 * aplicación no carga scripts de terceros, pero la segunda mitad necesita
 * ayuda: sin una CSP, un XSS puede mandar la clave a `https://atacante.example`
 * sin que se note.
 *
 * `connect-src` es la directiva que lo cierra: solo se puede hablar con
 * Supabase y con los tres proveedores de IA. Una clave robada por un XSS ya no
 * tiene a dónde ir.
 *
 * ## Límites de declararla en un `<meta>`
 *
 * Va aquí y no en una cabecera HTTP porque la aplicación se publica en GitHub
 * Pages como archivos estáticos, y eso no permite añadir cabeceras. En un
 * `<meta>` se **ignoran** `frame-ancestors` y `report-uri`, así que quedan sin
 * efecto: el Sandbox del navegador sigue siendo la defensa contra que alguien
 * incruste la página en un iframe. El resto de las directivas sí se aplican.
 */

/**
 * Origenes de IA a los que la aplicación puede hablar.
 *
 * Solo OpenRouter: es el único proveedor que quedó, y su catálogo y su API
 * comparten origen. Se declara explícitamente en vez de confiar en
 * `connect-src 'self'`, porque lo que se busca es justo que la lista sea corta y
 * legible.
 */
export const AI_ORIGINS = ["https://openrouter.ai"] as const;

/**
 * Se declara aparte de `default-src 'self'` porque el proyecto de Supabase
 * cambia de URL según el entorno, y una CSP con un origen equivocado deja la
 * aplicación sin poder leer ni escribir datos.
 */
function supabaseOrigin(url: string | undefined): string {
  if (!url) {
    return "";
  }

  try {
    return new URL(url).origin;
  } catch {
    // Una URL mal formada no debe tumbar la aplicación al arrancar: sin este
    // origen la CSP solo bloquea las peticiones a Supabase, que es preferible
    // a dejar la página en blanco.
    return "";
  }
}

/**
 * Monta la cabecera.
 *
 * `script-src` lleva `'unsafe-inline'` porque el script que pone el tema antes
 * de hidratar es en línea, y en desarrollo Vite inyecta más. Cuesta algo de
 * protección frente a XSS; la parte que de verdad importa aquí, que es
 * `connect-src`, no se ve afectada. Quitarlo exigiría pasar ese script a un
 * hash o a un archivo, y está fuera de lo que hace falta para esta función.
 */
export function buildCsp(supabaseUrl: string | undefined): string {
  const connect = ["'self'", ...AI_ORIGINS];
  const origin = supabaseOrigin(supabaseUrl);
  if (origin !== "") {
    connect.push(origin);
  }

  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    // Tailwind y los estilos en línea de React necesitan esto.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob:",
    `connect-src ${connect.join(" ")}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}
