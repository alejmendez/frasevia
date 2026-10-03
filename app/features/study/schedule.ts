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
export function buildReviewSession<T extends { id: string }>(
  cards: T[],
  states: CardReviewState[],
  direction: string,
  now = Date.now(),
): Array<{ card: T; status: "due" | "new" }> {
  const statesByCard = new Map(states.map((state) => [state.card_id, state]));
  const due: Array<{ card: T; status: "due" | "new" }> = [];
  const fresh: Array<{ card: T; status: "due" | "new" }> = [];

  for (const card of cards) {
    const state = statesByCard.get(card.id);
    const status = reviewStatus(state, direction, now);
    if (status === "due") due.push({ card, status });
    if (status === "new") fresh.push({ card, status });
  }

  due.sort((a, b) => {
    const aTime = Date.parse(statesByCard.get(a.card.id)?.next_review_at ?? "");
    const bTime = Date.parse(statesByCard.get(b.card.id)?.next_review_at ?? "");
    return aTime - bTime;
  });

  return [...due, ...fresh];
}
