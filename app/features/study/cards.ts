import type { CardReviewState, StudyCard } from "~/lib/types";
import { toStudyCard } from "~/lib/types";

/**
 * Convertir las filas de la cola y del mazo en tarjetas de estudio.
 *
 * El loader traía dos cosas distintas con dos formas distintas —una vista con
 * diecisiete columnas y una tabla con las de `decks`— y aquí es donde las dos se
 * vuelven lo mismo: una `StudyCard` con su dirección.
 *
 * Vive en `features/study/` porque es el motor de estudio, no la base: no sabe de
 * Supabase y se puede probar sin ella.
 */

/** Una fila de la cola global de repaso. */
export interface PendingReviewRow {
  card_id: string;
  direction: string;
  last_reviewed_at: string | null;
  next_review_at: string;
  review_count: number;
  last_level_id: string | null;
  term: string;
  meaning_es: string;
  example_en: string | null;
  example_es: string | null;
  usage_note: string | null;
  source_language: string;
  target_language: string;
  deck_title: string;
  study_mode: string;
}

/** La tarjeta y su estado de repaso, que van juntos en la cola. */
export interface ReviewQueueEntry {
  card: StudyCard;
  direction: string;
  status: "due" | "new" | "scheduled" | "retired";
  /** Dónde está en la sesión. `null` si la ficha no está en esta sesión. */
  sessionIndex: number | null;
}

/**
 * Las tarjetas de la cola global.
 *
 * La cola viene de una vista que ya trae `direction` calculado, así que no hay que
 * deducirlo del par de idiomas como en el caso del mazo.
 */
export function toQueueCards(rows: PendingReviewRow[]): StudyCard[] {
  return rows.map((row) => ({
    id: row.card_id,
    term: row.term,
    meaningEs: row.meaning_es,
    exampleEn: row.example_en,
    exampleEs: row.example_es,
    usageNote: row.usage_note,
    direction: row.direction,
    sourceLanguage: row.source_language,
    targetLanguage: row.target_language,
    deckTitle: row.deck_title,
    studyMode: row.study_mode as StudyCard["studyMode"],
  }));
}

/** El estado de repaso de cada ficha de la cola. */
export function toReviewStates(rows: PendingReviewRow[]): CardReviewState[] {
  return rows.map((row) => ({
    card_id: row.card_id,
    direction: row.direction,
    // La cola solo trae fichas que ya tienen historial, así que la fecha nunca
    // viene vacía; `last_reviewed_at` puede sí estar en `null` si el repaso se
    // creó sin fecha.
    last_reviewed_at: row.last_reviewed_at ?? row.next_review_at,
    next_review_at: row.next_review_at,
    retired: false,
    last_level_id: row.last_level_id,
    review_count: row.review_count,
    updated_at: row.last_reviewed_at ?? row.next_review_at,
  }));
}

/**
 * Las tarjetas de un mazo, con la dirección que le toca.
 *
 * `direction` viene calculado una vez para todo el mazo y se le pone a cada
 * tarjeta, que es lo que hace que dos tarjetas del mismo mazo se repitan en la
 * misma dirección en vez de alternar.
 */
export function toDeckCards(
  cards: Parameters<typeof toStudyCard>[0][],
  deck: {
    source_language: string;
    target_language: string;
    study_mode: string;
    title: string;
  },
  direction: string,
): StudyCard[] {
  return cards.map((card) => ({
    ...toStudyCard(
      card,
      deck.source_language,
      deck.target_language,
      deck.study_mode as StudyCard["studyMode"],
    ),
    direction,
    sourceLanguage: deck.source_language,
    targetLanguage: deck.target_language,
    deckTitle: deck.title,
  }));
}
