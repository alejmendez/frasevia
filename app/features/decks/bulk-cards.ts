import { MEANING_MAX, TERM_MAX } from "~/features/ai/draft";
import type { CardDraft, CardEdit } from "~/lib/decks";
import type { Card, CardKind } from "~/lib/types";

/**
 * El intercambio de tarjetas por JSON.
 *
 * La idea es esta: el mazo se exporta como una lista de tarjetas en JSON, esa
 * lista se le pasa a un modelo de lenguaje, y lo que devuelve se pega de vuelta
 * para guardarlo todo de una vez. Sirve para lo que el editor de una por una no
 * puede: reescribir veinte tarjetas que comparten la misma estructura, o
 * rellenar los huecos que alguien dejó entre corchetes.
 *
 * Aquí está la parte que no sabe de React ni de Supabase: la forma del JSON, lo
 * que se valida y lo que se devuelve. Lo que se hace con el resultado —mandarlo
 * a la base— lo decide la pantalla.
 *
 * Dos reglas, y las dos están decididas:
 *
 * - Una tarjeta que **no** aparece en el JSON no se toca. El JSON dice qué
 *   cambiar, no qué mazo es: si el modelo se equivoca y deja una fuera, lo que
 *   había en el mazo sigue ahí.
 * - Una entrada **sin `card_id`** es una tarjeta nueva, y se agrega al final.
 */

/** Los tipos de tarjeta que existen. */
const CARD_KINDS: readonly CardKind[] = ["word", "phrase", "question", "rule"];

/** Por qué no se pudo leer el JSON. Cada motivo tiene su mensaje en la pantalla. */
export type BulkErrorReason =
  | "invalid-json"
  | "not-a-list"
  | "empty"
  | "not-a-card"
  | "missing-fields"
  | "too-long"
  | "bad-kind"
  | "unknown-card";

export type BulkParseResult =
  | { ok: true; updates: Record<string, CardEdit>; creates: CardDraft[] }
  | { ok: false; reason: BulkErrorReason; index?: number; cardId?: string };

/**
 * El JSON que se le da al modelo.
 *
 * Un objeto por tarjeta, con su identificador para poder mapear lo que vuelve
 * a la tarjeta que era. Los campos van todos, aunque valgan `null`: así el
 * modelo ve de una vez qué se puede cambiar, y lo que devuelve tiene la misma
 * forma que lo que se le dio.
 */
export function cardsToJson(cards: Card[]): string {
  return JSON.stringify(
    cards.map((card) => ({
      card_id: card.id,
      kind: card.kind,
      term: card.term,
      meaning_es: card.meaning_es,
      example_en: card.example_en,
      example_es: card.example_es,
      usage_note: card.usage_note,
      tags: card.tags,
    })),
    null,
    2,
  );
}

/**
 * Lee el JSON pegado y lo separa en lo que se actualiza y lo que se agrega.
 *
 * `knownIds` son las tarjetas que el mazo tiene ahora mismo. Sirven para
 * distinguir "esta tarjeta es de otro mazo" de "esta tarjeta es nueva", que son
 * dos cosas muy distintas: lo primero es un error, lo segundo una tarjeta más.
 */
export function parseBulkCards(
  text: string,
  knownIds: string[],
): BulkParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: "invalid-json" };
  }

  if (!Array.isArray(parsed)) {
    return { ok: false, reason: "not-a-list" };
  }

  if (parsed.length === 0) {
    return { ok: false, reason: "empty" };
  }

  const updates: Record<string, CardEdit> = {};
  const creates: CardDraft[] = [];

  for (const [position, entry] of parsed.entries()) {
    // La posición que se ve es la de la lista, contando desde uno.
    const index = position + 1;

    if (!isRecord(entry)) {
      return { ok: false, reason: "not-a-card", index };
    }

    const term = requiredText(entry.term);
    const meaningEs = requiredText(entry.meaning_es);

    if (term === null || meaningEs === null) {
      return { ok: false, reason: "missing-fields", index };
    }

    // Los límites son los mismos que los del formulario y los de la base: un
    // texto más largo se rechaza aquí, con un mensaje que se entiende, en vez de
    // dejar que lo rechace un trigger.
    if (term.length > TERM_MAX || meaningEs.length > MEANING_MAX) {
      return { ok: false, reason: "too-long", index };
    }

    const kind = entry.kind ?? "word";
    if (!isCardKind(kind)) {
      return { ok: false, reason: "bad-kind", index };
    }

    const tags = tagsOf(entry.tags);
    if (tags === null) {
      return { ok: false, reason: "not-a-card", index };
    }

    const exampleEn = optionalText(entry.example_en);
    const exampleEs = optionalText(entry.example_es);
    const usageNote = optionalText(entry.usage_note);

    if (
      exampleEn === undefined ||
      exampleEs === undefined ||
      usageNote === undefined
    ) {
      return { ok: false, reason: "not-a-card", index };
    }

    const card: CardEdit = {
      kind,
      term,
      meaning_es: meaningEs,
      example_en: exampleEn,
      example_es: exampleEs,
      usage_note: usageNote,
      tags,
    };

    const cardId = entry.card_id;

    if (cardId === undefined || cardId === null) {
      creates.push({
        term,
        meaningEs,
        kind,
        exampleEn,
        exampleEs,
        usageNote,
        tags,
      });
      continue;
    }

    // Un identificador que no es de este mazo no se toca: o el modelo se
    // equivocó de mazo, o la tarjeta ya no existe. En los dos casos, avisar es
    // mejor que escribir en la nada.
    if (typeof cardId !== "string" || !knownIds.includes(cardId)) {
      return {
        ok: false,
        reason: "unknown-card",
        index,
        cardId: String(cardId),
      };
    }

    updates[cardId] = card;
  }

  return { ok: true, updates, creates };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCardKind(value: unknown): value is CardKind {
  return (
    typeof value === "string" &&
    (CARD_KINDS as readonly string[]).includes(value)
  );
}

/**
 * Un texto que tiene que estar. Se recorta igual que en el formulario, porque
 * la base cuenta los caracteres sin los espacios de los bordes.
 */
function requiredText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Un texto que puede faltar.
 *
 * Devuelve `null` cuando no hay texto y `undefined` cuando el tipo está mal:
 * los dos se distinguen a propósito, porque uno se acepta y el otro no.
 */
function optionalText(value: unknown): string | null | undefined {
  if (value === undefined || value === null) {
    return null;
  }

  return typeof value === "string" ? value : undefined;
}

/** Las etiquetas: una lista de cadenas, o nada. */
function tagsOf(value: unknown): string[] | null {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    return null;
  }

  return value.every((tag) => typeof tag === "string")
    ? (value as string[])
    : null;
}
