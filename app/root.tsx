import {
  Form,
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigation,
} from "react-router";
import { ThemeToggle } from "~/components/theme-toggle";
import { cx } from "~/components/ui";
import { AuthProvider, useAuth } from "~/lib/auth-context";
import { THEME_BOOTSTRAP } from "~/lib/theme";
import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    // Fraunces para los títulos: le da el aire de biblioteca que buscamos.
    href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    // El script de abajo añade `class="dark"` a `<html>` antes de que hidrate
    // React, así que el atributo se avisa para que la hidratación no proteste.
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* El color de la barra del navegador en móvil. Lo reescribe
            `app/lib/theme.ts` cada vez que cambia el tema. */}
        <meta name="theme-color" content="#faf7f1" />
        <Meta />
        <Links />
        {/* Antes que cualquier script de la aplicación: es lo único que puede
            dejar el tema puesto antes de que el navegador pinte el fondo.
            El contenido es una constante de `app/lib/theme.ts`, escrita en
            tiempo de compilación y sin datos de nadie, por eso el
            `dangerouslySetInnerHTML`. */}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: constante propia, sin entrada externa */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className="min-h-dvh">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
    </AuthProvider>
  );
}

const PUBLIC_LINKS = [
  { to: "/explorar", label: "Explorar" },
  { to: "/progreso", label: "Mi progreso" },
];

const PRIVATE_LINKS = [{ to: "/biblioteca", label: "Mi biblioteca" }];

function SiteHeader() {
  const { status, user } = useAuth();
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur">
      {/* La barra de progreso comunica que hay una navegación en curso. */}
      {isNavigating ? (
        <div
          role="progressbar"
          aria-label="Navegando"
          className="h-0.5 w-full animate-pulse bg-brand/60"
        />
      ) : null}

      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3.5 sm:px-8">
        <Link
          to="/"
          className="font-display text-lg font-semibold tracking-tight text-ink"
        >
          Frasevia
        </Link>

        <nav
          aria-label="Principal"
          className="order-3 w-full sm:order-2 sm:w-auto"
        >
          <ul className="flex flex-wrap items-center gap-1 text-sm">
            {[...PRIVATE_LINKS, ...PUBLIC_LINKS].map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    cx(
                      "rounded-md px-3 py-1.5 transition-colors",
                      isActive
                        ? "bg-brand-muted font-medium text-brand-strong"
                        : "text-ink-soft hover:bg-paper-sunken hover:text-ink",
                    )
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="order-2 ml-auto flex items-center gap-2 sm:order-3">
          <ThemeToggle />
          <AccountArea status={status} email={user?.email ?? null} />
        </div>
      </div>
    </header>
  );
}

/**
 * Zona de cuenta.
 *
 * Mientras se resuelve la sesión se reserva el espacio con un marcador de
 * posición: el HTML del servidor y el del primer render del cliente coinciden,
 * así que no hay salto ni error de hidratación.
 */
function AccountArea({
  status,
  email,
}: {
  status: ReturnType<typeof useAuth>["status"];
  email: string | null;
}) {
  if (status === "loading") {
    return (
      <span
        aria-hidden="true"
        className="block h-9 w-24 animate-pulse rounded-lg bg-paper-sunken"
      />
    );
  }

  if (status === "unconfigured") {
    return (
      <span className="rounded-md border border-accent/30 bg-accent-muted px-2.5 py-1.5 text-xs font-medium text-accent">
        Sin configurar
      </span>
    );
  }

  if (status === "anonymous") {
    return (
      <>
        <Link
          to="/iniciar-sesion"
          className="rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-paper-sunken hover:text-ink"
        >
          Iniciar sesión
        </Link>
        <Link
          to="/crear-cuenta"
          className="rounded-lg bg-brand-solid px-3.5 py-2 text-sm font-medium text-on-solid hover:bg-brand-solid-hover"
        >
          Crear cuenta
        </Link>
      </>
    );
  }

  return (
    <>
      <span
        className="hidden max-w-40 truncate text-sm text-ink-soft sm:inline"
        title={email ?? undefined}
      >
        {email ?? "Tu cuenta"}
      </span>
      {/* Cierre de sesión: un `fetcher.Form` para no recargar la página. */}
      <Form method="post" action="/salir">
        <button
          type="submit"
          className="rounded-lg border border-line-strong bg-paper-raised px-3 py-2 text-sm text-ink hover:bg-paper-sunken"
        >
          Salir
        </button>
      </Form>
    </>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-8 text-sm text-ink-faint sm:px-8">
        <p>Frasevia — aprende inglés con frases que alguien dijo de verdad.</p>
        <Link to="/explorar" className="hover:text-ink">
          Explorar mazos
        </Link>
      </div>
    </footer>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let title = "Algo salió mal";
  let message = "Ocurrió un error inesperado.";
  let status: number | undefined;

  if (isRouteErrorResponse(error)) {
    status = error.status;
    title = error.status === 404 ? "No encontramos esta página" : "Error";
    message =
      error.status === 404
        ? "Puede que la dirección esté mal escrita o que el contenido ya no esté disponible."
        : error.statusText || message;
  } else if (import.meta.env.DEV && error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-24 text-center sm:px-8">
      {status ? (
        <p className="font-display text-6xl text-brand">{status}</p>
      ) : null}
      <h1 className="mt-4 font-display text-3xl text-ink">{title}</h1>
      <p className="mt-3 text-ink-soft">{message}</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link
          to="/"
          className="rounded-lg bg-brand-solid px-4 py-2.5 text-sm font-medium text-on-solid hover:bg-brand-solid-hover"
        >
          Volver al inicio
        </Link>
        <Link
          to="/explorar"
          className="rounded-lg border border-line-strong bg-paper-raised px-4 py-2.5 text-sm text-ink hover:bg-paper-sunken"
        >
          Explorar mazos
        </Link>
      </div>
    </div>
  );
}
