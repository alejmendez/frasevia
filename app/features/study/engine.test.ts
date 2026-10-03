import { describe, expect, it } from "vitest";

import type { CardProgress, StudyCard } from "~/lib/types";
import {
  acceptedAnswers,
  buildChoiceQuestion,
  buildFillInTheBlank,
  buildSession,
  canUseChoiceMode,
  canUseFillInTheBlankMode,
  checkTypedAnswer,
  createRng,
  nextProgress,
  normalizeAnswer,
  resolveMode,
  shuffle,
  summarize,
} from "./engine";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function card(overrides: Partial<StudyCard> & { id: string }): StudyCard {
  return {
    term: "term",
    meaningEs: "significado",
    exampleEn: null,
    exampleEs: null,
    usageNote: null,
    ...overrides,
  };
}

const fourCards: StudyCard[] = [
  card({ id: "a", term: "to be", meaningEs: "verbo irregular" }),
  card({ id: "b", term: "commute", meaningEs: "desplazarse al trabajo" }),
  card({ id: "c", term: "deadline", meaningEs: "fecha límite" }),
  card({ id: "d", term: "on time", meaningEs: "a tiempo" }),
];

const sentenceCards: StudyCard[] = [
  card({
    id: "s1",
    term: "deadline",
    meaningEs: "fecha límite",
    exampleEn: "The deadline is next Friday.",
    exampleEs: "La fecha límite es el próximo viernes.",
  }),
  card({
    id: "s2",
    term: "a good fit",
    meaningEs: "buena opción",
    exampleEn: "She seems like a good fit for the team.",
    exampleEs: "Parece buena opción para el equipo.",
  }),
];

function progress(overrides: Partial<CardProgress>): CardProgress {
  return {
    card_id: "a",
    state: "new",
    attempts: 0,
    correct_count: 0,
    last_studied_at: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Normalización y corrección de respuestas
// ---------------------------------------------------------------------------

describe("normalizeAnswer", () => {
  it("ignora mayúsculas y espacios sobrantes", () => {
    expect(normalizeAnswer("  Nice   To  Meet  ")).toBe("nice to meet");
  });

  it("quita la puntuación final, que casi nunca se escribe al memorizar", () => {
    expect(normalizeAnswer("Nice to meet you.")).toBe("nice to meet you");
    expect(normalizeAnswer("Nice to meet you!")).toBe("nice to meet you");
    expect(normalizeAnswer('"Nice to meet you"')).toBe("nice to meet you");
  });

  it("convierte comillas tipográficas y guiones largos", () => {
    expect(normalizeAnswer("it’s")).toBe("it s");
    expect(normalizeAnswer("“deadline”")).toBe("deadline");
  });

  it("deja vacío solo lo que no tiene letras ni números", () => {
    expect(normalizeAnswer("  ¡¿.  ")).toBe("");
  });
});

describe("acceptedAnswers", () => {
  it("acepta la respuesta con y sin artículo inicial", () => {
    expect(acceptedAnswers("a good fit")).toEqual(["a good fit", "good fit"]);
  });

  it("no inventa variantes si el término no empieza con artículo", () => {
    expect(acceptedAnswers("deadline")).toEqual(["deadline"]);
  });
});

describe("checkTypedAnswer", () => {
  const answers = acceptedAnswers("a good fit");

  it("acepta regardless de mayúsculas, punto y artículo opcional", () => {
    expect(checkTypedAnswer("a good fit", answers)).toBe(true);
    expect(checkTypedAnswer("Good fit.", answers)).toBe(true);
    expect(checkTypedAnswer("  A GOOD FIT! ", answers)).toBe(true);
  });

  it("rechaza una respuesta equivocada", () => {
    expect(checkTypedAnswer("a good idea", answers)).toBe(false);
  });

  it("rechaza respuestas que agregan palabras", () => {
    expect(checkTypedAnswer("she is a good fit", answers)).toBe(false);
  });

  it("rechaza una respuesta vacía", () => {
    expect(checkTypedAnswer("   ", answers)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Completar la frase
// ---------------------------------------------------------------------------

describe("buildFillInTheBlank", () => {
  it("oculta el término dentro del ejemplo", () => {
    const result = buildFillInTheBlank(sentenceCards[0]);
    expect(result?.sentence).toBe("The ____ is next Friday.");
    expect(result?.answer).toBe("deadline");
  });

  it("completa la respuesta en inglés al estudiar desde el español", () => {
    const result = buildFillInTheBlank(
      card({
        id: "salary-es-en",
        term: "sueldo base",
        meaningEs: "base salary",
        exampleEn: "What is the base salary for this role?",
        exampleEs: "¿Cuál es el sueldo base para este cargo?",
        sourceLanguage: "es",
        targetLanguage: "en",
      }),
    );
    expect(result).toMatchObject({
      sentence: "What is the ____ for this role?",
      answer: "base salary",
      answers: ["base salary"],
    });
  });

  it("completa la respuesta en español al estudiar desde el inglés", () => {
    const result = buildFillInTheBlank(
      card({
        id: "salary-en-es",
        term: "base salary",
        meaningEs: "sueldo base",
        exampleEn: "What is the base salary for this role?",
        exampleEs: "¿Cuál es el sueldo base para este cargo?",
        sourceLanguage: "en",
        targetLanguage: "es",
      }),
    );
    expect(result).toMatchObject({
      sentence: "¿Cuál es el ____ para este cargo?",
      answer: "sueldo base",
      answers: ["sueldo base"],
    });
  });

  it("respeta mayúsculas distintas entre término y ejemplo", () => {
    const result = buildFillInTheBlank(
      card({
        id: "x",
        term: "nice to meet you",
        meaningEs: "mucho gusto",
        exampleEn: "Hi! Nice to meet you.",
      }),
    );
    expect(result?.sentence).toBe("Hi! ____.");
  });

  it("devuelve null si el término no aparece en el ejemplo", () => {
    expect(
      buildFillInTheBlank(
        card({
          id: "x",
          term: "deadline",
          meaningEs: "fecha límite",
          exampleEn: "The meeting starts at nine.",
        }),
      ),
    ).toBeNull();
  });

  it("devuelve null si la tarjeta no tiene ejemplo", () => {
    expect(buildFillInTheBlank(fourCards[0])).toBeNull();
  });
});

describe("canUseFillInTheBlankMode", () => {
  it("es falso si ninguna tarjeta tiene el término en su ejemplo", () => {
    expect(canUseFillInTheBlankMode(fourCards)).toBe(false);
  });

  it("es verdadero si al menos una tarjeta se puede completar", () => {
    expect(canUseFillInTheBlankMode(sentenceCards)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Elegir significado
// ---------------------------------------------------------------------------

describe("buildChoiceQuestion", () => {
  it("incluye la respuesta correcta y tres distractores", () => {
    const question = buildChoiceQuestion(fourCards[0], fourCards);

    expect(question).not.toBeNull();
    expect(question?.options).toHaveLength(4);
    expect(question?.answerId).toBe("a");
  });

  it("nunca usa la tarjeta como alternativa correcta de sí misma", () => {
    const question = buildChoiceQuestion(fourCards[0], fourCards);
    const answers = question?.options.filter((option) => option.id === "a");

    expect(answers).toHaveLength(1);
    expect(answers?.[0].label).toBe("verbo irregular");
  });

  it("no repite el significado de la respuesta correcta como distractor", () => {
    const duplicated: StudyCard[] = [
      card({ id: "a", term: "hello", meaningEs: "hola" }),
      card({ id: "b", term: "hi", meaningEs: "HOLA." }),
      card({ id: "c", term: "bye", meaningEs: "adiós" }),
      card({ id: "d", term: "bye now", meaningEs: "chao" }),
      card({ id: "e", term: "greetings", meaningEs: "saludos" }),
    ];

    const question = buildChoiceQuestion(duplicated[0], duplicated);
    expect(question).not.toBeNull();

    const labels = question?.options.map((option) =>
      normalizeAnswer(option.label),
    );

    expect(labels).toHaveLength(new Set(labels).size);
    expect(labels?.filter((label) => label === "hola")).toHaveLength(1);
  });

  it("devuelve null si no hay suficientes significados distintos", () => {
    const tooSmall = fourCards.slice(0, 2);
    expect(buildChoiceQuestion(tooSmall[0], tooSmall)).toBeNull();
  });
});

describe("canUseChoiceMode", () => {
  it("exige al menos cuatro tarjetas con significados distintos", () => {
    expect(canUseChoiceMode(fourCards.slice(0, 3))).toBe(false);
    expect(canUseChoiceMode(fourCards)).toBe(true);
  });

  it("devuelve null si la única forma de llegar a cuatro sería repetir significados", () => {
    const almostEnough: StudyCard[] = [
      card({ id: "a", meaningEs: "hola" }),
      card({ id: "b", meaningEs: "adiós" }),
      card({ id: "c", meaningEs: "adiós" }),
      card({ id: "d", meaningEs: "chao" }),
      card({ id: "e", meaningEs: "adiós" }),
    ];

    // Solo hay dos distractores distintos ("adiós" y "chao"), así que la
    // pregunta de opción múltiple no se puede armar sin repetir una traducción.
    expect(buildChoiceQuestion(almostEnough[0], almostEnough)).toBeNull();
  });

  it("no cuenta tarjetas con el mismo significado repetido", () => {
    const repeated = [
      card({ id: "a", meaningEs: "hola" }),
      card({ id: "b", meaningEs: "hola" }),
      card({ id: "c", meaningEs: "adiós" }),
      card({ id: "d", meaningEs: "chao" }),
    ];

    expect(canUseChoiceMode(repeated)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Plan de sesión
// ---------------------------------------------------------------------------

describe("resolveMode", () => {
  it("respeta el modo pedido cuando el contenido alcanza", () => {
    expect(resolveMode("elegir", fourCards).mode).toBe("elegir");
    expect(resolveMode("completar", sentenceCards).mode).toBe("completar");
  });

  it("degrada a repaso cuando no hay alternativas suficientes", () => {
    const resolved = resolveMode("elegir", fourCards.slice(0, 2));

    expect(resolved.mode).toBe("revisar");
    expect(resolved.notice).toContain("repaso");
  });

  it("degrada a repaso cuando ningún ejemplo contiene el término", () => {
    const resolved = resolveMode("completar", fourCards);

    expect(resolved.mode).toBe("revisar");
    expect(resolved.notice).not.toBeNull();
  });

  it("nunca deja la sesión sin ítems", () => {
    expect(resolveMode("elegir", []).mode).toBe("revisar");
  });
});

describe("buildSession", () => {
  it("crea un ítem por cada tarjeta en modo explorar", () => {
    const plan = buildSession(fourCards, { mode: "explorar", seed: 1 });

    expect(plan.mode).toBe("explorar");
    expect(plan.items).toHaveLength(4);
    expect(plan.items.every((item) => item.kind === "explorar")).toBe(true);
  });

  it("respeta el límite de tarjetas practicadas", () => {
    const plan = buildSession(fourCards, {
      mode: "explorar",
      limit: 2,
      seed: 1,
    });
    expect(plan.items).toHaveLength(2);
  });

  it("es reproducible con la misma semilla", () => {
    const first = buildSession(fourCards, { mode: "explorar", seed: 42 });
    const second = buildSession(fourCards, { mode: "explorar", seed: 42 });

    expect(
      first.items.map((item) => (item.kind === "explorar" ? item.card.id : "")),
    ).toEqual(
      second.items.map((item) =>
        item.kind === "explorar" ? item.card.id : "",
      ),
    );
  });

  it("baraja las opciones de la pregunta de elección múltiple", () => {
    const plan = buildSession(fourCards, { mode: "elegir", seed: 7 });
    const first = plan.items[0];

    expect(first?.kind).toBe("elegir");
    if (first?.kind !== "elegir") {
      return;
    }

    expect(first.options).toHaveLength(4);
    expect(first.options.some((option) => option.id === first.answerId)).toBe(
      true,
    );
  });

  it("descarta las tarjetas que no se pueden completar", () => {
    const mixed = [...sentenceCards, ...fourCards];
    const plan = buildSession(mixed, { mode: "completar", seed: 3 });

    expect(plan.items).toHaveLength(2);
    expect(plan.items.every((item) => item.kind === "completar")).toBe(true);
  });

  it("avisa cuando cambió el modo pedido", () => {
    const plan = buildSession(fourCards.slice(0, 1), {
      mode: "elegir",
      seed: 1,
    });

    expect(plan.requestedMode).toBe("elegir");
    expect(plan.mode).toBe("revisar");
    expect(plan.notice).not.toBeNull();
  });
});

describe("shuffle", () => {
  it("conserva todos los elementos", () => {
    const items = [1, 2, 3, 4, 5];
    const shuffled = shuffle(items, createRng(1));

    expect([...shuffled].sort((a, b) => a - b)).toEqual(items);
  });

  it("no muta el arreglo original", () => {
    const items = [1, 2, 3, 4, 5];
    shuffle(items, createRng(1));

    expect(items).toEqual([1, 2, 3, 4, 5]);
  });
});

// ---------------------------------------------------------------------------
// Progreso
// ---------------------------------------------------------------------------

describe("nextProgress", () => {
  it("deja la tarjeta en practicando con un solo acierto", () => {
    const result = nextProgress(undefined, true);

    expect(result).toEqual({
      state: "learning",
      attempts: 1,
      correctCount: 1,
    });
  });

  it("marca la tarjeta como aprendida al segundo acierto", () => {
    const result = nextProgress(
      progress({ attempts: 1, correct_count: 1, state: "learning" }),
      true,
    );

    expect(result.state).toBe("mastered");
    expect(result.correctCount).toBe(2);
  });

  it("vuelve a practicando si se falla después de aprender", () => {
    const result = nextProgress(
      progress({ attempts: 4, correct_count: 3, state: "mastered" }),
      false,
    );

    expect(result.state).toBe("learning");
    expect(result.correctCount).toBe(3);
  });

  it("acumula los intentos sin perder los aciertos previos", () => {
    const result = nextProgress(
      progress({ attempts: 7, correct_count: 1 }),
      true,
    );

    expect(result.attempts).toBe(8);
    expect(result.correctCount).toBe(2);
  });
});

describe("summarize", () => {
  const byId = new Map(fourCards.map((item) => [item.id, item]));

  it("calcula aciertos y porcentaje sobre los ítems puntuables", () => {
    const summary = summarize(
      [
        { cardId: "a", correct: true, selfAssessed: false },
        { cardId: "b", correct: false, selfAssessed: false },
      ],
      byId,
    );

    expect(summary.practiced).toBe(2);
    expect(summary.correct).toBe(1);
    expect(summary.accuracy).toBe(0.5);
    expect(summary.needsReview.map((item) => item.id)).toEqual(["b"]);
  });

  it("deja el repaso autoevaluado fuera del porcentaje, pero lo que falló vuelve a la cola", () => {
    const summary = summarize(
      [
        { cardId: "a", correct: false, selfAssessed: true },
        { cardId: "b", correct: true, selfAssessed: false },
      ],
      byId,
    );

    expect(summary.practiced).toBe(2);
    expect(summary.correct).toBe(1);
    expect(summary.accuracy).toBe(1);
    expect(summary.needsReview.map((item) => item.id)).toEqual(["a"]);
  });

  it("no divide por cero cuando todo fue autoevaluado", () => {
    const summary = summarize(
      [{ cardId: "a", correct: true, selfAssessed: true }],
      byId,
    );

    expect(summary.accuracy).toBe(0);
  });
});
