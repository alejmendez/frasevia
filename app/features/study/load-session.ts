import type { SupabaseClient } from "@supabase/supabase-js";
import { data } from "react-router";

import { getMyDeck } from "~/lib/decks";
import { t } from "~/lib/locale";
import {
  listCardReviewStates,
  listPendingReviewCards,
  listReviewLevels,
} from "~/lib/reviews";
import type {
  CardReviewState,
  Deck,
  ReviewLevel,
  StudyCard,
} from "~/lib/types";
import { toDeckCards, toQueueCards, toReviewStates } from "./cards";
import { reviewDirection } from "./schedule";

/**
 * Lo que necesita la pantalla de repaso para pintarse.
 *
 * Es lo mismo en los dos casos —con mazo o sin mazo— y solo cambia de dónde salen
 * las fichas: de un mazo concreto o de la cola global. Por eso se devuelve siempre
 * la misma forma y la ruta no tiene dos ramas que montar.
 *
 * No trae el progreso por tarjeta (`user_card_progress`): era para el contador de
 * aciertos de las prácticas alternativas, que ya no están. Pedirlo aquí era una
 * consulta de más en cada carga de la pantalla.
 */
export interface StudySessionData {
  deck: Deck | null;
  cards: StudyCard[];
  reviewStates: CardReviewState[];
  reviewLevels: ReviewLevel[];
  /** La dirección de repaso, o `null` si cada ficha trae la suya. */
  direction: string | null;
}

/**
 * La cola global: todo lo que está vencido, de todos los mazos.
 *
 * También entra lo que se estudió en un mazo público sin copiarlo: si se estudió
 * una ficha ahí, esa ficha ya es de la persona y le toca repasar.
 * una ficha ahí, ya es de la persona y le toca repasar. Por eso la cola viene de
 * una vista y no de los mazos.
 */
export async function loadGlobalQueue(
  supabase: SupabaseClient,
): Promise<StudySessionData> {
  const [queueResult, levelsResult] = await Promise.all([
    listPendingReviewCards(supabase),
    listReviewLevels(supabase),
  ]);

  if (queueResult.error || levelsResult.error) {
    throw data(
      { message: queueResult.error ?? levelsResult.error ?? "" },
      { status: 500 },
    );
  }

  return {
    deck: null,
    cards: toQueueCards(queueResult.cards),
    reviewStates: toReviewStates(queueResult.cards),
    reviewLevels: levelsResult.levels,
    direction: null,
  };
}

/** Una sesión de un mazo concreto: sus tarjetas y su cola de repaso. */
export async function loadDeckSession(
  supabase: SupabaseClient,
  deckId: string,
): Promise<StudySessionData> {
  const { deck, cards, error } = await getMyDeck(supabase, deckId);

  if (error) {
    throw data({ message: error }, { status: 500 });
  }

  // RLS hace que un mazo ajeno se comporte como uno que no existe, así que aquí
  // no se distingue: sale el mismo mensaje para los dos casos.
  if (!deck) {
    throw data({ message: t("estudiar.deckNotFound") }, { status: 404 });
  }

  // La dirección se calcula una vez para todo el mazo y se le pone a cada tarjeta,
  // que es lo que hace que dos tarjetas del mismo mazo se repitan en la misma
  // dirección en vez de alternar.
  const direction = reviewDirection(
    deck.source_language,
    deck.target_language,
    deck.study_mode,
  );

  const cardIds = cards.map((card) => card.id);
  const [reviewResult, levelsResult] = await Promise.all([
    listCardReviewStates(supabase, cardIds, direction),
    listReviewLevels(supabase),
  ]);

  if (reviewResult.error || levelsResult.error) {
    throw data(
      { message: reviewResult.error ?? levelsResult.error ?? "" },
      { status: 500 },
    );
  }

  return {
    deck,
    cards: toDeckCards(cards, deck, direction),
    reviewStates: reviewResult.states,
    reviewLevels: levelsResult.levels,
    direction,
  };
}
