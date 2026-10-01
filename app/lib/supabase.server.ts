import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseConfig } from "./env";

/**
 * Cliente de Supabase para el servidor (loaders).
 *
 * Solo se usa para leer contenido público, y con la clave publicable: las
 * políticas RLS permiten leer mazos públicos y oficiales sin iniciar sesión, y
 * ocultan todo lo demás. La sesión del usuario vive en el navegador, así que
 * este cliente nunca la necesita.
 *
 * El nombre `.server` marca el módulo como exclusivo del servidor: los
 * `loader` se eliminan del bundle del navegador, así que este código nunca se
 * envía al cliente.
 */
let serverClient: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config) {
    return null;
  }

  if (!serverClient) {
    serverClient = createClient(config.url, config.publishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return serverClient;
}

/** Error legible para la interfaz cuando Supabase no está configurado. */
export const SUPABASE_NOT_CONFIGURED =
  "Falta configurar Supabase. Copia .env.example a .env y completa " +
  "VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY.";
