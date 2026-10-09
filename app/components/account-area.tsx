import { GearSixIcon } from "@phosphor-icons/react/dist/ssr";
import { Form, Link } from "react-router";

import { Button, ButtonLink, cx } from "~/components/ui";
import { useAuth } from "~/lib/auth-context";
import { useT } from "~/lib/locale-context";

/**
 * La zona de cuenta de la cabecera.
 *
 * Tiene cuatro formas y cada una es una pantalla distinta, así que están en su
 * propio archivo y no dentro de la cabecera: quien lee `SiteHeader` quiere ver la
 * barra de navegación, no las cuatro ramas de la sesión.
 *
 * - **Cargando**: un marcador de posición. El HTML del servidor y el del primer
 *   render del cliente coinciden, así que no hay salto ni error de hidratación.
 * - **Sin configurar**: un aviso. La aplicación funciona, pero no guarda nada, y
 *   decirlo aquí es más honesto que dejar que cada pantalla lo diga.
 * - **Sin sesión**: entrar y crear cuenta.
 * - **Con sesión**: los ajustes de repaso, el correo y salir.
 */
export function AccountArea() {
  const { status, user } = useAuth();

  switch (status) {
    case "loading":
      return <Placeholder />;
    case "unconfigured":
      return <Unconfigured />;
    case "anonymous":
      return <SignIn />;
    default:
      return <SignedIn email={user?.email ?? null} />;
  }
}

function Placeholder() {
  return (
    <span
      aria-hidden="true"
      className="block h-9 w-24 animate-pulse rounded-lg bg-paper-sunken"
    />
  );
}

function Unconfigured() {
  const t = useT();

  return (
    <span className="rounded-md border border-accent/30 bg-accent-muted px-2.5 py-1.5 text-xs font-medium text-accent">
      {t("account.unconfigured")}
    </span>
  );
}

function SignIn() {
  const t = useT();

  return (
    <>
      <ButtonLink to="/iniciar-sesion" variant="ghost">
        {t("account.signIn")}
      </ButtonLink>
      <ButtonLink to="/crear-cuenta">{t("account.signUp")}</ButtonLink>
    </>
  );
}

function SignedIn({ email }: { email: string | null }) {
  const t = useT();

  return (
    <>
      <Link
        to="/ajustes/repaso"
        aria-label={t("nav.reviewSettings")}
        title={t("nav.reviewSettings")}
        className={cx(
          "inline-flex size-10 items-center justify-center rounded-lg border border-line bg-paper-raised text-ink-soft transition-colors",
          "hover:bg-paper-sunken hover:text-brand",
        )}
      >
        <GearSixIcon aria-hidden size={19} />
      </Link>

      <span
        className="hidden max-w-40 truncate text-sm text-ink-soft sm:inline"
        title={email ?? undefined}
      >
        {email ?? t("account.yourAccount")}
      </span>

      {/* Cierre de sesión: un `fetcher.Form` para no recargar la página. */}
      <Form method="post" action="/salir">
        <Button type="submit" variant="secondary">
          {t("account.signOut")}
        </Button>
      </Form>
    </>
  );
}
