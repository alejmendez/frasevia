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
import { t } from "~/lib/locale";
import { useT } from "~/lib/locale-context";
import { safeRedirectTo, stripBasePath } from "~/lib/session";
import { getSupabaseBrowser } from "~/lib/supabase";

export function meta() {
  return [{ title: t("signUp.metaTitle") }];
}

export default function CrearCuenta() {
  const [searchParams] = useSearchParams();
  const { status: authStatus } = useAuth();
  const navigate = useNavigate();
  const tr = useT();

  // `useHref("/")` devuelve la raíz ya con el prefijo del sitio. De ahí sale el
  // prefijo que hay que quitarle a `redirectTo`, porque `navigate` lo vuelve a
  // anteponer; y `useHref(redirectTo)` devuelve la ruta completa, que es la que
  // necesita el correo de confirmación, porque ese enlace lo abre el navegador.
  const basePath = useHref("/").replace(/\/$/, "");
  const redirectTo = stripBasePath(
    safeRedirectTo(searchParams.get("redirectTo")),
    basePath,
  );
  const redirectHref = useHref(redirectTo);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (authStatus === "unconfigured") {
    return <ConfigNotice />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);

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

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      // El enlace del correo lo abre el navegador, así que necesita la ruta
      // completa con el prefijo del sitio, no la ruta del enrutador.
      options: { emailRedirectTo: `${window.location.origin}${redirectHref}` },
    });

    if (signUpError) {
      setError(signUpError.message);
      setPending(false);
      return;
    }

    // Si el proyecto exige confirmar el correo, `session` viene vacío y hay que
    // avisar en vez de dar por hecho que la cuenta ya sirve.
    if (!data.session) {
      setInfo(t("signUp.checkEmail"));
      setPending(false);
      return;
    }

    forgetRedirect();
    navigate(redirectTo, { replace: true });
  }

  return (
    <Page className="max-w-md">
      <h1 className="font-display text-3xl text-ink">{tr("signUp.title")}</h1>
      <p className="mt-2 text-ink-soft">{tr("signUp.description")}</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {error ? <Alert variant="error">{error}</Alert> : null}
        {info ? <Alert variant="success">{info}</Alert> : null}

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

        <Field
          label={tr("signIn.fieldPassword")}
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
          {pending ? t("signUp.creating") : tr("signUp.submit")}
        </Button>
      </form>

      <GoogleSignIn redirectTo={redirectTo} label={tr("google.labelSignUp")} />

      <p className="mt-6 text-sm text-ink-soft">
        {tr("signUp.haveAccount")}{" "}
        <Link
          to={`/iniciar-sesion?redirectTo=${encodeURIComponent(redirectTo)}`}
          className="text-brand hover:underline"
        >
          {tr("signUp.signInLink")}
        </Link>
      </p>
    </Page>
  );
}
