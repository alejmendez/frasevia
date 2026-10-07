/**
 * Lectura tolerante de lo que devuelve un modelo.
 *
 * Un modelo al que se le pide JSON devuelve JSON *casi* siempre, pero no solo
 * JSON: lo envuelve en un bloque de código, le pone «Aquí tienes el mazo:»
 * delante, devuelve un array suelto en vez de un objeto, o llama `meaning` a
 * `meaning_es`. Todo eso se acepta y se normaliza, porque tirar la respuesta
 * entera por un bloque de más sería una experiencia muy mala para quien la
 * escribió.
 *
 * La normalización también deja las tarjetas dentro de los límites que impone la
 * base de datos (`cards_term_length` y `cards_meaning_length`). Si eso no
 * pasara aquí, el `insert` fallaría entero y se perdería el trabajo del modelo
 * entero; es preferible recortar el texto largo aquí y avisar en pantalla.
 */

import { t } from "~/lib/locale";
import type { CardKind, DeckStudyMode } from "~/lib/types";

/** Límites copiados de los `check` de `cards` en la migración inicial. */
export const TERM_MAX = 200;
export const MEANING_MAX = 400;
export const TITLE_MAX = 120;
export const EXAMPLE_MAX = 300;

/** Tope de tarjetas que se aceptan de una respuesta, para no bloquearla. */
export const MAX_CARDS = 60;

const CARD_KINDS: CardKind[] = ["word", "phrase", "question", "rule"];

export interface DraftCard {
  kind: CardKind;
  term: string;
  meaningEs: string;
  exampleEn: string | null;
  exampleEs: string | null;
  usageNote: string | null;
  tags: string[];
}

export interface DeckDraft {
  title: string;
  description: string;
  level: string | null;
  cards: DraftCard[];
}

export class DraftError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DraftError";
  }
}

// ---------------------------------------------------------------------------
// Extracción del JSON
// ---------------------------------------------------------------------------

/**
 * Quita un bloque de código cercado, si la respuesta entera es uno.
 *
 * Solo se quita si empieza y acaba así, para no romper un texto que mentione
 * las comillas invertidas sin ser un bloque.
 */
function stripFence(text: string): string {
  const fenced = /^\s*```[a-zA-Z0-9_-]*\s*\n([\s\S]*?)\n?\s*```\s*$/;
  const match = fenced.exec(text);
  return match?.[1] ?? text;
}

/**
 * Localiza el primer objeto o array JSON completo dentro de un texto.
 *
 * Cuenta llaves respetando comillas y escapes, porque un ejemplo de una
 * tarjeta puede llevar llaves dentro: cortarlas por el primer `}` rompería el
 * JSON justo en el contenido que nos interesa.
 */
function sliceJson(text: string): string | null {
  for (let start = 0; start < text.length; start++) {
    const char = text[start];
    if (char !== "{" && char !== "[") {
      continue;
    }

    const open = char;
    const close = open === "{" ? "}" : "]";
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = start; index < text.length; index++) {
      const current = text[index];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (current === "\\") {
          escaped = true;
        } else if (current === '"') {
          inString = false;
        }
        continue;
      }

      if (current === '"') {
        inString = true;
      } else if (current === open) {
        depth++;
      } else if (current === close) {
        depth--;
        if (depth === 0) {
          return text.slice(start, index + 1);
        }
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Normalización
// ---------------------------------------------------------------------------

function asText(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return "";
}

/**
 * Primer campo presente de una lista de alias.
 *
 * Los modelos no siguen un esquema al pie de la letra aunque se les pida, y
 * cada proveedor nombra un poco distinto. Aceptar varios nombres es más
 * robustez por el mismo precio que pelearse con la respuesta.
 */
function pick(record: Record<string, unknown>, ...names: string[]): string {
  for (const name of names) {
    const value = asText(record[name]);
    if (value !== "") {
      return value;
    }
  }
  return "";
}

function clip(value: string, max: number): string {
  if (value.length <= max) {
    return value;
  }
  // Se corta en un espacio si lo hay cerca, para no partir una palabra.
  const cut = value.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return (space > max * 0.6 ? cut.slice(0, space) : cut).trim();
}

function optional(value: string, max: number): string | null {
  return value === "" ? null : clip(value, max);
}

function toKind(value: string): CardKind {
  const found = CARD_KINDS.find((kind) => kind === value);
  return found ?? "word";
}

function toTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map(asText)
    .filter((tag) => tag !== "")
    .slice(0, 8)
    .map((tag) => clip(tag, 40));
}

/**
 * Normaliza una entrada suelta en una tarjeta, o `null` si no es utilizable.
 *
 * Sin `term` o sin `meaning` la tarjeta se descarta: las dos columnas son
 * `not null` con una restricción de longitud mínima, así que una tarjeta
 * incompleta haría fallar el `insert` de todas las demás. Es preferible un
 * mazo con nueve tarjetas buenas que uno con diez donde la décima rompe el
 * guardado.
 */
function toCard(value: unknown, studyMode: DeckStudyMode): DraftCard | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const term = clip(
    pick(
      record,
      "term",
      "front",
      "question",
      "pregunta",
      "concept",
      "word",
      "phrase",
      "texto",
      "english",
    ),
    TERM_MAX,
  );
  // `translation` va aquí y no en el ejemplo: lo habitual es que el modelo lo
  // use para la traducción del término, que es el campo obligatorio, y no para
  // la del ejemplo, que es opcional.
  const meaningEs = clip(
    pick(
      record,
      "meaning_es",
      "meaningEs",
      "meaning",
      "translation",
      "back",
      "answer",
      "respuesta",
      "traduccion",
    ),
    MEANING_MAX,
  );

  if (term === "" || meaningEs === "") {
    return null;
  }

  return {
    kind: asText(record.kind)
      ? toKind(asText(record.kind))
      : studyMode === "general"
        ? "question"
        : "word",
    term,
    meaningEs,
    exampleEn: optional(
      pick(record, "example_en", "exampleEn", "example", "sentence_en"),
      EXAMPLE_MAX,
    ),
    exampleEs: optional(
      pick(
        record,
        "example_es",
        "exampleEs",
        "sentence_es",
        "example_translation",
        "traduccion_ejemplo",
      ),
      EXAMPLE_MAX,
    ),
    usageNote: optional(
      pick(record, "usage_note", "usageNote", "note", "nota"),
      EXAMPLE_MAX,
    ),
    tags: toTags(record.tags),
  };
}

/**
 * Clave para detectar repeticiones.
 *
 * Se comparan términos ya normalizados: «to push back» y «To  push  back» son
 * la misma tarjeta y, sin esto, el modelo podría devolverla dos veces.
 */
function dedupeKey(card: DraftCard): string {
  return `${card.term.toLowerCase().replace(/\s+/g, " ")}::${card.meaningEs
    .toLowerCase()
    .replace(/\s+/g, " ")}`;
}

/**
 * Interpreta la respuesta cruda de un modelo y devuelve un mazo en borrador.
 *
 * Lanza `DraftError` con un mensaje pensado para mostrarse tal cual cuando la
 * respuesta no contiene nada que se parezca a un mazo.
 */
export function parseDeckDraft(
  raw: string,
  studyMode: DeckStudyMode = "language",
): DeckDraft {
  const text = stripFence(raw.trim());
  const slice = sliceJson(text);

  if (slice === null) {
    throw new DraftError(t("draft.notADeck"));
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(slice);
  } catch {
    throw new DraftError(t("draft.malformed"));
  }

  // Un array suelto se interpreta como la lista de tarjetas.
  const root: Record<string, unknown> = Array.isArray(parsed)
    ? { cards: parsed }
    : typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {};

  const rawCards = Array.isArray(root.cards)
    ? root.cards
    : Array.isArray(root.tarjetas)
      ? root.tarjetas
      : [];

  const cards: DraftCard[] = [];
  const seen = new Set<string>();

  for (const entry of rawCards) {
    const card = toCard(entry, studyMode);
    if (card === null) {
      continue;
    }
    const key = dedupeKey(card);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    cards.push(card);
    if (cards.length >= MAX_CARDS) {
      break;
    }
  }

  if (cards.length === 0) {
    throw new DraftError(t("draft.noUsableCards"));
  }

  const title = clip(pick(root, "title", "titulo", "name"), TITLE_MAX);

  return {
    // Un mazo sin título no se puede guardar: `decks_title_length` exige al
    // menos un carácter. Se inventa uno a partir del concepto para no perder
    // las tarjetas, que es lo que costó. Va en el idioma que se está usando: es
    // un título nuevo, no uno traducción de otro.
    title: title === "" ? t("draft.defaultTitle") : title,
    description: clip(pick(root, "description", "descripcion"), MEANING_MAX),
    level: optional(pick(root, "level", "nivel"), 60),
    cards,
  };
}
