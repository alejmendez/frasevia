import { Link, NavLink } from "react-router";

import { AccountArea } from "~/components/account-area";
import { LanguageSwitcher } from "~/components/language-switcher";
import { ThemeToggle } from "~/components/theme-toggle";
import { cx } from "~/components/ui";
import { useT } from "~/lib/locale-context";

/**
 * La cabecera de la aplicación.
 *
 * Es lo primero que se ve en cualquier pantalla, así que vive en su propio archivo
 * y `root.tsx` solo la coloca. Aquí no hay sesión ni enrutado: la zona de cuenta
 * sabe de la sesión, la barra no.
 */

/**
 * Los enlaces de la barra.
 *
 * Se calculan en cada render en vez de ser constantes porque sus etiquetas
 * dependen del idioma. El destino no cambia nunca: cambiarlo para meter otro
 * idioma en la URL significaría tener rutas duplicadas, y la preferencia de
 * idioma es del navegador de cada persona, no algo que viva en el enlace.
 */
interface NavItem {
  to: string;
  /** El texto ya traducido: `NavLink` lo pinta tal cual. */
  label: string;
}

/** Los enlaces, con sus etiquetas en el idioma de quien los está viendo. */
function useNavLinks(): { private: NavItem[]; public: NavItem[] } {
  const t = useT();

  return {
    private: [
      { to: "/biblioteca", label: t("nav.library") },
      { to: "/progreso", label: t("nav.progress") },
    ],
    public: [
      { to: "/explorar", label: t("nav.explore") },
      { to: "/ajustes/repaso", label: t("nav.reviewSettings") },
    ],
  };
}

export function SiteHeader({
  isNavigating = false,
}: {
  isNavigating?: boolean;
}) {
  const t = useT();
  const links = useNavLinks();

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
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="order-2 ml-auto flex items-center gap-2 sm:order-3">
          <LanguageSwitcher />
          <ThemeToggle />
          <AccountArea />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
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
