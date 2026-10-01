import type { CardKind, DeckVisibility, ProgressState } from "./types";

/** Etiquetas visibles para la interfaz (español). */

export const VISIBILITY_LABEL: Record<DeckVisibility, string> = {
  private: "Privado",
  public: "Público",
};

export const CARD_KIND_LABEL: Record<CardKind, string> = {
  word: "Palabra",
  phrase: "Frase",
  question: "Pregunta",
  rule: "Regla",
};

export const PROGRESS_LABEL: Record<ProgressState, string> = {
  new: "Nueva",
  learning: "Practicando",
  mastered: "Aprendida",
};

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

/** "hace 3 días", "dentro de 2 horas". */
export function formatRelativeTime(
  isoDate: string | null | undefined,
  now: Date = new Date(),
): string {
  if (!isoDate) {
    return "sin registro";
  }

  const target = new Date(isoDate);
  if (Number.isNaN(target.getTime())) {
    return "sin registro";
  }

  const seconds = Math.round((target.getTime() - now.getTime()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

  for (const [unit, unitSeconds] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= unitSeconds) {
      return formatter.format(Math.round(seconds / unitSeconds), unit);
    }
  }

  return "recién";
}

export function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) {
    return "—";
  }

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("es", {
    dateStyle: "long",
  }).format(date);
}

export function pluralize(
  count: number,
  singular: string,
  plural: string,
): string {
  return count === 1 ? singular : plural;
}

/** "3 tarjetas" / "1 tarjeta" */
export function cardCountLabel(count: number): string {
  return `${count} ${pluralize(count, "tarjeta", "tarjetas")}`;
}

export function percentLabel(value: number): string {
  return `${Math.round(value * 100)}%`;
}
