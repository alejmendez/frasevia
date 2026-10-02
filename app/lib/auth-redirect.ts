import { internalPath } from "./session";

/**
 * Destino pendiente de un acceso con Google.
 *
 * Google se lleva a la persona fuera del sitio y la devuelve a la raíz del
 * dominio, que es la **única** dirección que GitHub Pages responde con un 200:
 * cualquier ruta profunda se sirve con `404.html` (ver `react-router.config.ts`).
 * Devolver a la raíz también evita tener que dar de alta en Supabase una
 * dirección distinta por cada ruta a la que se pueda querer llegar, porque
 * Google y Supabase solo aceptan destinos de su lista blanca.
 *
 * El precio de eso es que la vuelta no puede arrastrar la ruta pretendida en la
 * URL, así que se guarda aquí antes de saltar y se lee una sola vez al volver.
 *
 * Va en `localStorage` y no en `sessionStorage` porque el salto a Google puede
 * reabrir la vuelta en otra pestaña, según el navegador, y `sessionStorage` no
 * la comparte.
 */
export const PENDING_REDIRECT_KEY = "frasevia:destino-pendiente";

/**
 * La parte de `Storage` que hace falta aquí.
 *
 * Se declara como interfaz propia para poder probar el guardado con un doble en
 * memoria, sin tocar el almacenamiento real.
 */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * El `localStorage` del navegador, o `null` si no hay.
 *
 * Acceder a `localStorage` puede lanzar (modo privado de Safari, cookies de
 * sitios de terceros bloqueadas, políticas de almacenamiento de la empresa). El
 * acceso con Google sigue siendo válido sin destino guardado: la persona entra
 * y aterriza en la portada. Por eso la ausencia de almacenamiento no es un
 * error.
 */
export function browserStorage(): StorageLike | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** Guarda la ruta a la que ir después de entrar con Google. */
export function rememberRedirect(
  value: string,
  storage: StorageLike | null = browserStorage(),
): void {
  const path = internalPath(value);
  if (!path || !storage) {
    return;
  }

  try {
    storage.setItem(PENDING_REDIRECT_KEY, path);
  } catch {
    // Cuota llena o almacenamiento en modo solo lectura: se entra igual, solo
    // que la persona aterriza en la portada en lugar de donde quería.
  }
}

/**
 * Lee la ruta pendiente y la borra.
 *
 * Se borra al leerla para que un destino no se aplique dos veces: si la persona
 * entra y después navega por su cuenta, la siguiente autenticación no la
 * teletransporta a un sitio que ya no quería.
 *
 * El valor se vuelve a validar porque sale del almacenamiento del navegador, que
 * cualquiera puede editar, y acaba en un `navigate`.
 */
export function takeRedirect(
  storage: StorageLike | null = browserStorage(),
): string | null {
  if (!storage) {
    return null;
  }

  let stored: string | null = null;

  try {
    stored = storage.getItem(PENDING_REDIRECT_KEY);
    storage.removeItem(PENDING_REDIRECT_KEY);
  } catch {
    return null;
  }

  return internalPath(stored);
}

/** Descarta el destino pendiente. */
export function forgetRedirect(
  storage: StorageLike | null = browserStorage(),
): void {
  try {
    storage?.removeItem(PENDING_REDIRECT_KEY);
  } catch {
    // Si no se puede borrar, `takeRedirect` lo descarta igual en el peor caso.
  }
}

/**
 * Dirección absoluta a la que Google debe devolver a la persona.
 *
 * `homeHref` es lo que devuelve `useHref("/")`, es decir la raíz **con** el
 * prefijo del sitio: `/frasevia/` si se publica en una subcarpeta y `/` si vive
 * en la raíz del dominio. Esa es también la cadena exacta que hay que copiar en
 * las Redirect URLs de Supabase.
 */
export function buildOAuthReturnUrl(origin: string, homeHref: string): string {
  return new URL(homeHref, origin).toString();
}
