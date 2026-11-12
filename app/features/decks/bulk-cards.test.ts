import { describe, expect, it } from "vitest";

import type { Card } from "~/lib/types";

import { cardsToJson, parseBulkCards } from "./bulk-cards";

/**
 * El intercambio de tarjetas por JSON.
 *
 * Lo que se prueba aquí es la parte que puede salir mal sin que se note: que el
 * JSON que vuelve del modelo no sea el que se le dio, o que traiga una tarjeta
 * de otro mazo. Un error aquí se traduce en tarjetas escritas donde no era.
 */

function card(overrides: Partial<Card> = {}): Card {
  return {
    id: "card-1",
    deck_id: "deck-1",
    kind: "word",
    term: "to go",
    meaning_es: "ir",
    example_en: null,
    example_es: null,
    usage_note: null,
    tags: [],
    position: 1,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    ...overrides,
  };
}

describe("el JSON que se le da al modelo", () => {
  it("lleva el identificador y los campos que se pueden editar", () => {
    const json = JSON.parse(
      cardsToJson([card({ tags: ["verbo"], example_en: "I go." })]),
    );

    expect(json).toEqual([
      {
        card_id: "card-1",
        kind: "word",
        term: "to go",
        meaning_es: "ir",
        example_en: "I go.",
        example_es: null,
        usage_note: null,
        tags: ["verbo"],
      },
    ]);
  });
});

describe("el JSON que vuelve del modelo", () => {
  it("separa lo que se actualiza de lo que se agrega", () => {
    const result = parseBulkCards(
      JSON.stringify([
        { card_id: "card-1", term: "to leave", meaning_es: "salir" },
        { term: "a new one", meaning_es: "uno nuevo" },
      ]),
      ["card-1"],
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.updates["card-1"]).toMatchObject({
      term: "to leave",
      meaning_es: "salir",
      kind: "word",
    });
    expect(result.creates).toHaveLength(1);
    expect(result.creates[0]).toMatchObject({
      term: "a new one",
      meaningEs: "uno nuevo",
    });
  });

  it("no toca las tarjetas que no vienen en el JSON", () => {
    const result = parseBulkCards(
      JSON.stringify([{ card_id: "card-1", term: "x", meaning_es: "y" }]),
      ["card-1", "card-2"],
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(Object.keys(result.updates)).toEqual(["card-1"]);
  });

  it("rellena los huecos entre corchetes", () => {
    const result = parseBulkCards(
      JSON.stringify([
        {
          card_id: "card-1",
          term: "I am an engineer with experience in [area]",
          meaning_es: "Soy ingeniero con experiencia en [area]",
        },
      ]),
      ["card-1"],
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.updates["card-1"].term).toBe(
      "I am an engineer with experience in [area]",
    );
  });

  it("rechaza una tarjeta que no es de este mazo", () => {
    const result = parseBulkCards(
      JSON.stringify([{ card_id: "card-ajena", term: "x", meaning_es: "y" }]),
      ["card-1"],
    );

    expect(result).toMatchObject({ ok: false, reason: "unknown-card" });
  });

  it("rechaza una tarjeta sin término o sin significado", () => {
    const result = parseBulkCards(
      JSON.stringify([{ card_id: "card-1", term: "  ", meaning_es: "y" }]),
      ["card-1"],
    );

    expect(result).toMatchObject({ ok: false, reason: "missing-fields" });
  });

  it("rechaza un texto más largo de lo que admite la base", () => {
    const result = parseBulkCards(
      JSON.stringify([
        { card_id: "card-1", term: "a".repeat(201), meaning_es: "y" },
      ]),
      ["card-1"],
    );

    expect(result).toMatchObject({ ok: false, reason: "too-long" });
  });

  it("rechaza un tipo de tarjeta que no existe", () => {
    const result = parseBulkCards(
      JSON.stringify([
        { card_id: "card-1", kind: "adjetivo", term: "x", meaning_es: "y" },
      ]),
      ["card-1"],
    );

    expect(result).toMatchObject({ ok: false, reason: "bad-kind" });
  });

  it("rechaza algo que no es una lista de tarjetas", () => {
    expect(parseBulkCards("{}", ["card-1"])).toMatchObject({
      ok: false,
      reason: "not-a-list",
    });
    expect(parseBulkCards("[]", ["card-1"])).toMatchObject({
      ok: false,
      reason: "empty",
    });
    expect(parseBulkCards("esto no es json", ["card-1"])).toMatchObject({
      ok: false,
      reason: "invalid-json",
    });
  });

  it("rechaza una entrada que no es una tarjeta", () => {
    const result = parseBulkCards(JSON.stringify(["hola"]), ["card-1"]);

    expect(result).toMatchObject({ ok: false, reason: "not-a-card" });
  });
});
