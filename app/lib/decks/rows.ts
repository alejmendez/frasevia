import type { CardKind, DeckStudyMode, DeckVisibility } from "../types";

/**
 * Cómo se ve un mazo en la base: columnas, forma de la fila y sus reglas.
 *
 * Tres pantallas crean mazos y otras editan tarjetas, y cada una armaba el
 * objeto por su cuenta. Eso rompía tres cosas a la vez: que un campo nuevo
 * llegara a un sitio y no al otro, que la regla de «un mazo general tiene un
 * solo idioma» estuviera escrita una vez por archivo, y que los límites de
 * longitud del formulario y los del insert no tuvieran por qué coincidir.
 *
 * Aquí está la forma de la fila, que es lo que se manda. El texto que ve la
 * persona se queda en las pantallas: en este módulo no hay ni una cadena
 * visible.
 */

/** Columnas de `decks`, tal cual. */
export const DECK_COLUMNS =
  "id, author_id, title, slug, description, study_mode, source_language, target_language, level, visibility, is_official, source_deck_id, card_count, created_at, updated_at";

/** Columnas de `cards`, tal cual. */
export const CARD_COLUMNS =
  "id, deck_id, kind, term, meaning_es, example_en, example_es, usage_note, tags, position, created_at, updated_at";

/**
 * Campos que el RPC `update_deck_cards` acepta.
 *
 * Se listan uno a uno en lugar de mandar el objeto entero, para que la forma del
 * RPC no dependa de una conversión implícita y para que un campo nuevo no se
 * cuele por accidente.
 */
export const CARD_EDITABLE_FIELDS = [
  "kind",
  "term",
  "meaning_es",
  "example_en",
  "example_es",
  "usage_note",
  "tags",
] as const;

export type CardEditableField = (typeof CARD_EDITABLE_FIELDS)[number];

export type CardRow = {
  deck_id: string;
  kind: string;
  term: string;
  meaning_es: string;
  example_en: string | null;
  example_es: string | null;
  usage_note: string | null;
  tags: string[];
  position: number;
};

export type DeckRow = {
  author_id: string;
  title: string;
  description: string;
  study_mode: DeckStudyMode;
  level: string | null;
  source_language: string;
  target_language: string;
  visibility: DeckVisibility;
};

/** Lo que una pantalla sabe de un mazo antes de que exista en la base. */
export interface DeckBrief {
  title: string;
  description?: string | null;
  studyMode: DeckStudyMode;
  level?: string | null;
  sourceLanguage: string;
  targetLanguage: string;
  visibility: DeckVisibility;
}

/** Lo que una pantalla sabe de una tarjeta antes de que exista en la base. */
export interface CardDraft {
  term: string;
  meaningEs: string;
  kind?: CardKind;
  exampleEn?: string | null;
  exampleEs?: string | null;
  usageNote?: string | null;
  tags?: string[] | null;
}

/** Un texto que solo se guarda si tiene contenido; si no, `null`. */
function textOrNull(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * El idioma de destino de un mazo.
 *
 * Un mazo de repaso general usa **un solo** idioma: el contenido, los ejemplos y
 * las notas están todos en él, así que no hay traducción y `target_language`
 * apunta al mismo idioma que `source_language`. Un mazo de idiomas sí traduce, y
 * ahí cada uno va por su lado.
 *
 * La regla estaba escrita a mano en las tres pantallas que guardan un mazo. Con
 * el mismo ternario y el mismo riesgo: que un camino nuevo la pase por alto y
 * deje el mazo general apuntando a un idioma que no traduce nada.
 */
export function deckTargetLanguage(
  studyMode: DeckStudyMode,
  sourceLanguage: string,
  targetLanguage: string,
): string {
  return studyMode === "general" ? sourceLanguage : targetLanguage;
}

/** Fila de `decks` para insertar o actualizar. */
export function toDeckRow(authorId: string, brief: DeckBrief): DeckRow {
  const title = brief.title.trim();

  // Ninguna pantalla llega aquí sin comprobarlo antes —cada una muestra el aviso
  // en su idioma—, pero un insert con título vacío crea un mazo invisible, que
  // es peor que un error.
  if (title === "") {
    throw new Error("un mazo necesita título");
  }

  return {
    author_id: authorId,
    title,
    description: (brief.description ?? "").trim(),
    study_mode: brief.studyMode,
    // El nivel es opcional y se guarda vacío como `null`, no como cadena en
    // blanco: la base lo usa para ordenar y una cadena vacía cuenta como nivel.
    level: textOrNull(brief.level),
    source_language: brief.sourceLanguage,
    target_language: deckTargetLanguage(
      brief.studyMode,
      brief.sourceLanguage,
      brief.targetLanguage,
    ),
    visibility: brief.visibility,
  };
}

/**
 * Fila de `cards` para insertar.
 *
 * `position` llega numerada desde 1 porque así es como la base ordena, y el
 * `kind` que no se dice es `word`: era lo que significaba una tarjeta sin campo
 * antes de que existiera el repaso general.
 */
export function toCardRow(
  deckId: string,
  card: CardDraft,
  position: number,
): CardRow {
  return {
    deck_id: deckId,
    kind: card.kind ?? "word",
    term: card.term.trim(),
    meaning_es: card.meaningEs.trim(),
    example_en: textOrNull(card.exampleEn),
    example_es: textOrNull(card.exampleEs),
    usage_note: textOrNull(card.usageNote),
    tags: card.tags ?? [],
    position,
  };
}

/** Las filas de todas las tarjetas de una vez, ya numeradas desde 1. */
export function toCardRows(deckId: string, cards: CardDraft[]): CardRow[] {
  return cards.map((card, index) => toCardRow(deckId, card, index + 1));
}
