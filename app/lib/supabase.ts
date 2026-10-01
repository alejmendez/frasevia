import {
  createClient,
  type Session,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";

import { getSupabaseConfig } from "./env";

/**
 * Cliente de Supabase para el navegador.
 *
 * Mantiene la sesión en `localStorage` y refresca el token solo. Es el único
 * lugar donde se crea una sesión autenticada: las rutas privadas lo consultan
 * desde un `clientLoader`.
 */
let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(config.url, config.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Necesario para el enlace de recuperación de contraseña: Supabase
        // vuelve con los tokens en la URL y el cliente los canjea por una
        // sesión.
        detectSessionInUrl: true,
      },
    });
  }

  return browserClient;
}

/**
 * Espera a que Supabase tenga una sesión válida.
 *
 * `getSession()` puede devolver `null` en el primer render porque todavía no leyó
 * `localStorage`; se espera al evento inicial para no expulsar a nadie por error.
 */
export function waitForSession(
  client: SupabaseClient,
): Promise<Session | null> {
  return new Promise((resolve) => {
    let settled = false;

    const finish = (session: Session | null) => {
      if (!settled) {
        settled = true;
        resolve(session);
      }
    };

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      subscription.unsubscribe();
      finish(session);
    });

    client.auth.getSession().then(({ data }) => finish(data.session));
  });
}

export function describeUser(user: User): { id: string; email: string | null } {
  return { id: user.id, email: user.email ?? null };
}
