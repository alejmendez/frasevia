import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseBrowser, waitForSession } from "./supabase";

/**
 * Resultado de intentar abrir una ruta privada.
 *
 * La sesión de Supabase vive en el navegador, así que la protección se resuelve
 * en `clientLoader` y no en el servidor. El servidor solo renderiza el estado de
 * carga; después el cliente decide.
 */
export type SessionResult =
  | { status: "ready"; supabase: SupabaseClient; userId: string }
  | { status: "unconfigured" }
  | { status: "anonymous" };

export async function getSession(): Promise<SessionResult> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return { status: "unconfigured" };
  }

  const session = await waitForSession(supabase);
  if (!session) {
    return { status: "anonymous" };
  }

  return {
    status: "ready",
    supabase,
    userId: session.user.id,
  };
}

/** Ruta de inicio de sesión con la página original como destino. */
export function loginPath(request: Request): string {
  const url = new URL(request.url);
  const target = `${url.pathname}${url.search}`;
  return `/iniciar-sesion?redirectTo=${encodeURIComponent(target)}`;
}

/**
 * Dice si un valor es una ruta interna de la aplicación.
 *
 * Es la comprobación que evita un *open redirect*: si se acepta un destino
 * externo, un enlace de acceso legítimo se convierte en una trampilla para
 * mandar a la persona a `https://ejemplo.com`. Aquí vive sola, sin destino por
 * defecto, para que la usen tanto `safeRedirectTo` como el acceso con Google,
 * que también acaba en un `navigate`.
 */
export function internalPath(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  if (!value.startsWith("/")) {
    return null;
  }

  // "//evil.com" es un protocolo-relativo: el navegador lo trataría como
  // una URL externa, así que se descarta.
  if (value.startsWith("//") || value.startsWith("/\\")) {
    return null;
  }

  return value;
}

/**
 * Recorta un `redirectTo` que viene de la URL.
 *
 * Solo se aceptan rutas internas (ver `internalPath`); lo que no lo es se cambia
 * por el destino de siempre.
 */
export function safeRedirectTo(
  value: string | null | undefined,
  fallback = "/biblioteca",
): string {
  return internalPath(value) ?? fallback;
}

/**
 * Quita el prefijo con el que se publica el sitio de una ruta.
 *
 * `safeRedirectTo` devuelve la ruta tal como venía en la URL, y en un sitio
 * publicado en una subcarpeta eso incluye el prefijo: `loginPath` construye el
 * `redirectTo` con `url.pathname`, que lo lleva. Pero `navigate()` y `Link` lo
 * vuelven a anteponer, así que hay que quitarlo o la persona acabaría en
 * `/frasevia/frasevia/biblioteca`.
 *
 * Solo quita una ocurrencia y solo si coincide con el prefijo completo, de modo
 * que una ruta que empiece por texto parecido (`/fraseviafoo`) no se toca. El
 * resultado sigue empezando por `/`, porque `safeRedirectTo` ya lo garantiza.
 */
export function stripBasePath(value: string, basePath: string): string {
  if (!basePath) {
    return value;
  }

  if (value === basePath) {
    return "/";
  }

  if (value.startsWith(`${basePath}/`)) {
    return value.slice(basePath.length);
  }

  return value;
}
