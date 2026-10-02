import { useState } from "react";
import { Link, useHref, useNavigate, useSearchParams } from "react-router";
import { GoogleSignIn } from "~/components/google-sign-in";
import {
  Alert,
  Button,
  ConfigNotice,
  Field,
  inputClass,
  Page,
} from "~/components/ui";
import { useAuth } from "~/lib/auth-context";
import { forgetRedirect } from "~/lib/auth-redirect";
import { safeRedirectTo, stripBasePath } from "~/lib/session";
import { getSupabaseBrowser } from "~/lib/supabase";

export function meta() {
  return [{ title: "Iniciar sesión — Frasevia" }];
}

/**
 * Inicio de sesión.
 *
 * Supabase mantiene la sesión en el navegador, así que no hay `action` de
 * servidor: el formulario se procesa en el evento de envío y luego se navega.
 * `redirectTo` se valida en `safeRedirectTo` para no convertir este formulario
 * en un redirector abierto.
 */
export default function IniciarSesion() {
  const [searchParams] = useSearchParams();
  const { status: authStatus } = useAuth();
  const navigate = useNavigate();

  // `useHref("/")` devuelve la raíz ya con el prefijo del sitio (`/frasevia/`
  // si se publica en una subcarpeta, `/` si va a la raíz del dominio). De ahí se
  // saca el prefijo para quitarle a `redirectTo` lo que `navigate` va a volver a
  // anteponer.
  const basePath = useHref("/").replace(/\/$/, "");
  const redirectTo = stripBasePath(
    safeRedirectTo(searchParams.get("redirectTo")),
    basePath,
  );

  // `root.tsx` manda aquí cuando Google devuelve a la persona sin dejarla
  // entrar: canceló el consentimiento, o el proveedor no está habilitado.
  const oauthFailed = searchParams.get("error") === "oauth";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (authStatus === "unconfigured") {
    return <ConfigNotice />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError("Falta configurar Supabase en tus variables de entorno.");
      setPending(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      // No se distingue entre correo inexistente y contraseña incorrecta a
      // propósito: no revelamos qué correos están registrados.
      setError(
        signInError.message === "Invalid login credentials"
          ? "El correo o la contraseña no son correctos."
          : signInError.message,
      );
      setPending(false);
      return;
    }

    // La sesión ya quedó guardada; se vuelve a la ruta que la persona quería.
    // El destino pendiente de Google se descarta: aquí ya se sabe a dónde ir, y
    // dejarlo puesto haría que la próxima entrada saltase a un sitio viejo.
    forgetRedirect();
    navigate(redirectTo, { replace: true });
  }

  return (
    <Page className="max-w-md">
      <h1 className="font-display text-3xl text-ink">Iniciar sesión</h1>
      <p className="mt-2 text-ink-soft">
        Entra para practicar, guardar tu biblioteca y copiar mazos.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {oauthFailed ? (
          <Alert variant="warning" title="No se completó el acceso con Google">
            <p>
              Puede que se haya cancelado el permiso, o que el acceso con Google
              no esté habilitado en el proyecto. Inténtalo otra vez o entra con
              tu correo y contraseña.
            </p>
          </Alert>
        ) : null}
        {error ? <Alert variant="error">{error}</Alert> : null}

        <Field label="Correo electrónico" htmlFor="email" required>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Contraseña" htmlFor="password" required>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
          />
        </Field>

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Entrando…" : "Iniciar sesión"}
        </Button>
      </form>

      <GoogleSignIn redirectTo={redirectTo} label="Continuar con Google" />

      <div className="mt-6 space-y-2 text-sm">
        <p>
          <Link
            to={`/recuperar-contrasena?redirectTo=${encodeURIComponent(redirectTo)}`}
            className="text-brand hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
        <p className="text-ink-soft">
          ¿Todavía no tienes cuenta?{" "}
          <Link
            to={`/crear-cuenta?redirectTo=${encodeURIComponent(redirectTo)}`}
            className="text-brand hover:underline"
          >
            Crear una
          </Link>
        </p>
      </div>
    </Page>
  );
}
