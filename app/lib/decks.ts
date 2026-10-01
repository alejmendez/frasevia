import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseBrowser } from "./supabase";
import type {
  Card,
  CardProgress,
  Deck,
  DeckProgressSummary,
  ProgressDetail,
} from "./types";

/**
 * Consultas a la base de datos.
 *
 * Todas pasan por el cliente del navegador. La seguridad no está aquí: RLS
 * filtra cada fila en la base de datos, así que aunque alguien cambiara estas
 * consultas no vería datos ajenos. Las públicas no necesitan sesión, pero viajan
 * por el mismo cliente para no mantener dos rutas de acceso a los mismos datos.
 */

const DECK_COLUMNS =
  "id, author_id, title, slug, description, source_language, target_language, level, visibility, is_official, source_deck_id, card_count, created_at, updated_at";

const CARD_COLUMNS =
  "id, deck_id, kind, term, meaning_es, example_en, example_es, usage_note, tags, position, created_at, updated_at";

export interface LibraryDeck extends Deck {
  progress: DeckProgressSummary | null;
}

export interface PublicDeck extends Deck {
  author_name: string | null;
}

/**
 * Mazo público del catálogo, con su autor visible.
 *
 * `auth.users` no es consultable desde el cliente, así que los mazos oficiales
 * se muestran como contenido del equipo, sin autor personal. El resto llega con
 * `author_name` en `null` y la interfaz decide si lo muestra.
 */
function toPublicDeck(deck: Deck): PublicDeck {
  return { ...deck, author_name: deck.is_official ? "Equipo Frasevia" : null };
}

// ---------------------------------------------------------------------------
// Catálogo público
// ---------------------------------------------------------------------------

export async function listPublicDecks(options?: {
  search?: string;
  limit?: number;
}): Promise<{ decks: PublicDeck[]; error: string | null }> {
  const supabase = getSupabaseBrowser();

  if (!supabase) {
    return { decks: [], error: "unconfigured" };
  }

  let query = supabase
    .from("decks")
    .select(DECK_COLUMNS)
    .eq("visibility", "public")
    .order("is_official", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 60);

  const search = options?.search?.trim();
  if (search) {
    // `or` con comodines cubre título y descripción en una sola pasada.
    const term = search.replace(/[%,()]/g, " ");
    query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
  }

  const { data, error } = await query;

  if (error) {
    return { decks: [], error: error.message };
  }

  return {
    decks: (data ?? []).map((deck) => toPublicDeck(deck as Deck)),
    error: null,
  };
}

export async function getPublicDeckBySlug(slug: string): Promise<{
  deck: PublicDeck | null;
  cards: Card[];
  error: string | null;
  status: "ok" | "not-found" | "unconfigured" | "error";
}> {
  const supabase = getSupabaseBrowser();

  if (!supabase) {
    return {
      deck: null,
      cards: [],
      error: "unconfigured",
      status: "unconfigured",
    };
  }

  const { data: deckData, error: deckError } = await supabase
    .from("decks")
    .select(DECK_COLUMNS)
    .eq("slug", slug)
    .eq("visibility", "public")
    .maybeSingle();

  if (deckError) {
    return { deck: null, cards: [], error: deckError.message, status: "error" };
  }

  // RLS oculta los mazos privados: `maybeSingle` no los encuentra, así que un
  // mazo ajeno o inexistente se ve igual desde fuera.
  if (!deckData) {
    return { deck: null, cards: [], error: null, status: "not-found" };
  }

  const deck = toPublicDeck(deckData as Deck);

  const { data: cardData, error: cardError } = await supabase
    .from("cards")
    .select(CARD_COLUMNS)
    .eq("deck_id", deck.id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(60);

  if (cardError) {
    return { deck: null, cards: [], error: cardError.message, status: "error" };
  }

  return { deck, cards: (cardData ?? []) as Card[], error: null, status: "ok" };
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
