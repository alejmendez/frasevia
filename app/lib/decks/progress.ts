import type { SupabaseClient } from "@supabase/supabase-js";
import type { CardProgress, ProgressDetail } from "../types";

/**
 * Consultas de progreso: lo que se sabe de las tarjetas ya estudiadas.
 *
 * No hablan de mazos sino de `user_card_progress` y de una vista que ya los
 * junta. Estaban en `read.ts`, junto al catálogo y a la biblioteca, y ahí se
 * leía como si el progreso fuera parte del mazo: no lo es, es de la persona que
 * lo estudió, y por eso tiene su propio módulo.
 */

/** El progreso de unas tarjetas concretas, para pintar la cara de cada una. */
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

/** El historial de todo lo estudiado, para la pantalla de progreso. */
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
