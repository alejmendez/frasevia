import { describe, expect, it } from "vitest";

import { parsePracticeResults, toPracticePayload } from "./save-practice";

describe("leer los resultados de una práctica", () => {
  it("lee una lista de resultados", () => {
    const parsed = parsePracticeResults(
      JSON.stringify([
        { cardId: "c1", correct: true },
        { cardId: "c2", correct: false },
      ]),
    );

    expect(parsed).toEqual({
      ok: true,
      results: [
        { cardId: "c1", correct: true },
        { cardId: "c2", correct: false },
      ],
    });
  });

  it("rechaza lo que no es una lista", () => {
    // Esto sí rompería el guardado; lo demás no.
    expect(parsePracticeResults('{"cardId":"c1"}').ok).toBe(false);
    expect(parsePracticeResults('"una cadena"').ok).toBe(false);
    expect(parsePracticeResults("no es json").ok).toBe(false);
  });

  it("descarta lo que no tiene la forma de un resultado", () => {
    const parsed = parsePracticeResults(
      JSON.stringify([
        { cardId: "c1", correct: true },
        { cardId: "c2" },
        { correct: true },
        null,
        "texto",
        { cardId: 5, correct: true },
        { cardId: "c3", correct: "sí" },
      ]),
    );

    if (!parsed.ok) throw new Error("debería haber leído el resultado bueno");
    expect(parsed.results).toEqual([{ cardId: "c1", correct: true }]);
  });

  it("corta una lista enorme", () => {
    // El campo es público: `record_practice` no necesita doscientas y pico filas
    // para hacer su trabajo, y no hay razón para mandarles todas.
    const muchos = Array.from({ length: 260 }, (_, index) => ({
      cardId: `c${index}`,
      correct: true,
    }));

    const parsed = parsePracticeResults(JSON.stringify(muchos));

    if (!parsed.ok) throw new Error("debería haber leído la lista");
    expect(parsed.results).toHaveLength(200);
  });

  it("una lista vacía no es un error", () => {
    // No hay nada que guardar, y eso es una respuesta válida.
    expect(parsePracticeResults("[]")).toEqual({ ok: true, results: [] });
  });
});

describe("los deltas que se envían a la base", () => {
  it("son un intento por tarjeta y el acierto va en cero o en uno", () => {
    expect(
      toPracticePayload([
        { cardId: "c1", correct: true },
        { cardId: "c2", correct: false },
      ]),
    ).toEqual([
      { card_id: "c1", attempts: 1, correct_count: 1 },
      { card_id: "c2", attempts: 1, correct_count: 0 },
    ]);
  });

  it("se mandan los deltas de la sesión, no el total acumulado", () => {
    // La función los acumula en la base: por eso dos sesiones simultáneas no se
    // pisan.
    expect(toPracticePayload([{ cardId: "c1", correct: true }])).toHaveLength(
      1,
    );
  });
});
