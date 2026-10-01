import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  Alert,
  Button,
  ConfigNotice,
  Field,
  inputClass,
  Page,
} from "~/components/ui";
import { useAuth } from "~/lib/auth-context";
import { safeRedirectTo } from "~/lib/session";
import { getSupabaseBrowser } from "~/lib/supabase";

export function meta() {
  return [{ title: "Recuperar contraseña — Frasevia" }];
}

/**
 * Recuperación de contraseña en dos momentos.
 *
 * 1. Sin sesión: se pide el correo y Supabase manda un enlace.
 * 2. Con sesión (el enlace ya se canjeó en la URL): se permite poner una
 *    contraseña nueva.
 */
export default function RecuperarContrasena() {
  const [searchParams] = useSearchParams();
  const { status: authStatus } = useAuth();
  const redirectTo = safeRedirectTo(
    searchParams.get("redirectTo"),
    "/iniciar-sesion",
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Tras el enlace de recuperación, el cliente procesa los tokens de la URL y
  // queda una sesión temporal: hay que avisar a quien está mirando la pantalla.
  useEffect(() => {
    if (authStatus === "authenticated") {
      setInfo(
        "Listo, el enlace funcionó. Escribe una contraseña nueva para tu cuenta.",
      );
    }
  }, [authStatus]);

  if (authStatus === "unconfigured") {
    return <ConfigNotice />;
  }

  const hasRecoverySession = authStatus === "authenticated";

  async function handleRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setPending(true);

    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError("Falta configurar Supabase en tus variables de entorno.");
      setPending(false);
      return;
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/recuperar-contrasena` },
    );

    if (resetError) {
      setError(resetError.message);
      setPending(false);
      return;
    }

    // Mensaje idéntico exista o no el correo: no se revela qué cuentas existen.
    setInfo(
      "Si ese correo tiene una cuenta, te enviamos un enlace para cambiar la contraseña.",
    );
    setPending(false);
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña necesita al menos 8 caracteres.");
      return;
    }

    setPending(true);
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError("Falta configurar Supabase en tus variables de entorno.");
      setPending(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setPending(false);
      return;
    }

    setInfo("Contraseña actualizada. Ya puedes iniciar sesión.");
    setPending(false);
  }

  return (
    <Page className="max-w-md">
      <h1 className="font-display text-3xl text-ink">
        {hasRecoverySession
          ? "Elige una contraseña nueva"
          : "Recuperar contraseña"}
      </h1>
      <p className="mt-2 text-ink-soft">
        {hasRecoverySession
          ? "Estás usando el enlace que te enviamos por correo."
          : "Escribe tu correo y te enviamos un enlace para cambiar la contraseña."}
      </p>

      {error ? (
        <div className="mt-6">
          <Alert variant="error">{error}</Alert>
        </div>
      ) : null}
      {info ? (
        <div className="mt-6">
          <Alert variant="success">{info}</Alert>
        </div>
      ) : null}

      {hasRecoverySession ? (
        <form onSubmit={handleUpdate} className="mt-6 space-y-5">
          <Field
            label="Contraseña nueva"
            htmlFor="password"
            required
            hint="Mínimo 8 caracteres."
          >
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClass}
            />
          </Field>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Guardando…" : "Guardar contraseña"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleRequest} className="mt-6 space-y-5">
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
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Enviando…" : "Enviar enlace"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-sm text-ink-soft">
        <Link
          to={`/iniciar-sesion?redirectTo=${encodeURIComponent(redirectTo)}`}
          className="text-brand hover:underline"
        >
          Volver a iniciar sesión
        </Link>
      </p>
    </Page>
  );
}
