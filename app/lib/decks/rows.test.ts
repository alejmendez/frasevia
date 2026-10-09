import { describe, expect, it } from "vitest";
import type { DeckBrief } from "./rows";
import { deckTargetLanguage, toCardRow, toCardRows, toDeckRow } from "./rows";

const brief: DeckBrief = {
  title: "Verbos irregulares",
  description: "Los que no se nos dan",
  studyMode: "language",
  level: "B1",
  sourceLanguage: "es",
  targetLanguage: "en",
  visibility: "private",
};

describe("el idioma de destino de un mazo", () => {
  it("en un mazo de idiomas cada idioma va por su lado", () => {
    expect(deckTargetLanguage("language", "es", "en")).toBe("en");
    expect(deckTargetLanguage("language", "en", "es")).toBe("es");
  });

  it("un mazo de repaso general se queda en un solo idioma", () => {
    // El contenido, los ejemplos y las notas están todos en el idioma de origen,
    // así que el destino es el mismo: no hay nada que traducir.
    expect(deckTargetLanguage("general", "es", "en")).toBe("es");
  });
});

describe("la fila de un mazo", () => {
  it("recorta los textos sueltos", () => {
    expect(
      toDeckRow("user-1", { ...brief, title: "  Verbos  " }),
    ).toMatchObject({
      title: "Verbos",
      description: "Los que no se nos dan",
    });
  });

  it("guarda el nivel vacío como nulo y no como cadena en blanco", () => {
    expect(toDeckRow("user-1", { ...brief, level: "   " }).level).toBeNull();
    expect(toDeckRow("user-1", { ...brief, level: null }).level).toBeNull();
    expect(toDeckRow("user-1", { ...brief, level: "B1" }).level).toBe("B1");
  });

  it("se niega a crear un mazo sin título", () => {
    // Un título en blanco no lo ve nadie y el mazo ocupa sitio en la biblioteca.
    expect(() => toDeckRow("user-1", { ...brief, title: "   " })).toThrow();
  });

  it("deja el idioma de destino según el tipo de mazo", () => {
    expect(toDeckRow("user-1", brief).target_language).toBe("en");
    expect(
      toDeckRow("user-1", { ...brief, studyMode: "general" }).target_language,
    ).toBe("es");
  });
});

describe("la fila de una tarjeta", () => {
  const card = {
    term: "  to go  ",
    meaningEs: "  ir  ",
    exampleEn: "  I go tomorrow.  ",
    exampleEs: "   ",
    usageNote: null,
  };

  it("recorta los textos y convierte los vacíos en nulo", () => {
    expect(toCardRow("deck-1", card, 1)).toMatchObject({
      deck_id: "deck-1",
      term: "to go",
      meaning_es: "ir",
      example_en: "I go tomorrow.",
      example_es: null,
      usage_note: null,
    });
  });

  it("una tarjeta sin tipo es una palabra", () => {
    expect(toCardRow("deck-1", card, 1).kind).toBe("word");
  });

  it("numera las tarjetas desde 1, porque así ordena la base", () => {
    const rows = toCardRows("deck-1", [
      { term: "a", meaningEs: "a" },
      { term: "b", meaningEs: "b" },
      { term: "c", meaningEs: "c" },
    ]);

    expect(rows.map((row) => row.position)).toEqual([1, 2, 3]);
  });

  it("conserva los Voluntary tags cuando los hay", () => {
    expect(toCardRow("deck-1", { ...card, tags: ["verbo"] }, 1).tags).toEqual([
      "verbo",
    ]);
  });
});
