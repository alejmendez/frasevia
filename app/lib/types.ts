/**
 * Tipos del dominio de Frasevia.
 *
 * Reflejan 1:1 el esquema en `supabase/migrations`. El modelo guarda el par de
 * idiomas en cada mazo, así que más adelante se pueden agregar otros pares sin
 * cambiar las tablas.
 */

export type DeckVisibility = "private" | "public";
export type CardKind = "word" | "phrase" | "question" | "rule";
export type ProgressState = "new" | "learning" | "mastered";

/** Aciertos necesarios para considerar una tarjeta aprendida. */
export const MASTERY_CORRECT_COUNT = 2;

export interface Deck {
  id: string;
  author_id: string | null;
  title: string;
  slug: string;
  description: string;
  source_language: string;
  target_language: string;
  level: string | null;
  visibility: DeckVisibility;
  is_official: boolean;
  source_deck_id: string | null;
  card_count: number;
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: string;
  deck_id: string;
  kind: CardKind;
  term: string;
  meaning_es: string;
  example_en: string | null;
  example_es: string | null;
  usage_note: string | null;
  tags: string[];
  position: number;
  created_at: string;
  updated_at: string;
}

/** Versión de `Card` que necesita el motor de estudio (sin metadatos internos). */
export interface StudyCard {
  id: string;
  term: string;
  meaningEs: string;
  exampleEn: string | null;
  exampleEs: string | null;
  usageNote: string | null;
}

export interface CardProgress {
  card_id: string;
  state: ProgressState;
  attempts: number;
  correct_count: number;
  last_studied_at: string | null;
}

/** Resumen de progreso por mazo (vista `my_deck_progress`). */
export interface DeckProgressSummary {
  deck_id: string;
  new_count: number;
  learning_count: number;
  mastered_count: number;
  studied_count: number;
  last_studied_at: string | null;
}

/** Fila de detalle para la página de progreso (vista `my_progress_detail`). */
export interface ProgressDetail {
  card_id: string;
  state: ProgressState;
  attempts: number;
  correct_count: number;
  last_studied_at: string | null;
  updated_at: string;
  term: string;
  meaning_es: string;
  deck_id: string;
  deck_title: string;
  deck_slug: string;
}

export interface AuthUser {
  id: string;
  email: string | null;
}

/** Traduce una fila de `cards` al formato que consume el motor de estudio. */
export function toStudyCard(card: Card): StudyCard {
  return {
    id: card.id,
    term: card.term,
    meaningEs: card.meaning_es,
    exampleEn: card.example_en,
    exampleEs: card.example_es,
    usageNote: card.usage_note,
  };
}
