import type { SupabaseClient } from "@supabase/supabase-js";

import type { CardDraft, DeckBrief } from "./rows";
import { CARD_EDITABLE_FIELDS, toCardRow, toCardRows, toDeckRow } from "./rows";

/**
 * Escrituras de mazos y tarjetas.
 *
 * Estaban escritas dentro de las pantallas, con Supabase a la vista. Eso dejaba
 * la parte delicada —crear un mazo con sus tarjetas sin dejar medias cosas— en
 * tres archivos distintos, y el patrón de deshacer se copió tal cual: si fallaba
 * el insert de tarjetas, se borraba el mazo a mano. Aquí vive una vez, y quien
 * llama solo tiene que decir qué es una tarjeta y qué un mazo.
 *
 * La seguridad no cambia: RLS sigue decidiendo y `decks.author_id` sigue siendo
 * el que impide escribir en el mazo de otra persona.
 */

export type DeckWriteResult =
  | { ok: true; deckId: string }
  | { ok: false; stage: "deck"; message: string }
  | { ok: false; stage: "cards"; message: string };

/**
 * Crea un mazo y devuelve su identificador.
 *
 * `stage` dice qué parte falló para que la pantalla pueda explicarlo en su
 * idioma: el mensaje de la base no le dice a nadie qué hacer con un mazo a medio
 * crear.
 */
export async function createDeck(
  supabase: SupabaseClient,
  authorId: string,
  brief: DeckBrief,
): Promise<DeckWriteResult> {
  const { data, error } = await supabase
    .from("decks")
    .insert(toDeckRow(authorId, brief))
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, stage: "deck", message: error?.message ?? "" };
  }

  return { ok: true, deckId: (data as { id: string }).id };
}

/**
 * Crea un mazo con todas sus tarjetas, o nada.
 *
 * El mazo va primero porque es lo que las tarjetas referencian; si las tarjetas
 * fallan, el mazo se borra. No es una transacción y no pretende serlo: el fallo no
 * es «una tarjeta», es «el mazo entero», y media fila guardada no le sirve de
 * nada a quien está usando la aplicación.
 *
 * Quien llama pasa tarjetas a medio hacer, no filas: el identificador del mazo
 * solo existe después del primer insert, y es cosa de esta función y no de la
 * pantalla saber cuál es.
 */
export async function createDeckWithCards(
  supabase: SupabaseClient,
  authorId: string,
  brief: DeckBrief,
  cards: CardDraft[],
): Promise<DeckWriteResult> {
  const created = await createDeck(supabase, authorId, brief);

  if (!created.ok) {
    return created;
  }

  const rows = toCardRows(created.deckId, cards);

  if (rows.length === 0) {
    return created;
  }

  const { error } = await supabase.from("cards").insert(rows);

  if (error) {
    await discardDeck(supabase, created.deckId);
    return { ok: false, stage: "cards", message: error.message };
  }

  return created;
}

/**
 * Deshace un mazo recién creado.
 *
 * Las tarjetas caen en cascada, así que con borrar el mazo basta. Los errores se
 * ignoran a propósito: se está limpiando después de un fallo, y si la limpieza
 * también falla no hay nada mejor que hacer que seguir con el error que ya se
 * está contando.
 */
export async function discardDeck(
  supabase: SupabaseClient,
  deckId: string,
): Promise<void> {
  await supabase.from("decks").delete().eq("id", deckId);
}

/** La posición que tendrá la siguiente tarjeta del mazo. */
export async function nextCardPosition(
  supabase: SupabaseClient,
  deckId: string,
): Promise<{ position: number; error: string | null }> {
  const { data, error } = await supabase
    .from("cards")
    .select("position")
    .eq("deck_id", deckId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { position: 1, error: error.message };
  }

  const last = (data as { position?: number } | null)?.position ?? 0;
  return { position: last + 1, error: null };
}

/** Inserta una tarjeta al final del mazo. */
export async function appendCard(
  supabase: SupabaseClient,
  deckId: string,
  card: Parameters<typeof toCardRow>[1],
): Promise<{ error: string | null }> {
  const { position, error } = await nextCardPosition(supabase, deckId);

  if (error) {
    return { error };
  }

  const { error: insertError } = await supabase
    .from("cards")
    .insert(toCardRow(deckId, card, position));

  return { error: insertError?.message ?? null };
}

/** Borra una tarjeta. El `deck_id` extra es la guarda de que sea de este mazo. */
export async function deleteCard(
  supabase: SupabaseClient,
  deckId: string,
  cardId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("cards")
    .delete()
    .eq("id", cardId)
    .eq("deck_id", deckId);

  return { error: error?.message ?? null };
}

/** Borra un mazo entero. Las tarjetas y el progreso caen en cascada. */
export async function deleteDeck(
  supabase: SupabaseClient,
  deckId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("decks").delete().eq("id", deckId);
  return { error: error?.message ?? null };
}

/** Actualiza los datos de un mazo. El dueño no cambia nunca. */
export async function updateDeck(
  supabase: SupabaseClient,
  deckId: string,
  authorId: string,
  brief: DeckBrief,
): Promise<{ error: string | null }> {
  const row = toDeckRow(authorId, brief);
  const { author_id, ...changes } = row;
  void author_id;

  const { error } = await supabase
    .from("decks")
    .update(changes)
    .eq("id", deckId);

  return { error: error?.message ?? null };
}

/** Una tarjeta con la forma que espera el RPC `update_deck_cards`. */
export type CardEdit = {
  kind: string;
  term: string;
  meaning_es: string;
  example_en: string | null;
  example_es: string | null;
  usage_note: string | null;
  tags: string[];
};

/**
 * Guarda muchas tarjetas de un solo envío.
 *
 * Un viaje para todas, en vez de uno por tarjeta. Además de la latencia, esto
 * evita el guardado a medias: antes, si una petición fallaba las demás ya
 * estaban escritas y el mazo quedaba en un estado que nadie había pedido.
 *
 * El RPC comprueba de una vez que el mazo sea editable y que cada tarjeta
 * pertenezca a él; aquí solo se manda lo que traía el formulario.
 */
export async function updateDeckCards(
  supabase: SupabaseClient,
  deckId: string,
  cards: Record<string, CardEdit>,
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc("update_deck_cards", {
    p_deck_id: deckId,
    p_cards: Object.entries(cards).map(([cardId, card]) => ({
      card_id: cardId,
      // Se listan los campos uno a uno, no el objeto entero: la forma del RPC no
      // tiene por qué depender de lo que el formulario traiga de más.
      ...pickEditable(card),
    })),
  });

  return { error: error?.message ?? null };
}

function pickEditable(card: CardEdit): Record<string, unknown> {
  const picked: Record<string, unknown> = {};
  for (const field of CARD_EDITABLE_FIELDS) {
    picked[field] = card[field];
  }
  return picked;
}
