import type { CardReviewState, ReviewStatus } from "~/lib/types";

export function reviewDirection(source: string, target: string): string {
  return `${source}-${target}`;
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

/** Congela una sesión en el orden pendiente más antiguo y luego las nuevas. */
export function buildReviewSession<
  T extends { id: string; direction?: string },
>(
  cards: T[],
  states: CardReviewState[],
  direction: string | null,
  now = Date.now(),
): Array<{ card: T; status: "due" | "new"; direction: string }> {
  const statesByKey = new Map(
    states.map((state) => [`${state.card_id}:${state.direction}`, state]),
  );
  const due: Array<{ card: T; status: "due" | "new"; direction: string }> = [];
  const fresh: Array<{ card: T; status: "due" | "new"; direction: string }> =
    [];

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
