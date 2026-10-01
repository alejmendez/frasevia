import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  Card,
  CardProgress,
  Deck,
  DeckProgressSummary,
  ProgressDetail,
} from "./types";

/**
 * Consultas de la biblioteca privada y del progreso.
 *
 * Todas pasan por el cliente del navegador porque dependen de la sesión. La
 * seguridad no está aquí: RLS filtra cada fila en la base de datos, así que
 * aunque alguien cambiara estas consultas no vería datos ajenos.
 */

const DECK_COLUMNS =
  "id, author_id, title, slug, description, source_language, target_language, level, visibility, is_official, source_deck_id, card_count, created_at, updated_at";

const CARD_COLUMNS =
  "id, deck_id, kind, term, meaning_es, example_en, example_es, usage_note, tags, position, created_at, updated_at";

export interface LibraryDeck extends Deck {
  progress: DeckProgressSummary | null;
}

export async function listMyDecks(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ decks: LibraryDeck[]; error: string | null }> {
  const [decksResult, progressResult] = await Promise.all([
    supabase
      .from("decks")
      .select(DECK_COLUMNS)
      .eq("author_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("my_deck_progress")
      .select(
        "deck_id, new_count, learning_count, mastered_count, studied_count, last_studied_at",
      ),
  ]);

  if (decksResult.error) {
    return { decks: [], error: decksResult.error.message };
  }

  if (progressResult.error) {
    return { decks: [], error: progressResult.error.message };
  }

  const progressByDeck = new Map<string, DeckProgressSummary>();
  for (const row of progressResult.data ?? []) {
    progressByDeck.set(row.deck_id as string, row as DeckProgressSummary);
  }

  return {
    decks: (decksResult.data ?? []).map((row) => {
      const deck = row as Deck;
      return { ...deck, progress: progressByDeck.get(deck.id) ?? null };
    }),
    error: null,
  };
}

export async function getMyDeck(
  supabase: SupabaseClient,
  deckId: string,
): Promise<{ deck: Deck | null; cards: Card[]; error: string | null }> {
  const { data: deckData, error: deckError } = await supabase
    .from("decks")
    .select(DECK_COLUMNS)
    .eq("id", deckId)
    .maybeSingle();

  if (deckError) {
    return { deck: null, cards: [], error: deckError.message };
  }

  // RLS hace que un mazo ajeno o inexistente se comporte igual que uno propio
  // que no existe: no se distingue nada desde fuera.
  if (!deckData) {
    return { deck: null, cards: [], error: null };
  }

  const { data: cardData, error: cardError } = await supabase
    .from("cards")
    .select(CARD_COLUMNS)
    .eq("deck_id", deckId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (cardError) {
    return { deck: null, cards: [], error: cardError.message };
  }

  return {
    deck: deckData as Deck,
    cards: (cardData ?? []) as Card[],
    error: null,
  };
}

export async function getProgressForCards(
  supabase: SupabaseClient,
  cardIds: string[],
): Promise<{ progress: CardProgress[]; error: string | null }> {
  if (cardIds.length === 0) {
    return { progress: [], error: null };
  }

  const { data, error } = await supabase
    .from("user_card_progress")
    .select("card_id, state, attempts, correct_count, last_studied_at")
    .in("card_id", cardIds);

  if (error) {
    return { progress: [], error: error.message };
  }

  return { progress: (data ?? []) as CardProgress[], error: null };
}

export async function listMyProgress(
  supabase: SupabaseClient,
): Promise<{ rows: ProgressDetail[]; error: string | null }> {
  const { data, error } = await supabase
    .from("my_progress_detail")
    .select(
      "card_id, state, attempts, correct_count, last_studied_at, updated_at, term, meaning_es, deck_id, deck_title, deck_slug",
    )
    .order("last_studied_at", { ascending: false })
    .limit(200);

  if (error) {
    return { rows: [], error: error.message };
  }

  return { rows: (data ?? []) as ProgressDetail[], error: null };
}
