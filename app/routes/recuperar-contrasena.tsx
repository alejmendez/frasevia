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
import { t } from "~/lib/locale";
import { useT } from "~/lib/locale-context";
import { safeRedirectTo } from "~/lib/session";
import { getSupabaseBrowser } from "~/lib/supabase";

export function meta() {
  return [{ title: t("reset.metaTitle") }];
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
  const tr = useT();
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
      setInfo(t("reset.linkWorked"));
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
      setError(t("common.noSupabaseEnv"));
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
    setInfo(t("reset.emailSent"));
    setPending(false);
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t("signUp.passwordTooShort"));
      return;
    }

    setPending(true);
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError(t("common.noSupabaseEnv"));
      setPending(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setPending(false);
      return;
    }

    setInfo(t("reset.updated"));
    setPending(false);
  }

  return (
    <Page className="max-w-md">
      <h1 className="font-display text-3xl text-ink">
        {hasRecoverySession ? tr("reset.newTitle") : tr("reset.title")}
      </h1>
      <p className="mt-2 text-ink-soft">
        {hasRecoverySession ? tr("reset.newBody") : tr("reset.body")}
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
            label={tr("reset.fieldNewPassword")}
            htmlFor="password"
            required
            hint={tr("signUp.passwordHint")}
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
            {pending ? t("reset.saving") : tr("reset.savePassword")}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleRequest} className="mt-6 space-y-5">
          <Field label={tr("signIn.fieldEmail")} htmlFor="email" required>
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
            {pending ? t("reset.sending") : tr("reset.sendLink")}
          </Button>
        </form>
      )}

      <p className="mt-6 text-sm text-ink-soft">
        <Link
          to={`/iniciar-sesion?redirectTo=${encodeURIComponent(redirectTo)}`}
          className="text-brand hover:underline"
        >
          {tr("reset.backToSignIn")}
        </Link>
      </p>
    </Page>
  );
}
