import type { ReactNode } from "react";
import { Link } from "react-router";

import { useT } from "~/lib/locale-context";

/**
 * Componentes de interfaz compartidos.
 *
 * Se mantienen pequeños y sin lógica de negocio: solo presentación y
 * accesibilidad. Los componentes que saben de mazos o de estudio viven en
 * `app/features/`.
 */

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------
// Contenedores
// ---------------------------------------------------------------------------

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

export function Card({
  children,
  className,
  as: Component = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "section" | "li";
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

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
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

export function SectionTitle({
  children,
  as: Component = "h2",
}: {
  children: ReactNode;
  as?: "h2" | "h3";
}) {
  return (
    <Component className="font-display text-xl text-ink">{children}</Component>
  );
}

// ---------------------------------------------------------------------------
// Botones y enlaces
// ---------------------------------------------------------------------------

const BUTTON_BASE =
  "button-interactive inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-55";

const BUTTON_VARIANTS = {
  primary:
    "bg-brand-solid px-4 py-2.5 text-on-solid hover:bg-brand-solid-hover",
  secondary:
    "border border-line-strong bg-paper-raised px-4 py-2.5 text-ink hover:bg-paper-sunken",
  ghost: "px-3 py-2 text-ink-soft hover:bg-paper-sunken hover:text-ink",
  danger: "bg-danger px-4 py-2.5 text-on-solid hover:opacity-90",
  // El brillo baja en modo luz y sube en modo noche, porque oscurecer un fondo
  // ya oscuro no se ve.
  subtle:
    "bg-brand-muted px-4 py-2.5 text-brand-strong hover:brightness-97 dark:hover:brightness-110",
} as const;

type ButtonVariant = keyof typeof BUTTON_VARIANTS;

export function buttonClass(variant: ButtonVariant = "primary") {
  return cx(BUTTON_BASE, BUTTON_VARIANTS[variant]);
}

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
}) {
  return (
    <button className={cx(buttonClass(variant), className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  to,
  children,
  variant = "primary",
  className,
  ...props
}: React.ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return (
    <Link to={to} className={cx(buttonClass(variant), className)} {...props}>
      {children}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Formularios
// ---------------------------------------------------------------------------

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  required,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
  required?: boolean;
}) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
        {required ? (
          <span className="ml-1 text-accent" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {hint ? (
        <p id={hintId} className="text-xs text-ink-faint">
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-xs font-medium text-danger"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const inputClass =
  "w-full rounded-lg border border-line-strong bg-paper-raised px-3 py-2.5 text-ink placeholder:text-ink-faint focus:border-brand";

export const textareaClass = cx(
  inputClass,
  "min-h-24 resize-y leading-relaxed",
);

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(textareaClass, className)} {...props} />;
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx(inputClass, className)} {...props} />;
}

// ---------------------------------------------------------------------------
// Estados y avisos
// ---------------------------------------------------------------------------

const ALERT_VARIANTS = {
  info: "border-brand/25 bg-brand-muted text-brand-strong",
  success: "border-success/25 bg-success-muted text-success",
  error: "border-danger/25 bg-danger-muted text-danger",
  warning: "border-accent/25 bg-accent-muted text-accent",
} as const;

export function Alert({
  children,
  variant = "info",
  title,
  className,
}: {
  children?: ReactNode;
  variant?: keyof typeof ALERT_VARIANTS;
  title?: string;
  className?: string;
}) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cx(
        "rounded-lg border px-4 py-3 text-sm",
        ALERT_VARIANTS[variant],
        className,
      )}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? <div className={cx(title && "mt-1")}>{children}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-card border border-dashed border-line-strong bg-paper-raised/60 px-6 py-12 text-center">
      <h3 className="font-display text-xl text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
        {description}
      </p>
      {action ? (
        <div className="mt-5 flex justify-center gap-2">{action}</div>
      ) : null}
    </div>
  );
}

export function LoadingState({ label }: { label?: string }) {
  const t = useT();

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-3 px-6 py-16 text-sm text-ink-soft"
    >
      <span
        aria-hidden="true"
        className="size-4 animate-spin rounded-full border-2 border-line-strong border-t-brand"
      />
      {label ?? t("common.loading")}
    </div>
  );
}

/**
 * Reserva el espacio de una página mientras React Router espera sus datos.
 * El modo de estudio se centra en la ficha; el de formulario imita sus campos.
 */
export function NavigationSkeleton({
  label,
  variant = "page",
}: {
  label: string;
  variant?: "form" | "page" | "study";
}) {
  return (
    <div
      role="status"
      aria-label={label}
      className="mx-auto min-h-[60dvh] w-full max-w-7xl animate-pulse px-5 py-10 motion-reduce:animate-none sm:px-8"
    >
      <span className="sr-only">{label}</span>
      {variant === "study" ? (
        <div
          aria-hidden="true"
          className="mx-auto max-w-2xl space-y-6 pt-8 sm:pt-14"
        >
          <div className="mx-auto h-4 w-32 rounded-full bg-paper-sunken" />
          <div className="rounded-card border border-line bg-paper-raised p-6 sm:p-10">
            <div className="mx-auto h-3 w-24 rounded-full bg-paper-sunken" />
            <div className="mx-auto mt-6 h-10 w-3/4 rounded-lg bg-paper-sunken" />
            <div className="mx-auto mt-4 h-4 w-1/2 rounded-full bg-paper-sunken" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-12 rounded-lg border border-line bg-paper-raised" />
            <div className="h-12 rounded-lg border border-line bg-paper-raised" />
          </div>
        </div>
      ) : variant === "form" ? (
        <div aria-hidden="true" className="max-w-3xl space-y-8">
          <header className="space-y-3">
            <div className="h-3 w-24 rounded-full bg-paper-sunken" />
            <div className="h-10 w-64 max-w-full rounded-lg bg-paper-sunken" />
            <div className="h-4 w-96 max-w-full rounded-full bg-paper-sunken" />
          </header>
          <div className="space-y-5 rounded-card border border-line bg-paper-raised p-5 sm:p-7">
            <div className="grid gap-5 sm:grid-cols-2">
              {["field-1", "field-2", "field-3", "field-4"].map((field) => (
                <div key={field} className="space-y-2">
                  <div className="h-3 w-24 rounded-full bg-paper-sunken" />
                  <div className="h-11 rounded-lg border border-line bg-paper" />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="h-3 w-32 rounded-full bg-paper-sunken" />
              <div className="h-28 rounded-lg border border-line bg-paper" />
            </div>
            <div className="h-10 w-32 rounded-lg bg-paper-sunken" />
          </div>
        </div>
      ) : (
        <div aria-hidden="true" className="space-y-8">
          <header className="space-y-3">
            <div className="h-3 w-24 rounded-full bg-paper-sunken" />
            <div className="h-10 w-64 max-w-full rounded-lg bg-paper-sunken" />
            <div className="h-4 w-96 max-w-full rounded-full bg-paper-sunken" />
          </header>
          <div className="h-11 w-full rounded-lg border border-line bg-paper-raised" />
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {["card-1", "card-2", "card-3", "card-4", "card-5", "card-6"].map(
              (card) => (
                <div
                  key={card}
                  className="space-y-4 rounded-card border border-line bg-paper-raised p-5"
                >
                  <div className="h-5 w-2/3 rounded-full bg-paper-sunken" />
                  <div className="h-3 w-full rounded-full bg-paper-sunken" />
                  <div className="h-3 w-4/5 rounded-full bg-paper-sunken" />
                  <div className="pt-2">
                    <div className="h-8 w-28 rounded-lg bg-paper-sunken" />
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Aviso de configuración faltante.
 *
 * Se muestra en lugar de los datos cuando no hay credenciales de Supabase. Es
 * deliberadamente explícito: la aplicación no simula que guardó nada.
 */
export function ConfigNotice() {
  const t = useT();

  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <Alert variant="warning" title={t("configNotice.title")}>
        <p>{t("configNotice.body")}</p>
        {/* El texto va troceado para poder poner `code` alrededor de los nombres
            de archivo, que no se traducen. */}
        <p className="mt-2">
          {t("configNotice.lead")}{" "}
          <code className="font-mono">.env.example</code>{" "}
          {t("configNotice.middle")} <code className="font-mono">.env</code>
        </p>
        <p className="mt-2">{t("configNotice.note")}</p>
      </Alert>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Etiquetas y medidores
// ---------------------------------------------------------------------------

export function Tag({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "accent";
}) {
  const tones = {
    neutral: "border-line bg-paper-sunken text-ink-soft",
    brand: "border-brand/20 bg-brand-muted text-brand-strong",
    accent: "border-accent/20 bg-accent-muted text-accent",
  } as const;

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function ProgressBar({
  value,
  total,
  label,
}: {
  value: number;
  total: number;
  label: string;
}) {
  const ratio = total === 0 ? 0 : Math.min(1, value / total);

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={label}
      className="h-1.5 w-full overflow-hidden rounded-full bg-paper-sunken"
    >
      <div
        className="h-full rounded-full bg-brand transition-[width] duration-300"
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  );
}
