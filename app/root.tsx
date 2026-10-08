import { GearSixIcon } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useRef, useState } from "react";
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
  useHref,
  useLocation,
  useNavigate,
  useNavigation,
} from "react-router";
import { LanguageSwitcher } from "~/components/language-switcher";
import { NavigationSkeleton } from "~/components/navigation-skeleton";
import { ThemeToggle } from "~/components/theme-toggle";
import { cx, LoadingState } from "~/components/ui";
import { AuthProvider, useAuth } from "~/lib/auth-context";
import { takeRedirect } from "~/lib/auth-redirect";
import { buildCsp } from "~/lib/csp";
import { LOCALE_BOOTSTRAP, t } from "~/lib/locale";
import { LocaleProvider, useT } from "~/lib/locale-context";
import { THEME_BOOTSTRAP } from "~/lib/theme";
import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "manifest", href: "./manifest.webmanifest" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    // Fraunces para los títulos y Caveat para las expresiones de las fichas.
    href: "https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap",
  },
];

/**
 * CSP de la aplicación, calculada al compilar.
 *
 * Va en un `<meta>` porque GitHub Pages no deja añadir cabeceras. Su motivo
 * concreto son las claves de IA: viven en `localStorage`, así que el riesgo de
 * que un XSS las envíe a otro sitio es real, y `connect-src` es lo que impide
 * que ese envío tenga éxito. Ver `app/lib/csp.ts` para lo que sí y lo que no
 * resuelve.
 */
const CSP = buildCsp(import.meta.env.VITE_SUPABASE_URL);

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
        <meta name="theme-color" content="#f7f2e7" />
        <Meta />
        <Links />
        <meta httpEquiv="Content-Security-Policy" content={CSP} />
        {/* Antes que cualquier script de la aplicación: es lo único que puede
            dejar el tema puesto antes de que el navegador pinte el fondo.
            El contenido es una constante de `app/lib/theme.ts`, escrita en
            tiempo de compilación y sin datos de nadie, por eso el
            `dangerouslySetInnerHTML`. */}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: constante propia, sin entrada externa */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
        {/* El idioma va aparte porque no prepara nada visible: solo deja `lang`
            en su sitio para que un lector de pantalla use la fonética
            correcta desde el primer momento. El texto lo traduce
            `app/lib/locale-context.tsx` al hidratar. */}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: constante propia, sin entrada externa */}
        <script dangerouslySetInnerHTML={{ __html: LOCALE_BOOTSTRAP }} />
      </head>
      <body className="min-h-dvh">
        {/* El proveedor vive aquí y no en `App` para que también envuelva al
            `ErrorBoundary` de la raíz: cuando una ruta revienta, el enrutador
            sustituye `App` por ese componente y, con el idioma por debajo, la
            pantalla de error saldría siempre en español. */}
        <LocaleProvider>{children}</LocaleProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GoogleReturn />
      <div className="flex min-h-dvh flex-col">
        <SiteHeader />
        <PendingMain />
        <SiteFooter />
      </div>
    </AuthProvider>
  );
}

/** Muestra el destino pendiente si una navegación tarda más que un instante. */
function PendingMain() {
  const navigation = useNavigation();
  const location = useLocation();
  const homeHref = useHref("/").replace(/\/$/, "");
  const tr = useT();
  const contentRef = useRef<HTMLDivElement>(null);
  const lastScreen = useRef({
    pathname: location.pathname,
    wasSkeleton: false,
  });
  const [skeletonPath, setSkeletonPath] = useState<string | null>(null);
  const isLoading = navigation.state === "loading";
  const pendingPath =
    navigation.location?.pathname.slice(homeHref.length) || "/";
  const isChangingPage =
    Boolean(navigation.location) && pendingPath !== location.pathname;
  const showSkeleton =
    isLoading && isChangingPage && skeletonPath === pendingPath;

  useEffect(() => {
    setSkeletonPath(null);
    // Los filtros y los envíos en la misma pantalla conservan su contenido.
    if (!isLoading || !isChangingPage) {
      return;
    }

    const timeout = window.setTimeout(() => setSkeletonPath(pendingPath), 140);
    return () => window.clearTimeout(timeout);
  }, [isLoading, isChangingPage, pendingPath]);

  useEffect(() => {
    const changed =
      lastScreen.current.pathname !== location.pathname ||
      lastScreen.current.wasSkeleton;
    lastScreen.current = {
      pathname: location.pathname,
      wasSkeleton: showSkeleton,
    };
    const content = contentRef.current;
    if (
      !changed ||
      showSkeleton ||
      !content?.animate ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    // Anima el contenido sin remontar Outlet ni retrasar su aparición.
    const animation = content.animate(
      [
        { opacity: 0.55, transform: "translateY(4px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 160, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" },
    );
    return () => animation.cancel();
  }, [location.pathname, showSkeleton]);

  return (
    <main className="flex-1" aria-busy={isLoading}>
      <div ref={contentRef} hidden={showSkeleton}>
        <Outlet />
      </div>
      {showSkeleton ? (
        <NavigationSkeleton
          label={tr("app.navigating")}
          pathname={pendingPath}
          search={navigation.location?.search}
        />
      ) : null}
    </main>
  );
}

/**
 * Recoge a la persona que vuelve de Google.
 *
 * Google la deja en la raíz del sitio, que es la única dirección que GitHub
 * Pages responde con un 200, así que la ruta que quería abrir no puede venir en
 * la URL. Se guardó antes de saltar (`app/lib/auth-redirect.ts`) y aquí se
 * recupera, una vez que se sabe que ya hay sesión: ir antes lanzaría a una ruta
 * privada antes de tiempo y su `clientLoader` la devolvería al acceso, en un
 * bucle.
 *
 * También recoge el otro final, que es volver sin haber entrado porque la
 * persona canceló el consentimiento o porque el proveedor no está habilitado.
 * Eso no se puede distinguir de una visita normal mientras no haya sesión, así
 * que se envía a la pantalla de acceso, que lo explica, en lugar de dejar a la
 * persona en la portada sin saber qué pasó.
 */
function GoogleReturn() {
  const { status } = useAuth();
  const navigate = useNavigate();

  // Se lee durante el primer render, antes de que ningún efecto pueda tocar la
  // URL: el cliente de Supabase limpia los parámetros de autorización del
  // historial en cuanto canjea el código, y para entonces este valor ya tiene
  // que estar guardado.
  const [oauthError] = useState(readOAuthError);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status === "authenticated") {
      const target = takeRedirect();
      if (target) {
        navigate(target, { replace: true });
      }
      return;
    }

    if (oauthError) {
      const search = new URLSearchParams({ error: "oauth" });
      const target = takeRedirect();

      // Se conserva el destino para que entrar por correo termine donde
      // habría terminado el acceso con Google. No hace falta pasarlo por
      // `safeRedirectTo`: `takeRedirect` ya lo validó al leerlo.
      if (target) {
        search.set("redirectTo", target);
      }

      navigate(`/iniciar-sesion?${search}`, { replace: true });
    }
  }, [status, oauthError, navigate]);

  return null;
}

/** El error con el que Google devuelve a la persona, si es que vuelve con uno. */
function readOAuthError(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return new URLSearchParams(window.location.search).get("error");
}

/**
 * Estado de carga de la aplicación.
 *
 * La aplicación no se renderiza en el servidor (modo SPA, todo el HTML se
 * genera al compilar), así que este es el único `HydrateFallback` permitido: el
 * enrutador rechaza los que se declaren en rutas hijas. Sale dentro del
 * `Layout`, de modo que la barra y el pie ya están colocados y la transición a
 * la página real no salta.
 */
export function HydrateFallback() {
  // En la primera pasada sale en español, que es lo que trae el HTML compilado;
  // el proveedor resuelve la preferencia enseguida y, si es otro idioma, ya no
  // queda nada de esta pantalla en pantalla.
  return <LoadingState label={t("app.opening")} />;
}

/**
 * Enlaces de la barra.
 *
 * Se calculan en cada render en vez de ser constantes porque sus etiquetas
 * dependen del idioma. El destino no cambia nunca: cambiarlo para meter otro
 * idioma en la URL significaría tener rutas duplicadas, y la preferencia de
 * idioma es del navegador de cada persona, no algo que viva en el enlace.
 */
function navLinks() {
  return {
    public: [
      { to: "/explorar", label: "nav.explore" },
      { to: "/progreso", label: "nav.progress" },
    ],
    private: [{ to: "/biblioteca", label: "nav.library" }],
  } as const;
}

function SiteHeader() {
  const t = useT();
  const { status, user } = useAuth();
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";
  const links = navLinks();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur">
      {/* La barra de progreso comunica que hay una navegación en curso. */}
      {isNavigating ? (
        <div
          role="progressbar"
          aria-label={t("app.navigating")}
          className="absolute inset-x-0 top-0 h-0.5 animate-pulse bg-brand/60 motion-reduce:animate-none"
        />
      ) : null}

      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3 sm:px-8">
        <Link
          to="/"
          className="font-display text-2xl font-semibold tracking-tight text-brand"
        >
          Frasevia
        </Link>

        <nav
          aria-label={t("nav.primary")}
          className="order-3 w-full sm:order-2 sm:w-auto"
        >
          <ul className="flex flex-wrap items-center gap-1 text-sm">
            {[...links.private, ...links.public].map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    cx(
                      "rounded-md border-b-2 px-3 py-2 transition-colors",
                      isActive
                        ? "border-accent font-medium text-brand-strong"
                        : "border-transparent text-ink-soft hover:text-ink",
                    )
                  }
                >
                  {t(link.label)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="order-2 ml-auto flex items-center gap-2 sm:order-3">
          <LanguageSwitcher />
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
  const t = useT();

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
        {t("account.unconfigured")}
      </span>
    );
  }

  if (status === "anonymous") {
    return (
      <>
        <Link
          to="/iniciar-sesion"
          className="button-interactive inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-paper-sunken hover:text-ink"
        >
          {t("account.signIn")}
        </Link>
        <Link
          to="/crear-cuenta"
          className="button-interactive inline-flex items-center justify-center rounded-lg bg-brand-solid px-3.5 py-2 text-sm font-medium text-on-solid hover:bg-brand-solid-hover"
        >
          {t("account.signUp")}
        </Link>
      </>
    );
  }

  return (
    <>
      <Link
        to="/ajustes/repaso"
        aria-label={t("nav.reviewSettings")}
        title={t("nav.reviewSettings")}
        className="button-interactive inline-flex size-10 items-center justify-center rounded-lg border border-line bg-paper-raised text-ink-soft transition-colors hover:bg-paper-sunken hover:text-brand"
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
        <button
          type="submit"
          className="rounded-lg border border-line-strong bg-paper-raised px-3 py-2 text-sm text-ink hover:bg-paper-sunken"
        >
          {t("account.signOut")}
        </button>
      </Form>
    </>
  );
}

function SiteFooter() {
  const t = useT();

  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-8 text-sm text-ink-faint sm:px-8">
        <p>{t("footer.tagline")}</p>
        <Link to="/explorar" className="hover:text-ink">
          {t("footer.exploreDecks")}
        </Link>
      </div>
    </footer>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const t = useT();

  let title = t("error.title");
  let message = t("error.message");
  let status: number | undefined;

  if (isRouteErrorResponse(error)) {
    status = error.status;
    title =
      error.status === 404 ? t("error.notFoundTitle") : t("error.shortTitle");
    message =
      error.status === 404
        ? t("error.notFoundMessage")
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
          className="button-interactive inline-flex items-center justify-center rounded-lg bg-brand-solid px-4 py-2.5 text-sm font-medium text-on-solid hover:bg-brand-solid-hover"
        >
          {t("error.backHome")}
        </Link>
        <Link
          to="/explorar"
          className="button-interactive inline-flex items-center justify-center rounded-lg border border-line-strong bg-paper-raised px-4 py-2.5 text-sm text-ink hover:bg-paper-sunken"
        >
          {t("footer.exploreDecks")}
        </Link>
      </div>
    </div>
  );
}
