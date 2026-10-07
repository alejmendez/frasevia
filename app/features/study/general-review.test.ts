import { describe, expect, it } from "vitest";
import { parseDeckDraft } from "~/features/ai/draft";
import { buildDraftPrompt, buildStandalonePrompt } from "~/features/ai/prompt";
import { type Card, type CardReviewState, toStudyCard } from "~/lib/types";
import {
  buildChoiceQuestion,
  buildFillInTheBlank,
  buildSession,
} from "./engine";
import {
  buildReviewSession,
  orientReviewCard,
  reviewDirection,
} from "./schedule";

const card: Card = {
  id: "stack",
  deck_id: "programming",
  kind: "question",
  term: "¿Qué estructura sigue el orden LIFO?",
  meaning_es: "Una pila",
  example_en: "El último elemento en entrar es el primero en salir.",
  example_es: null,
  usage_note: "LIFO: last in, first out.",
  tags: ["estructuras"],
  position: 1,
  created_at: "",
  updated_at: "",
};
const request = {
  studyMode: "general" as const,
  concept: "Estructuras de datos",
  cardCount: 8,
  sourceLanguage: "es",
  targetLanguage: "en",
  level: "beginner",
  withExtras: true,
};

describe("general review", () => {
  it("keeps question and answer in order even with an old language pair", () => {
    const study = toStudyCard(card, "es", "en", "general");
    expect(study.term).toBe(card.term);
    expect(study.meaningEs).toBe(card.meaning_es);
    expect(study.studyMode).toBe("general");
    expect(orientReviewCard(study, "general")).toMatchObject({
      sourceText: card.term,
      targetText: card.meaning_es,
    });
  });

  it("uses a stable review direction independent of content language", () => {
    expect(reviewDirection("es", "en", "general")).toBe("general");
    expect(reviewDirection("fr", "fr", "general")).toBe("general");
    expect(reviewDirection("es", "en")).toBe("es-en");
  });

  it("schedules both kinds of cards in a mixed pending session", () => {
    const states: CardReviewState[] = ["general", "es-en"].map(
      (direction, index) => ({
        card_id: String(index),
        direction,
        retired: false,
        review_count: 1,
        next_review_at: "2026-10-06T12:00:00Z",
        last_reviewed_at: "2026-10-05T12:00:00Z",
        updated_at: "",
        last_level_id: null,
      }),
    );
    const items = buildReviewSession(
      states.map((state) => ({
        id: state.card_id,
        direction: state.direction,
      })),
      states,
      null,
      Date.parse("2026-10-07T12:00:00Z"),
    );
    expect(items.map((item) => item.direction)).toEqual(["general", "es-en"]);
    expect(items.every((item) => item.status === "due")).toBe(true);
  });

  it("uses answers for choices and falls back from language-only exercises", () => {
    const study = toStudyCard(card, "es", "es", "general");
    const pool = [
      study,
      ...["Una cola", "Una lista", "Un árbol"].map((answer, index) => ({
        ...study,
        id: String(index),
        meaningEs: answer,
      })),
    ];
    expect(
      buildChoiceQuestion(study, pool)?.options.map((option) => option.label),
    ).toEqual(["Una pila", "Una cola", "Una lista", "Un árbol"]);
    expect(buildFillInTheBlank(study)).toBeNull();
    expect(buildSession(pool, { mode: "completar" }).mode).toBe("revisar");
  });

  it("imports question/answer aliases, context and notes without translation", () => {
    const draft = parseDeckDraft(
      JSON.stringify({
        cards: [
          {
            question: card.term,
            answer: card.meaning_es,
            example: card.example_en,
            note: card.usage_note,
          },
          { pregunta: "¿Qué estructura sigue FIFO?", respuesta: "Una cola" },
        ],
      }),
      "general",
    );
    expect(draft.cards).toHaveLength(2);
    expect(draft.cards[0]).toMatchObject({
      kind: "question",
      term: card.term,
      meaningEs: card.meaning_es,
      exampleEn: card.example_en,
      usageNote: card.usage_note,
    });
  });

  it("builds subject prompts for both AI paths using one content language", () => {
    const prompt = buildDraftPrompt(request);
    expect(prompt.system).toContain('"front"');
    expect(prompt.user).toContain("preguntas y respuestas en español");
    expect(prompt.user).not.toContain("inglés");
    expect(prompt.user).toContain(request.concept);
    expect(buildStandalonePrompt(request)).toContain(prompt.system);
    expect(
      buildDraftPrompt({ ...request, studyMode: "language" }).system,
    ).toContain("profesor de idiomas");
  });
});
