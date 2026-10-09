import type { CardEdit } from "~/lib/decks";
import type { CardKind } from "~/lib/types";

/**
 * Lo que llega del formulario del editor de tarjetas.
 *
 * El formulario tiene un `fieldset` por tarjeta y los campos se llaman
 * `card:<id>:<campo>`, así que un solo botón «Guardar tarjetas» trae toda la
 * edición pendiente. Leer eso —separar el identificador del campo, quitar los
 * espacios, dejar los vacíos como nulos, comprobar que estén completas— era una
 * función de 110 líneas dentro de la ruta, sin un solo test, y es justo la clase de
 * código que se copia mal sin que nadie se entere hasta que se guarda de menos.
 *
 * Aquí está, sola y sin React ni base de datos.
 */

const PREFIX = "card:";

/** Los campos que el editor puede cambiar de una tarjeta. */
const CARD_FORM_FIELDS = [
  "term",
  "meaning_es",
  "example_en",
  "example_es",
  "usage_note",
  "tags",
  "kind",
] as const;

/** Los tipos de tarjeta que el editor ofrece. */
const CARD_KINDS: readonly CardKind[] = ["word", "phrase", "question", "rule"];

/** Lo que se puede leer de un envío, y en qué se convertible. */
export type CardFormParse =
  /** Al menos una tarjeta, y todas completas. Lista para enviarse. */
  | { ok: true; cards: Record<string, CardEdit> }
  /** El formulario no traía ninguna tarjeta: no hay nada que guardar. */
  | { ok: false; reason: "empty" }
  /** Una tarjeta se quedó sin término o sin traducción. */
  | { ok: false; reason: "incomplete"; cardId: string };

/**
 * Lee y valida las tarjetas de un envío del editor.
 *
 * Es todo o nada a propósito. Guardar veinte de veintiuna y avisar sería peor que
 * no guardar, porque quien edita no ve cuál se perdió.
 */
export function parseCardForm(formData: FormData): CardFormParse {
  const rows = new Map<string, Record<string, string>>();

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith(PREFIX)) continue;

    const [, cardId, field] = key.split(":");
    // Un `card:` suelto o un campo que el editor no tiene no rompen el envío: se
    // ignoran, igual que los campos que no son de ninguna tarjeta.
    if (!cardId || !field) continue;
    if (
      !CARD_FORM_FIELDS.includes(field as (typeof CARD_FORM_FIELDS)[number])
    ) {
      continue;
    }

    const entry = rows.get(cardId) ?? {};
    entry[field] = String(value);
    rows.set(cardId, entry);
  }

  if (rows.size === 0) {
    return { ok: false, reason: "empty" };
  }

  const cards: Record<string, CardEdit> = {};

  for (const [cardId, row] of rows) {
    const term = text(row.term);
    const meaning = text(row.meaning_es);

    if (term === "" || meaning === "") {
      return { ok: false, reason: "incomplete", cardId };
    }

    cards[cardId] = {
      term,
      meaning_es: meaning,
      kind: normalizeKind(row.kind),
      example_en: optional(row.example_en),
      example_es: optional(row.example_es),
      usage_note: optional(row.usage_note),
      tags: parseTags(row.tags),
    };
  }

  return { ok: true, cards };
}

/** Un texto del formulario ya sin espacios de los dos lados. */
export function text(value: FormDataEntryValue | null | undefined): string {
  return String(value ?? "").trim();
}

/** Un texto del formulario, o `null` si no tiene nada. */
export function optional(
  value: FormDataEntryValue | null | undefined,
): string | null {
  return text(value) || null;
}

/**
 * Las etiquetas de una tarjeta.
 *
 * Se separan por comas. Una entrada a medio escribir —«verbo,»— no es un error:
 * se guarda como una etiqueta y se corrige en el editor.
 */
export function parseTags(
  value: FormDataEntryValue | null | undefined,
): string[] {
  return String(value ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

/** El tipo de tarjeta del formulario, o `word` si no se reconoce. */
export function normalizeKind(
  value: FormDataEntryValue | null | undefined,
): CardKind {
  return CARD_KINDS.includes(value as CardKind) ? (value as CardKind) : "word";
}
