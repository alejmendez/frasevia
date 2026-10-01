import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
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
  return [{ title: "Crear una cuenta — Frasevia" }];
}

export default function CrearCuenta() {
  const [searchParams] = useSearchParams();
  const { status: authStatus } = useAuth();
  const navigate = useNavigate();
  const redirectTo = safeRedirectTo(searchParams.get("redirectTo"));

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

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}${redirectTo}` },
    });

    if (signUpError) {
      setError(signUpError.message);
      setPending(false);
      return;
    }

    // Si el proyecto exige confirmar el correo, `session` viene vacío y hay que
    // avisar en vez de dar por hecho que la cuenta ya sirve.
    if (!data.session) {
      setInfo(
        "Revisa tu correo: te enviamos un enlace para confirmar la cuenta. " +
          "Cuando lo abras podrás entrar.",
      );
      setPending(false);
      return;
    }

    navigate(redirectTo, { replace: true });
  }

  return (
    <Page className="max-w-md">
      <h1 className="font-display text-3xl text-ink">Crear una cuenta</h1>
      <p className="mt-2 text-ink-soft">
        Tu cuenta guarda la biblioteca, el progreso de cada tarjeta y las copias
        de los mazos que copies.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {error ? <Alert variant="error">{error}</Alert> : null}
        {info ? <Alert variant="success">{info}</Alert> : null}

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

        <Field
          label="Contraseña"
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
          {pending ? "Creando la cuenta…" : "Crear la cuenta"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink-soft">
        ¿Ya tienes cuenta?{" "}
        <Link
          to={`/iniciar-sesion?redirectTo=${encodeURIComponent(redirectTo)}`}
          className="text-brand hover:underline"
        >
          Inicia sesión
        </Link>
      </p>
    </Page>
  );
}
