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
 * Recorta un `redirectTo` que viene de la URL.
 *
 * Solo se aceptan rutas internas: si no, la aplicación mandaría a la persona
 * fuera del sitio (open redirect) a través de un enlace de acceso legítimo.
 */
export function safeRedirectTo(
  value: string | null | undefined,
  fallback = "/biblioteca",
): string {
  if (!value) {
    return fallback;
  }

  if (!value.startsWith("/")) {
    return fallback;
  }

  // "//evil.com" es un protocolo-relativo: el navegador lo trataría como
  // una URL externa, así que se descarta.
  if (value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }

  return value;
}
