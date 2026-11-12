import { getSupabaseBrowser } from "../supabase";
import type { Card, Deck, DeckStudyMode } from "../types";
import { CARD_COLUMNS, DECK_COLUMNS } from "./rows";

/**
 * El catálogo público: los mazos que cualquiera puede leer y copiar.
 *
 * Estaba mezclado con la biblioteca en `read.ts`, y con eso las dos maneras de
 * leer mazos quedaron indistinguibles: una se llama sola —no necesita sesión— y
 * la otra recibe el cliente y el identificador de quien pregunta. Separarlas
 * deja a la vista que el catálogo no filtra por dueño y la biblioteca sí.
 *
 * Un mazo en la papelera sale del catálogo. El filtro va en la consulta y no
 * solo en la base: la base protege las filas, pero una pantalla que se olvidara
 * del filtro mostraría un mazo que su dueño ya borró.
 */

export interface PublicDeck extends Deck {
  author_name: string | null;
}

/**
 * Mazo del catálogo, con su autor visible.
 *
 * `auth.users` no es consultable desde el cliente, así que los mazos oficiales
 * se muestran como contenido del equipo, sin autor personal. El resto llega con
 * `author_name` en `null` y la interfaz decide si lo muestra.
 */
function toPublicDeck(deck: Deck): PublicDeck {
  return { ...deck, author_name: deck.is_official ? "Equipo Frasevia" : null };
}

export async function listPublicDecks(options?: {
  search?: string;
  limit?: number;
  studyMode?: DeckStudyMode;
}): Promise<{ decks: PublicDeck[]; error: string | null }> {
  const supabase = getSupabaseBrowser();

  if (!supabase) {
    return { decks: [], error: "unconfigured" };
  }

  let query = supabase
    .from("decks")
    .select(DECK_COLUMNS)
    .eq("visibility", "public")
    .is("deleted_at", null)
    .order("is_official", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 60);

  const search = options?.search?.trim();
  if (options?.studyMode) query = query.eq("study_mode", options.studyMode);
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
    .is("deleted_at", null)
    .maybeSingle();

  if (deckError) {
    return { deck: null, cards: [], error: deckError.message, status: "error" };
  }

  // RLS oculta los mazos privados: `maybeSingle` no los encuentra, así que un
  // mazo ajeno o inexistente se ve igual desde fuera. Lo mismo pasa con uno
  // que está en la papelera: para quien busca el enlace, no existe.
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
