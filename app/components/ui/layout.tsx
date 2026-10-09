import type { ReactNode } from "react";

/**
 * Une clases, quitando lo que no aporta.
 *
 * Es lo más parecido a una utilidad que hay en toda la base de la interfaz, y
 * está aquí porque lo usan todos los componentes de `app/components/`.
 */
export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

/**
 * La página: el contenedor que centra y da el aire de arriba y abajo.
 *
 * Ningún componente de `app/components/` sabe de mazos, de estudio ni de la
 * sesión. Los que sí viven en `app/features/`.
 */
export function Page({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx("mx-auto w-full max-w-7xl px-5 py-10 sm:px-8", className)}
    >
      {children}
    </div>
  );
}

/** Una caja con borde. `as` decide qué elemento es, para que el HTML cuadre. */
export function Card({
  children,
  className,
  as: Component = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "section";
}) {
  return (
    <Component
      className={cx(
        "rounded-card border border-line bg-paper-raised p-5 shadow-[0_1px_0_var(--card-edge)]",
        className,
      )}
    >
      {children}
    </Component>
  );
}

/**
 * El encabezado de una pantalla.
 *
 * `actions` es el hueco de la derecha: botones o enlaces. Va como ranura y no
 * como un tipo concreto de botón porque cada pantalla trae lo que necesita.
 */
export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-3xl leading-tight text-ink sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <div className="mt-2 max-w-2xl text-ink-soft">{description}</div>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </header>
  );
}

/**
 * El título de una sección dentro de una pantalla.
 *
 * Sale siempre como `h3` porque el `h1` lo pone `PageHeader` y, si una sección
 * admitiera `h2`, la jerarquía del documento dependería de quién la pintó.
 */
export function SectionTitle({
  children,
  as: Component = "h3",
}: {
  children: ReactNode;
  as?: "h2" | "h3";
}) {
  return (
    <Component className="font-display text-xl text-ink">{children}</Component>
  );
}
