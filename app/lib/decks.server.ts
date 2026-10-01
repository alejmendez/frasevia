import { getSupabaseServer } from "./supabase.server";
import type { Card, Deck } from "./types";

/**
 * Consultas de solo lectura para las páginas públicas.
 *
 * Van en el `loader` del servidor con la clave publicable: las políticas RLS
 * permiten leer mazos públicos y oficiales, así que no hace falta ninguna sesión.
 * Este módulo es exclusivo del servidor.
 */

const DECK_CARD_COLUMNS =
  "id, deck_id, kind, term, meaning_es, example_en, example_es, usage_note, tags, position, created_at, updated_at";

export interface PublicDeck extends Deck {
  author_name: string | null;
}

export async function listPublicDecks(options?: {
  search?: string;
  limit?: number;
}): Promise<{ decks: PublicDeck[]; error: string | null }> {
  const supabase = getSupabaseServer();

  if (!supabase) {
    return { decks: [], error: "unconfigured" };
  }

  let query = supabase
    .from("decks")
    .select(
      "id, author_id, title, slug, description, source_language, target_language, level, visibility, is_official, source_deck_id, card_count, created_at, updated_at",
    )
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

  // `auth.users` no es consultable desde el cliente público, así que los mazos
  // oficiales se muestran como contenido del equipo, sin autor personal.
  return {
    decks: (data ?? []).map((deck) => ({
      ...(deck as Deck),
      author_name: (deck as Deck).is_official ? "Equipo Frasevia" : null,
    })),
    error: null,
  };
}

export async function getPublicDeckBySlug(slug: string): Promise<{
  deck: PublicDeck | null;
  cards: Card[];
  error: string | null;
  status: "ok" | "not-found" | "unconfigured" | "error";
}> {
  const supabase = getSupabaseServer();

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
    .select(
      "id, author_id, title, slug, description, source_language, target_language, level, visibility, is_official, source_deck_id, card_count, created_at, updated_at",
    )
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

  const deck: PublicDeck = {
    ...(deckData as Deck),
    author_name: (deckData as Deck).is_official ? "Equipo Frasevia" : null,
  };

  const { data: cardData, error: cardError } = await supabase
    .from("cards")
    .select(DECK_CARD_COLUMNS)
    .eq("deck_id", deck.id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(60);

  if (cardError) {
    return { deck: null, cards: [], error: cardError.message, status: "error" };
  }

  return { deck, cards: (cardData ?? []) as Card[], error: null, status: "ok" };
}
