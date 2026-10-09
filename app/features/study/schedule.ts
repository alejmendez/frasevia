import type {
  CardReviewState,
  DeckStudyMode,
  ReviewStatus,
  StudyCard,
} from "~/lib/types";

export function reviewDirection(
  source: string,
  target: string,
  mode: DeckStudyMode = "language",
): string {
  return mode === "general" ? "general" : `${source}-${target}`;
}

export function orientReviewCard(card: StudyCard, direction: string) {
  if (card.studyMode === "general" || direction === "general") {
    return {
      sourceLanguage: card.sourceLanguage ?? "es",
      targetLanguage: card.sourceLanguage ?? "es",
      sourceText: card.term,
      targetText: card.meaningEs,
    };
  }
  const [directionSource = "en", directionTarget = "es"] = direction.split("-");
  const cardSource = card.sourceLanguage ?? directionSource;
  const cardTarget = card.targetLanguage ?? directionTarget;
  const reversed = direction === `${cardTarget}-${cardSource}`;

  return {
    sourceLanguage: reversed ? cardTarget : cardSource,
    targetLanguage: reversed ? cardSource : cardTarget,
    sourceText: reversed ? card.meaningEs : card.term,
    targetText: reversed ? card.term : card.meaningEs,
  };
}

export function reviewStatus(
  state: CardReviewState | undefined,
  direction: string,
  now = Date.now(),
): ReviewStatus {
  if (!state || state.direction !== direction) return "new";
  if (state.retired) return "retired";
  if (!state.next_review_at) return "new";
  return Date.parse(state.next_review_at) <= now ? "due" : "scheduled";
}

/** Una ficha dentro de una sesión de repaso, con la dirección en que va. */
export interface ReviewSessionEntry<T> {
  card: T;
  status: "due" | "new";
  direction: string;
}

/** Lo mínimo que una tarjeta tiene que tener para entrar en una sesión. */
type Sessionable = { id: string; direction?: string };

/** Congela una sesión en el orden pendiente más antiguo y luego las nuevas. */
export function buildReviewSession<T extends Sessionable>(
  cards: T[],
  states: CardReviewState[],
  direction: string | null,
  now = Date.now(),
): ReviewSessionEntry<T>[] {
  const statesByKey = new Map(
    states.map((state) => [`${state.card_id}:${state.direction}`, state]),
  );
  const due: ReviewSessionEntry<T>[] = [];
  const fresh: ReviewSessionEntry<T>[] = [];

  for (const card of cards) {
    const cardDirection = direction ?? card.direction;
    if (!cardDirection) continue;
    const state = statesByKey.get(`${card.id}:${cardDirection}`);
    const status = reviewStatus(state, cardDirection, now);
    if (status === "due") due.push({ card, status, direction: cardDirection });
    if (status === "new")
      fresh.push({ card, status, direction: cardDirection });
  }

  due.sort((a, b) => {
    const aTime = Date.parse(
      statesByKey.get(`${a.card.id}:${a.direction}`)?.next_review_at ?? "",
    );
    const bTime = Date.parse(
      statesByKey.get(`${b.card.id}:${b.direction}`)?.next_review_at ?? "",
    );
    return aTime - bTime;
  });

  return [...due, ...fresh];
}

/** Una fila de la lista lateral: una ficha de la sesión, o una que se quedó fuera. */
export interface QueueRow<T> {
  card: T;
  direction: string;
  status: ReviewStatus;
  /** Dónde está en la sesión, o `null` si no es parte de ella. */
  sessionIndex: number | null;
}

/**
 * La lista lateral: lo que hay que repasar, no solo lo que se está repasando.
 *
 * En una sesión de mazo, la cola global tiene fichas de otros mazos y fichas ya
 * archivadas que no entran en la sesión pero que sí conviene tener a la vista. Por
 * eso las de fuera van detrás, con su estado y sin poder pulsarse.
 */
export function buildQueueList<T extends Sessionable>(
  cards: T[],
  items: ReviewSessionEntry<T>[],
  states: CardReviewState[],
  direction: string | null,
  now = Date.now(),
): QueueRow<T>[] {
  const inSession = new Set(
    items.map((entry) => `${entry.card.id}:${entry.direction}`),
  );

  const outsiders = cards.flatMap((card) => {
    const cardDirection = direction ?? card.direction;
    if (!cardDirection) return [];
    const key = `${card.id}:${cardDirection}`;
    if (inSession.has(key)) return [];

    const status = reviewStatus(stateOf(states, key), cardDirection, now);
    // Una ficha nueva que no entró en la sesión porque ya se estaba repasando en
    // otra parte no aparece: la lista es de lo que falta, no de todo lo que hay.
    if (status !== "scheduled" && status !== "retired") return [];

    return [{ card, direction: cardDirection, status, sessionIndex: null }];
  });

  return [
    ...items.map((entry, sessionIndex) => ({ ...entry, sessionIndex })),
    ...outsiders,
  ];
}

function stateOf(states: CardReviewState[], key: string) {
  return states.find((state) => `${state.card_id}:${state.direction}` === key);
}
