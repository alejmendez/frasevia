import type { ReactNode } from "react";
import { Link } from "react-router";

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
      className={cx("mx-auto w-full max-w-5xl px-5 py-10 sm:px-8", className)}
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
        "rounded-card border border-line bg-paper-raised p-5 shadow-[0_1px_0_rgb(34_30_25/0.04)]",
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
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-55";

const BUTTON_VARIANTS = {
  primary: "bg-brand px-4 py-2.5 text-white hover:bg-brand-strong",
  secondary:
    "border border-line-strong bg-paper-raised px-4 py-2.5 text-ink hover:bg-paper-sunken",
  ghost: "px-3 py-2 text-ink-soft hover:bg-paper-sunken hover:text-ink",
  danger: "bg-danger px-4 py-2.5 text-white hover:opacity-90",
  subtle: "bg-brand-muted px-4 py-2.5 text-brand-strong hover:brightness-97",
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

export function LoadingState({ label = "Cargando…" }: { label?: string }) {
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
      {label}
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
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <Alert variant="warning" title="Falta configurar Supabase">
        <p>
          Frasevia necesita conexión a Supabase para leer mazos, guardar tu
          biblioteca y registrar tu progreso. Todavía no puede hacerlo.
        </p>
        <p className="mt-2">
          Copia <code className="font-mono">.env.example</code> a{" "}
          <code className="font-mono">.env</code> y completa{" "}
          <code className="font-mono">VITE_SUPABASE_URL</code> y{" "}
          <code className="font-mono">VITE_SUPABASE_PUBLISHABLE_KEY</code>.
          Después reinicia el servidor de desarrollo.
        </p>
        <p className="mt-2">
          Mientras tanto puedes navegar la interfaz, pero nada se guarda.
        </p>
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
