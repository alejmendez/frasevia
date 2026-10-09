import type { ReactNode } from "react";

import { useT } from "~/lib/locale-context";
import { cx } from "./layout";

/**
 * Avisos, estados vacíos y medidores.
 *
 * Son las piezas que le dicen a la persona qué está pasando: que algo falló, que
 * no hay nada todavía, que está cargando, que falta configurarlo. `ConfigNotice`
 * es la excepción a que `components/` no sepa de nada del dominio, y la razón
 * está escrita en el sitio donde pasa: es la pantalla entera cuando faltan las
 * credenciales.
 */

const ALERT_VARIANTS = {
  info: "border-brand/25 bg-brand-muted text-brand-strong",
  success: "border-success/25 bg-success-muted text-success",
  error: "border-danger/25 bg-danger-muted text-danger",
  warning: "border-accent/25 bg-accent-muted text-accent",
} as const;

export type AlertVariant = keyof typeof ALERT_VARIANTS;

/** Un recuadro con un tono. El tono decide si se anuncia como error o estado. */
export function Alert({
  children,
  variant = "info",
  title,
  className,
}: {
  children?: ReactNode;
  variant?: AlertVariant;
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

/** Lo que se ve cuando una lista no tiene nada, con la salida en `action`. */
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

/** Un indicador de carga con su texto, para que no se vea solo un círculo. */
export function LoadingState({ label }: { label: string }) {
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

const TAG_TONES = {
  neutral: "border-line bg-paper-sunken text-ink-soft",
  brand: "border-brand/20 bg-brand-muted text-brand-strong",
  accent: "border-accent/20 bg-accent-muted text-accent",
} as const;

/** Una etiqueta corta: el estado de una tarjeta, el tipo de un mazo. */
export function Tag({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: keyof typeof TAG_TONES;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TAG_TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

/**
 * Una barra de progreso.
 *
 * `label` no es opcional a propósito: es lo que anuncia el lector de pantalla, y
 * una barra sin nombre no dice nada. `total` es el denominador, no un porcentaje,
 * para que quien la pinte no tenga que hacer la cuenta.
 */
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
