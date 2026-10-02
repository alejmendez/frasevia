import { buildOAuthReturnUrl, rememberRedirect } from "./auth-redirect";
import { getSupabaseConfig } from "./env";
import { type MessageKey, t } from "./locale";
import { getSupabaseBrowser } from "./supabase";

/**
 * Acceso con Google.
 *
 * Supabase se encarga del diálogo OAuth: `signInWithOAuth` devuelve la URL de
 * Google y el propio cliente se redirige allí. Al volver, el código de
 * autorización llega en la URL y lo canjea por una sesión el mismo cliente,
 * porque `supabase.ts` activa `detectSessionInUrl`. Aquí no hay ni `action` ni
 * ruta de callback que mantener, que es lo que hace posible que funcione en un
 * sitio estático sin servidor.
 *
 * Lo único que hay que tener cuidado es a qué dirección se vuelve, y de eso se
 * encarga `auth-redirect.ts`.
 */
const PROVIDER = "google";

export type GoogleAccessResult = { ok: true } | { ok: false; message: string };

/**
 * Mensajes de error de Supabase traducidos.
 *
 * Lo habitual no es que salte ninguno: si el proveedor está bien configurado,
 * Google es quien devuelve el fallo a la vuelta y lo trata `root.tsx`. Estos
 * cubren los fallos que se ven sin llegar a salir del sitio.
 *
 * La clave es el mensaje crudo de Supabase y el valor una clave de traducción:
 * el idioma se decide al pintar el error, no al construirlo.
 */
const FRIENDLY_ERRORS: Record<string, MessageKey> = {
  "Invalid request: unable to parse URL": "google.errorParseUrl",
  "fetch failed": "google.errorNetwork",
  NetworkError: "google.errorNetwork",
};

/**
 * Empieza el acceso con Google.
 *
 * Guarda antes el destino, porque en cuanto la redirección ocurre esta pantalla
 * desaparece y `result` solo llega si algo falló: si se guardara después,
 * nunca se llegaría a guardar.
 */
export async function startGoogleAccess(options: {
  /** Ruta interna a la que ir después de entrar, sin el prefijo del sitio. */
  redirectTo: string;
  /** Raíz con el prefijo, tal como la devuelve `useHref("/")`. */
  homeHref: string;
}): Promise<GoogleAccessResult> {
  const supabase = getSupabaseBrowser();

  rememberRedirect(options.redirectTo);

  if (!supabase) {
    return {
      ok: false,
      message: t("common.noSupabaseEnv"),
    };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: PROVIDER,
    options: {
      redirectTo: buildOAuthReturnUrl(
        globalThis.location?.origin ?? "",
        options.homeHref,
      ),
    },
  });

  if (error) {
    const friendly = FRIENDLY_ERRORS[error.message];
    return {
      ok: false,
      // Un mensaje de Supabase que no está en la tabla se devuelve tal cual: es
      // texto de terceros y traducirlo a mano sería inventarse lo que dice.
      message: friendly ? t(friendly) : error.message,
    };
  }

  // `ok: true` no llega a pintarse: el navegador ya está yendo a Google.
  return { ok: true };
}

/**
 * Si el proyecto de Supabase tiene el proveedor de Google encendido.
 *
 * Existe por un motivo concreto: **no se puede saber si el acceso funciona sin
 * intentarlo**, porque `signInWithOAuth` no consulta nada, solo lanza al
 * navegador a `/auth/v1/authorize`. Si el proveedor está apagado, ese endpoint
 * contesta `400 {"msg":"Unsupported provider: provider is not enabled"}` y la
 * persona aterriza en una página de JSON crudo en el dominio de Supabase, sin
 * vuelta atrás ni explicación. Preguntando antes a `/auth/v1/settings`, que es
 * público y enumera los proveedores, se evita eso.
 *
 * Se consulta en vivo a propósito: al encender el proveedor en el panel de
 * Supabase, el botón aparece solo, sin compilar ni republicar nada.
 */
export type GoogleAvailability = "enabled" | "disabled" | "unknown";

export async function googleAvailability(): Promise<GoogleAvailability> {
  const config = getSupabaseConfig();
  if (!config) {
    return "unknown";
  }

  try {
    const response = await fetch(`${config.url}/auth/v1/settings`, {
      headers: { apikey: config.publishableKey },
    });

    if (!response.ok) {
      return "unknown";
    }

    return readGoogleAvailability(await response.json());
  } catch {
    return "unknown";
  }
}

/**
 * Lee el veredicto de la respuesta de `/auth/v1/settings`.
 *
 * Se separa de la petición para poder probarla sin red. Se distinguen tres
 * casos y no dos: si la respuesta llega con otra forma de la que se espera, lo
 * honesto es no saber, y "no saber" tiene que jugar a favor de la persona
 * (se le ofrece el botón) y no en su contra.
 */
export function readGoogleAvailability(payload: unknown): GoogleAvailability {
  if (typeof payload !== "object" || payload === null) {
    return "unknown";
  }

  const google = (payload as { external?: { google?: unknown } }).external
    ?.google;

  if (google === true) {
    return "enabled";
  }

  if (google === false) {
    return "disabled";
  }

  return "unknown";
}
