/**
 * Lectura y validación de la configuración de Supabase.
 *
 * La aplicación debe arrancar aunque falten las credenciales: en ese caso
 * muestra un aviso claro en vez de fallar en silencio o simular que guardó datos.
 */

export interface SupabaseConfig {
  url: string;
  publishableKey: string;
}

function readEnv(...names: string[]): string {
  for (const name of names) {
    const value = import.meta.env[name];
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }
  return "";
}

/**
 * Devuelve la configuración de Supabase o `null` si falta alguna variable.
 *
 * Solo se lee la clave publicable. Nunca se usa ni se espera una `service_role`
 * en el frontend: el acceso a datos está regulado por RLS en la base de datos.
 */
export function getSupabaseConfig(): SupabaseConfig | null {
  const url = readEnv("VITE_SUPABASE_URL");
  // `VITE_SUPABASE_ANON_KEY` es el nombre histórico; se acepta por compatibilidad
  // con proyectos creados antes de que Supabase renombrara la clave.
  const publishableKey = readEnv(
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    "VITE_SUPABASE_ANON_KEY",
  );

  if (!url || !publishableKey) {
    return null;
  }

  return { url, publishableKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}
