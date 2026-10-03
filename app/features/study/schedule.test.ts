import { describe, expect, it } from "vitest";
import { type Card, type CardReviewState, toStudyCard } from "~/lib/types";
import { buildReviewSession, reviewDirection, reviewStatus } from "./schedule";

const now = Date.parse("2026-10-03T15:00:00.000Z");

function state(
  card_id: string,
  next_review_at: string | null,
  options: Partial<CardReviewState> = {},
): CardReviewState {
  return {
    card_id,
    direction: "es-en",
    last_reviewed_at: "2026-10-03T12:00:00.000Z",
    next_review_at,
    retired: false,
    last_level_id: null,
    review_count: 1,
    updated_at: "2026-10-03T12:00:00.000Z",
    ...options,
  };
}

describe("scheduled review state", () => {
  it("shows Spanish first for a Spanish to English deck", () => {
    const card: Card = {
      id: "a",
      deck_id: "deck",
      kind: "word",
      term: "base salary",
      meaning_es: "sueldo base",
      example_en: "What is the base salary for this role?",
      example_es: "¿Cuál es el sueldo base para este cargo?",
      usage_note: "Salario fijo, sin bonos.",
      tags: [],
      position: 0,
      created_at: "2026-10-03T12:00:00.000Z",
      updated_at: "2026-10-03T12:00:00.000Z",
    };

    expect(toStudyCard(card, "es", "en")).toMatchObject({
      term: "sueldo base",
      meaningEs: "base salary",
      exampleEn: "What is the base salary for this role?",
    });
  });

  it("keeps a card due at or before the current time", () => {
    expect(
      reviewStatus(state("a", "2026-10-03T14:59:59.000Z"), "es-en", now),
    ).toBe("due");
    expect(
      reviewStatus(state("b", "2026-10-03T15:00:00.000Z"), "es-en", now),
    ).toBe("due");
  });

  it("distinguishes new, future and retired cards", () => {
    expect(reviewStatus(undefined, "es-en", now)).toBe("new");
    expect(
      reviewStatus(state("a", "2026-10-03T15:00:01.000Z"), "es-en", now),
    ).toBe("scheduled");
    expect(
      reviewStatus(state("b", null, { retired: true }), "es-en", now),
    ).toBe("retired");
  });

  it("builds a stable session with oldest pending cards first and new cards after", () => {
    const cards = [
      { id: "new" },
      { id: "oldest" },
      { id: "future" },
      { id: "latest" },
      { id: "retired" },
    ];
    const states = [
      state("oldest", "2026-10-03T12:00:00.000Z"),
      state("latest", "2026-10-03T14:00:00.000Z"),
      state("future", "2026-10-04T12:00:00.000Z"),
      state("retired", null, { retired: true }),
    ];

    expect(
      buildReviewSession(cards, states, "es-en", now).map(
        ({ card, status }) => `${card.id}:${status}`,
      ),
    ).toEqual(["oldest:due", "latest:due", "new:new"]);
  });

  it("keeps each language direction separate", () => {
    expect(reviewDirection("es", "en")).toBe("es-en");
    expect(
      reviewStatus(state("a", "2026-10-03T12:00:00.000Z"), "en-es", now),
    ).toBe("new");
  });
});
