import { activeLocale, t } from "./locale";
import type { CardKind, DeckVisibility, ProgressState } from "./types";

/**
 * Formateo de datos para la interfaz.
 *
 * Estas funciones leen el idioma activo (`app/lib/locale.ts`) en vez de recibirlo
 * como parámetro: las llama el render y todas devuelven el mismo tipo que antes,
 * así que no obliga a cambiar ninguna firma. El idioma activo lo mantiene el
 * proveedor al montar y el selector al cambiar, así que cuando cambia, estos
 * textos cambian con él.
 */

/** Etiquetas visibles para la interfaz, ya traducidas. */

export function visibilityLabel(value: DeckVisibility): string {
  return t(`label.visibility.${value}`);
}

export function cardKindLabel(value: CardKind): string {
  return t(`label.cardKind.${value}`);
}

export function progressLabel(value: ProgressState): string {
  return t(`label.progress.${value}`);
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

/** "hace 3 días", "in 2 hours", "sin registro" / "not recorded". */
export function formatRelativeTime(
  isoDate: string | null | undefined,
  now: Date = new Date(),
): string {
  if (!isoDate) {
    return t("time.noRecord");
  }

  const target = new Date(isoDate);
  if (Number.isNaN(target.getTime())) {
    return t("time.noRecord");
  }

  const seconds = Math.round((target.getTime() - now.getTime()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(activeLocale(), {
    numeric: "auto",
  });

  for (const [unit, unitSeconds] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= unitSeconds) {
      return formatter.format(Math.round(seconds / unitSeconds), unit);
    }
  }

  return t("time.justNow");
}

export function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) {
    return "—";
  }

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(activeLocale(), {
    dateStyle: "long",
  }).format(date);
}

/** "3 tarjetas" / "1 tarjeta"; "3 cards" / "1 card". */
export function cardCountLabel(count: number): string {
  return t("format.cardCount", { count });
}

export function percentLabel(value: number): string {
  return t("format.percent", { value: Math.round(value * 100) });
}
