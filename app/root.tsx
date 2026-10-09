import { useEffect, useRef, useState } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useHref,
  useLocation,
  useNavigate,
  useNavigation,
} from "react-router";
import { NavigationSkeleton } from "~/components/navigation-skeleton";
import { SiteFooter, SiteHeader } from "~/components/site-chrome";
import { ButtonLink, LoadingState } from "~/components/ui";
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
  const navigation = useNavigation();

  return (
    <AuthProvider>
      <GoogleReturn />
      <div className="flex min-h-dvh flex-col">
        <SiteHeader isNavigating={navigation.state !== "idle"} />
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
 * Lo que se ve cuando una ruta no existe o algo falla.
 *
 * React Router entrega el error con lo que la ruta haya lanzado. Un
 * `isRouteErrorResponse` es una respuesta HTTP —un 404, un 400— y trae su propio
 * título; cualquier otra cosa es un fallo normal, y en desarrollo se enseña el
 * mensaje real porque es lo único que ayuda a encontrarlo.
 */
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const t = useT();
  const shown = describeError(error, t);

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-24 text-center sm:px-8">
      {shown.status ? (
        <p className="font-display text-6xl text-brand">{shown.status}</p>
      ) : null}
      <h1 className="mt-4 font-display text-3xl text-ink">{shown.title}</h1>
      <p className="mt-3 text-ink-soft">{shown.message}</p>
      <div className="mt-8 flex justify-center gap-3">
        <ButtonLink to="/">{t("error.backHome")}</ButtonLink>
        <ButtonLink to="/explorar" variant="secondary">
          {t("footer.exploreDecks")}
        </ButtonLink>
      </div>
    </div>
  );
}

/** Qué título y qué mensaje salen, según lo que falló. */
function describeError(
  error: unknown,
  t: ReturnType<typeof useT>,
): { status?: number; title: string; message: string } {
  if (isRouteErrorResponse(error)) {
    const notFound = error.status === 404;
    return {
      status: error.status,
      title: notFound ? t("error.notFoundTitle") : t("error.shortTitle"),
      message: notFound
        ? t("error.notFoundMessage")
        : error.statusText || t("error.message"),
    };
  }

  return {
    title: t("error.title"),
    message:
      import.meta.env.DEV && error instanceof Error
        ? error.message
        : t("error.message"),
  };
}
