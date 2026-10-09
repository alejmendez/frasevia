import type { ReactNode } from "react";

import { cx } from "./ui";

/**
 * Los dos botones chiquitos de la cabecera: el tema y el idioma.
 *
 * Se parecían en el 90 % —el mismo borde, el mismo fondo, el mismo alto— y
 * estaban escritos por separado. Lo que queda de cada uno es distinto de verdad:
 * el del tema muestra dos iconos y tiene un nombre accesible por tema, y el del
 * idioma muestra un icono y un texto corto.
 *
 * De ahí que el nombre accesible vaya como ranura y no se deduzca: quien lo
 * controle decide cómo se nombra, porque el nombre cambia con el estado.
 */
export function HeaderToggle({
  onClick,
  label,
  children,
  className,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cx(
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-line-strong bg-paper-raised px-2 text-sm font-medium text-ink transition-colors hover:bg-paper-sunken",
        className,
      )}
    >
      {children}
    </button>
  );
}
