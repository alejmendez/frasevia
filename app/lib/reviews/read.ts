import type { SupabaseClient } from "@supabase/supabase-js";
import type { CardReviewState, DeckStudyMode, ReviewLevel } from "../types";
import { REVIEW_LEVEL_COLUMNS } from "./write";

/**
 * Lecturas de repaso: niveles, estado por ficha, cola pendiente y calendario.
 *
 * Todo lo que se pregunta vive aquí y todo lo que se cambia en `write.ts`. La
 * lista de columnas de un nivel se comparte entre los dos: si leer y escribir
 * vieran columnas distintas, la pantalla mostraría una cosa y guardaría otra, y
 * eso no da ningún error.
 */

const REVIEW_STATE_COLUMNS =
  "card_id, direction, last_reviewed_at, next_review_at, retired, last_level_id, review_count, updated_at";

export async function listReviewLevels(
  supabase: SupabaseClient,
): Promise<{ levels: ReviewLevel[]; error: string | null }> {
  const { data, error } = await supabase
    .from("review_levels")
    .select(REVIEW_LEVEL_COLUMNS)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  return {
    levels: (data ?? []) as ReviewLevel[],
    error: error?.message ?? null,
  };
}

export async function listCardReviewStates(
  supabase: SupabaseClient,
  cardIds: string[],
  direction: string,
): Promise<{ states: CardReviewState[]; error: string | null }> {
  if (cardIds.length === 0) return { states: [], error: null };

  const { data, error } = await supabase
    .from("user_card_review_state")
    .select(REVIEW_STATE_COLUMNS)
    .in("card_id", cardIds)
    .eq("direction", direction);

  return {
    states: (data ?? []) as CardReviewState[],
    error: error?.message ?? null,
  };
}

export interface RetiredReviewCard {
  card_id: string;
  direction: string;
  last_reviewed_at: string;
  review_count: number;
  term: string;
  meaning_es: string;
  deck_id: string;
  deck_title: string;
  deck_slug: string;
  deck_visibility: "private" | "public";
}

export interface PendingReviewCard {
  card_id: string;
  direction: string;
  last_reviewed_at: string;
  next_review_at: string;
  review_count: number;
  last_level_id: string | null;
  deck_id: string;
  kind: string;
  term: string;
  meaning_es: string;
  example_en: string | null;
  example_es: string | null;
  usage_note: string | null;
  deck_title: string;
  study_mode: DeckStudyMode;
  source_language: string;
  target_language: string;
}

export interface ScheduledReviewDate {
  card_id: string;
  direction: string;
  next_review_at: string;
  deck_id: string;
  deck_title: string;
}

/**
 * Cuántas tarjetas caben en una tanda de repaso.
 *
 * La sesión enseña una ficha a la vez, así que bajar la cola entera solo servía
 * para gastar ancho de banda en fichas que no se van a ver. El tope deja la
 * pantalla de repaso siempre igual de rápida por muchas que haya pendientes.
 */
const REVIEW_QUEUE_LIMIT = 200;

/** Cuántas fechas futuras se piden para el resumen de la biblioteca. */
const REVIEW_SCHEDULE_LIMIT = 200;

/** Cuántas tarjetas retiradas se muestran en los ajustes de repaso. */
const RETIRED_CARDS_LIMIT = 100;

const PENDING_REVIEW_COLUMNS =
  "card_id, direction, last_reviewed_at, next_review_at, review_count, last_level_id, deck_id, kind, term, meaning_es, example_en, example_es, usage_note, deck_title, study_mode, source_language, target_language";

export async function listPendingReviewCards(
  supabase: SupabaseClient,
): Promise<{ cards: PendingReviewCard[]; error: string | null }> {
  const { data, error } = await supabase
    .from("my_review_queue")
    .select(PENDING_REVIEW_COLUMNS)
    .order("next_review_at", { ascending: true })
    .limit(REVIEW_QUEUE_LIMIT);
  return {
    cards: (data ?? []) as PendingReviewCard[],
    error: error?.message ?? null,
  };
}

export async function countPendingReviewCards(
  supabase: SupabaseClient,
): Promise<{ count: number; error: string | null }> {
  const { count, error } = await supabase
    .from("my_review_queue")
    .select("card_id", { count: "exact", head: true });
  return { count: count ?? 0, error: error?.message ?? null };
}

export async function listScheduledReviewDates(
  supabase: SupabaseClient,
): Promise<{ dates: ScheduledReviewDate[]; error: string | null }> {
  const { data, error } = await supabase
    .from("my_review_schedule")
    .select("card_id, direction, next_review_at, deck_id, deck_title")
    .order("next_review_at", { ascending: true })
    .limit(REVIEW_SCHEDULE_LIMIT);
  return {
    dates: (data ?? []) as ScheduledReviewDate[],
    error: error?.message ?? null,
  };
}

export async function listRetiredReviewCards(
  supabase: SupabaseClient,
): Promise<{ cards: RetiredReviewCard[]; error: string | null }> {
  const { data, error } = await supabase
    .from("my_retired_review_cards")
    .select(
      "card_id, direction, last_reviewed_at, review_count, term, meaning_es, deck_id, deck_title, deck_slug, deck_visibility",
    )
    .order("last_reviewed_at", { ascending: false })
    .limit(RETIRED_CARDS_LIMIT);

  return {
    cards: (data ?? []) as RetiredReviewCard[],
    error: error?.message ?? null,
  };
}
