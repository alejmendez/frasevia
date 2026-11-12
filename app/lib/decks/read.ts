import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Card,
  Deck,
  DeckProgressSummary,
  DeckReviewSummary,
  DeckStudyMode,
} from "../types";
import { CARD_COLUMNS, DECK_COLUMNS } from "./rows";

/**
 * Lecturas de la biblioteca: los mazos que son de quien pregunta.
 *
 * Todas pasan por el cliente del navegador. La seguridad no está aquí: RLS
 * filtra cada fila en la base de datos, así que aunque alguien cambiara estas
 * consultas no vería datos ajenos.
 *
 * Hay dos convenciones y conviene saber cuál es cuál, porque se ven distintas:
 *
 * - Las del **catálogo público** (`catalog.ts`) se llaman solas y se apoyan en
 *   el cliente del navegador. Sin sesión no hay nada que pasar.
 * - Las de **lo que es tuyo** reciben `supabase` y `userId` de la sesión que ya
 *   tienen, para que quede explícito de quién son los datos que se piden.
 *
 * Un mazo en la papelera sale de la biblioteca, y también del resto de la
 * aplicación: el filtro de `deleted_at` está en cada consulta de esta página
 * porque `decks_select_visible` deja ver al dueño sus propios mazos borrados
 * —es lo que permite la papelera— y ese permiso no puede ser el filtro.
 */

export interface LibraryDeck extends Deck {
  progress: DeckProgressSummary | null;
  review: DeckReviewSummary | null;
}

/** Mazo propio compatible con tarjetas de vocabulario español–inglés. */
export interface QuickAddDeck {
  id: string;
  title: string;
  study_mode: DeckStudyMode;
  source_language: string;
  target_language: string;
}

export async function listMyDecks(
  supabase: SupabaseClient,
  userId: string,
): Promise<{
  decks: LibraryDeck[];
  error: string | null;
  deckError: string | null;
  reviewError: string | null;
}> {
  const [decksResult, progressResult, reviewResult] = await Promise.all([
    supabase
      .from("decks")
      .select(DECK_COLUMNS)
      .eq("author_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("my_deck_progress")
      .select(
        "deck_id, new_count, learning_count, mastered_count, studied_count, last_studied_at",
      ),
    supabase
      .from("my_deck_review_summary")
      .select(
        "deck_id, new_count, due_count, scheduled_count, retired_count, next_review_at, last_reviewed_at",
      ),
  ]);

  if (decksResult.error) {
    return {
      decks: [],
      error: decksResult.error.message,
      deckError: decksResult.error.message,
      reviewError: null,
    };
  }

  const progressByDeck = new Map<string, DeckProgressSummary>();
  for (const row of progressResult.data ?? []) {
    progressByDeck.set(row.deck_id as string, row as DeckProgressSummary);
  }
  const reviewByDeck = new Map<string, DeckReviewSummary>();
  for (const row of reviewResult.data ?? []) {
    reviewByDeck.set(row.deck_id as string, row as DeckReviewSummary);
  }

  return {
    decks: (decksResult.data ?? []).map((row) => {
      const deck = row as Deck;
      return {
        ...deck,
        progress: progressByDeck.get(deck.id) ?? null,
        review: reviewResult.error ? null : (reviewByDeck.get(deck.id) ?? null),
      };
    }),
    error: progressResult.error?.message ?? reviewResult.error?.message ?? null,
    deckError: null,
    reviewError: reviewResult.error?.message ?? null,
  };
}

/**
 * Los mazos que están en la papelera.
 *
 * Solo los del dueño, que es la misma regla que aplica la base: una fila ajena
 * no se puede ni mandar a la papelera ni restaurar. Se ordenan por fecha de
 * borrado para que el más reciente sea el primero, que es el que casi siempre
 * se quiere deshacer.
 */
export async function listMyTrashedDecks(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ decks: Deck[]; error: string | null }> {
  const { data, error } = await supabase
    .from("decks")
    .select(DECK_COLUMNS)
    .eq("author_id", userId)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  if (error) {
    return { decks: [], error: error.message };
  }

  return { decks: (data ?? []) as Deck[], error: null };
}

/**
 * Mazos propios a los que se puede añadir desde el menú rápido.
 *
 * La tarjeta conserva el término en inglés y el significado en español, así
 * que solo se ofrecen mazos que usan exactamente ese par de idiomas.
 */
export async function listMyQuickAddDecks(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ decks: QuickAddDeck[]; error: string | null }> {
  const { data, error } = await supabase
    .from("decks")
    .select("id, title, study_mode, source_language, target_language")
    .eq("author_id", userId)
    .is("deleted_at", null)
    .eq("study_mode", "language")
    // El par de idiomas se filtra en la base y no en JavaScript: es una
    // condición sobre dos columnas, y bajarla entera para descartar filas aquí
    // es trabajo que no hacía falta hacer en el cliente.
    .or(
      "and(source_language.eq.en,target_language.eq.es),and(source_language.eq.es,target_language.eq.en)",
    )
    .order("title", { ascending: true });

  if (error) {
    return { decks: [], error: error.message };
  }

  return { decks: (data ?? []) as QuickAddDeck[], error: null };
}

/**
 * Un mazo y sus tarjetas.
 *
 * Por defecto devuelve el mazo si la base deja verlo, y eso incluye los mazos
 * públicos de otra persona, que se pueden estudiar sin copiarlos. Quien
 * necesita que sea suyo de verdad —el editor— pasa `ownerId`, y la pregunta
 * por el dueño baja a la consulta: un mazo ajeno se comporta como uno que no
 * existe, y así no se puede abrir en el editor para guardarlo.
 */
export async function getMyDeck(
  supabase: SupabaseClient,
  deckId: string,
  ownerId?: string,
): Promise<{ deck: Deck | null; cards: Card[]; error: string | null }> {
  let deckQuery = supabase
    .from("decks")
    .select(DECK_COLUMNS)
    .eq("id", deckId)
    .is("deleted_at", null);

  if (ownerId) {
    deckQuery = deckQuery.eq("author_id", ownerId);
  }

  const [deckResult, cardsResult] = await Promise.all([
    deckQuery.maybeSingle(),
    supabase
      .from("cards")
      .select(CARD_COLUMNS)
      .eq("deck_id", deckId)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  if (deckResult.error) {
    return { deck: null, cards: [], error: deckResult.error.message };
  }

  // RLS hace que un mazo ajeno o inexistente se comporte igual que uno propio
  // que no existe: no se distingue nada desde fuera.
  if (!deckResult.data) {
    return { deck: null, cards: [], error: null };
  }

  if (cardsResult.error) {
    return { deck: null, cards: [], error: cardsResult.error.message };
  }

  return {
    deck: deckResult.data as Deck,
    cards: (cardsResult.data ?? []) as Card[],
    error: null,
  };
}
