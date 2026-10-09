import type { ComponentProps } from "react";
import { Link } from "react-router";

import { cx } from "./layout";

/**
 * Los botones.
 *
 * Hay cinco variantes y todas comparten la misma base. La base se exporta como
 * `buttonClass` para el caso raro de que alguien necesite un `<button>` que no
 * sea este componente —un interruptor, un elemento dentro de una tarjeta— sin
 * tener que reescribirla a mano, que es como se desincroniza.
 */

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

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;

/** Las clases de un botón, por si hay que aplicarlas a algo que no sea un botón. */
export function buttonClass(variant: ButtonVariant = "primary") {
  return cx(BUTTON_BASE, BUTTON_VARIANTS[variant]);
}

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & {
  variant?: ButtonVariant;
}) {
  return (
    <button className={cx(buttonClass(variant), className)} {...props}>
      {children}
    </button>
  );
}

/** Un enlace con aspecto de botón. */
export function ButtonLink({
  to,
  children,
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return (
    <Link to={to} className={cx(buttonClass(variant), className)} {...props}>
      {children}
    </Link>
  );
}
