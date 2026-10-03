import type { SupabaseClient } from "@supabase/supabase-js";
import type { CardReviewState, DeckReviewSummary, ReviewLevel } from "./types";

const REVIEW_LEVEL_COLUMNS =
  "id, user_id, system_key, name, action, interval_amount, interval_unit, position, color, active, created_at, updated_at";
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

export async function listDeckReviewSummaries(
  supabase: SupabaseClient,
  deckIds: string[],
): Promise<{ summaries: DeckReviewSummary[]; error: string | null }> {
  if (deckIds.length === 0) return { summaries: [], error: null };

  const { data, error } = await supabase
    .from("my_deck_review_summary")
    .select(
      "deck_id, new_count, due_count, scheduled_count, retired_count, next_review_at, last_reviewed_at",
    )
    .in("deck_id", deckIds);

  return {
    summaries: (data ?? []) as DeckReviewSummary[],
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

export async function listPendingReviewCards(
  supabase: SupabaseClient,
): Promise<{ cards: PendingReviewCard[]; error: string | null }> {
  const { data, error } = await supabase
    .from("my_review_queue")
    .select("*")
    .order("next_review_at", { ascending: true });
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
    .order("next_review_at", { ascending: true });
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
    .order("last_reviewed_at", { ascending: false });

  return {
    cards: (data ?? []) as RetiredReviewCard[],
    error: error?.message ?? null,
  };
}
