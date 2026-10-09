import type { Messages } from "../types";

/**
 * La barra, el pie y el acceso con Google.
 */
export const shell = {
  "common.loading": "Cargando…",
  "common.cancel": "Cancelar",
  "common.done": "Listo",
  "common.delete": "Eliminar",
  "common.deleting": "Eliminando…",
  "common.noSupabaseEnv":
    "Falta configurar Supabase en tus variables de entorno.",

  "theme.toDark": "Activar el modo noche",
  "theme.toLight": "Activar el modo luz",

  "error.title": "Algo salió mal",
  "error.message": "Ocurrió un error inesperado.",
  "error.notFoundTitle": "No encontramos esta página",
  "error.notFoundMessage":
    "Puede que la dirección esté mal escrita o que el contenido ya no esté disponible.",
  "error.backHome": "Volver al inicio",
  "error.shortTitle": "Error",

  "configNotice.title": "Falta configurar Supabase",
  "configNotice.body":
    "Frasevia necesita conexión a Supabase para leer mazos, guardar tu biblioteca y registrar tu progreso. Todavía no puede hacerlo.",
  "configNotice.lead": "Copia",
  "configNotice.middle":
    "a y completa VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY. Después reinicia el servidor de desarrollo.",
  "configNotice.note":
    "Mientras tanto puedes navegar la interfaz, pero nada se guarda.",

  "app.opening": "Abriendo Frasevia…",
  "app.navigating": "Navegando",
  "nav.primary": "Principal",
  "nav.explore": "Explorar",
  "nav.progress": "Mi progreso",
  "nav.library": "Mi biblioteca",
  "nav.reviewSettings": "Ajustes de repaso",
  "account.unconfigured": "Sin configurar",
  "account.signIn": "Iniciar sesión",
  "account.signUp": "Crear cuenta",
  "account.yourAccount": "Tu cuenta",
  "account.signOut": "Salir",
  "footer.tagline": "Frasevia. Aprende idiomas y recuerda lo que te importa.",
  "footer.exploreDecks": "Explorar mazos",

  "google.disabled":
    "El acceso con Google no está disponible por ahora. Puedes entrar con tu correo y contraseña.",
  "google.divider": "o",
  "google.opening": "Abriendo Google…",
  "google.privacy":
    "Google comparte solo tu correo y tu nombre. Frasevia no accede a tus correos ni a tus contactos.",
  "google.labelContinue": "Continuar con Google",
  "google.labelSignUp": "Registrarse con Google",
  "google.errorParseUrl":
    "No se pudo preparar el acceso con Google. Revisa VITE_SUPABASE_URL.",
  "google.errorNetwork":
    "No se pudo contactar con Supabase. Revisa tu conexión.",
} satisfies Messages;
