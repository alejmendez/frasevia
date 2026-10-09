import { describe, expect, it } from "vitest";

import { MEANING_MAX, TERM_MAX, TITLE_MAX } from "~/features/ai/draft";
import { guessCardKind, type QuickAddForm, validateQuickAdd } from "./validate";

const completa: QuickAddForm = {
  english: "to go",
  spanish: "ir",
  deckId: "deck-1",
  newDeckTitle: "",
};

describe("comprobar la traducción antes de guardarla", () => {
  it("una traducción con mazo elegido está bien", () => {
    expect(validateQuickAdd(completa)).toBeNull();
  });

  it("hacen falta las dos mitades", () => {
    expect(validateQuickAdd({ ...completa, english: "  " })).toBe(
      "translation-required",
    );
    expect(validateQuickAdd({ ...completa, spanish: "" })).toBe(
      "translation-required",
    );
  });

  it("las tradiciones tienen un tope, y es el de la base", () => {
    // Sin este tope, el insert falla entero y se pierde la traducción.
    expect(
      validateQuickAdd({ ...completa, english: "a".repeat(TERM_MAX + 1) }),
    ).toBe("translation-too-long");
    expect(
      validateQuickAdd({ ...completa, spanish: "a".repeat(MEANING_MAX + 1) }),
    ).toBe("translation-too-long");
  });

  it("un mazo nuevo necesita título", () => {
    expect(validateQuickAdd({ ...completa, deckId: null })).toBe(
      "deck-name-required",
    );
    expect(
      validateQuickAdd({ ...completa, deckId: null, newDeckTitle: "  " }),
    ).toBe("deck-name-required");
  });

  it("el título del mazo nuevo también tiene un tope", () => {
    expect(
      validateQuickAdd({
        ...completa,
        deckId: null,
        newDeckTitle: "a".repeat(TITLE_MAX + 1),
      }),
    ).toBe("deck-title-too-long");
  });

  it("el título demasiado largo no tapa un problema anterior", () => {
    // El orden importa: primero se dice que faltan las traducciones, porque es lo
    // que hay que arreglar antes que nada.
    expect(
      validateQuickAdd({
        ...completa,
        english: "",
        deckId: null,
        newDeckTitle: "a".repeat(TITLE_MAX + 1),
      }),
    ).toBe("translation-required");
  });
});

describe("el tipo de tarjeta que se deduce del término", () => {
  it("con espacios dentro es una frase", () => {
    expect(guessCardKind("to be able to")).toBe("phrase");
  });

  it("sin espacios es una palabra", () => {
    expect(guessCardKind("go")).toBe("word");
  });

  it("los espacios de los bordes no cuentan", () => {
    // Un término pegado con un espacio al final no es una frase de dos palabras.
    expect(guessCardKind("  go  ")).toBe("word");
  });
});
