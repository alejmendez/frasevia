import { describe, expect, it } from "vitest";

import {
  normalizeKind,
  optional,
  parseCardForm,
  parseTags,
} from "./parse-card-form";

/** Un envío con los nombres que usa el editor: `card:<id>:<campo>`. */
function envio(entries: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries))
    formData.append(key, value);
  return formData;
}

const tarjetaCompleta = {
  "card:c1:term": "to go",
  "card:c1:meaning_es": "ir",
  "card:c1:kind": "phrase",
  "card:c1:tags": "verbo, movimiento",
  "card:c1:example_en": "I go tomorrow.",
  "card:c1:example_es": "Mañana voy.",
  "card:c1:usage_note": "Ir a un sitio.",
};

describe("leer las tarjetas de un envío", () => {
  it("junta los campos de cada tarjeta por su identificador", () => {
    const parsed = parseCardForm(envio(tarjetaCompleta));

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.cards.c1).toEqual({
      kind: "phrase",
      term: "to go",
      meaning_es: "ir",
      example_en: "I go tomorrow.",
      example_es: "Mañana voy.",
      usage_note: "Ir a un sitio.",
      tags: ["verbo", "movimiento"],
    });
  });

  it("lee varias tarjetas del mismo envío", () => {
    const parsed = parseCardForm(
      envio({
        ...tarjetaCompleta,
        "card:c2:term": "to eat",
        "card:c2:meaning_es": "comer",
      }),
    );

    if (!parsed.ok) throw new Error("debería haber leído dos tarjetas");
    expect(Object.keys(parsed.cards)).toEqual(["c1", "c2"]);
  });

  it("ignora los campos que no son de una tarjeta", () => {
    // El formulario del mazo comparte envío con el de las tarjetas.
    const parsed = parseCardForm(
      envio({ ...tarjetaCompleta, intent: "save-cards", title: "Verbos" }),
    );

    if (!parsed.ok) throw new Error("debería haber leído la tarjeta");
    expect(Object.keys(parsed.cards)).toEqual(["c1"]);
  });

  it("ignora los nombres mal formados en vez de romper el guardado", () => {
    const parsed = parseCardForm(
      envio({
        ...tarjetaCompleta,
        "card:": "huérfano",
        "card:solo-el-id": "huérfano",
        "card:c1:campo-inventado": "no existe",
      }),
    );

    if (!parsed.ok)
      throw new Error("lo mal formado no debe impedir el guardado");
    expect(parsed.cards.c1.term).toBe("to go");
  });

  it("dice que no hay nada que guardar cuando no viene ninguna tarjeta", () => {
    expect(parseCardForm(envio({ intent: "save-cards" }))).toEqual({
      ok: false,
      reason: "empty",
    });
  });

  it("recorta los textos y deja los vacíos como nulos", () => {
    const parsed = parseCardForm(
      envio({
        "card:c1:term": "  to go  ",
        "card:c1:meaning_es": "  ir  ",
        "card:c1:example_en": "   ",
        "card:c1:usage_note": "",
      }),
    );

    if (!parsed.ok) throw new Error("debería haber leído la tarjeta");
    expect(parsed.cards.c1).toMatchObject({
      term: "to go",
      meaning_es: "ir",
      example_en: null,
      example_es: null,
      usage_note: null,
    });
  });

  it("una tarjeta sin tipo es una palabra", () => {
    const parsed = parseCardForm(
      envio({
        "card:c1:term": "to go",
        "card:c1:meaning_es": "ir",
        "card:c1:kind": "no-existe",
      }),
    );

    if (!parsed.ok) throw new Error("debería haber leído la tarjeta");
    expect(parsed.cards.c1.kind).toBe("word");
  });
});

describe("rechazar una tarjeta a medio rellenar", () => {
  it("si le falta el término", () => {
    const parsed = parseCardForm(
      envio({ "card:c1:term": "  ", "card:c1:meaning_es": "ir" }),
    );

    expect(parsed).toEqual({ ok: false, reason: "incomplete", cardId: "c1" });
  });

  it("si le falta la traducción", () => {
    const parsed = parseCardForm(
      envio({ "card:c1:term": "to go", "card:c1:meaning_es": "" }),
    );

    expect(parsed).toEqual({ ok: false, reason: "incomplete", cardId: "c1" });
  });

  it("si una de las muchas está a medias, no guarda ninguna", () => {
    // Guardar las buenas y avisar sería peor que no guardar: quien edita no ve
    // cuál se perdió.
    const parsed = parseCardForm(
      envio({
        ...tarjetaCompleta,
        "card:c2:term": "to eat",
        "card:c2:meaning_es": "  ",
      }),
    );

    expect(parsed.ok).toBe(false);
  });
});

describe("las etiquetas de una tarjeta", () => {
  it("se separan por comas y se recortan", () => {
    expect(parseTags(" Saludos , vida diaria ")).toEqual([
      "Saludos",
      "vida diaria",
    ]);
  });

  it("una coma de más no crea una etiqueta vacía", () => {
    expect(parseTags("verbo,")).toEqual(["verbo"]);
  });

  it("sin etiquetas no hay ninguna", () => {
    expect(parseTags("")).toEqual([]);
    expect(parseTags(null)).toEqual([]);
  });
});

describe("el tipo de una tarjeta", () => {
  it("acepta los cuatro que ofrece el editor", () => {
    for (const kind of ["word", "phrase", "question", "rule"]) {
      expect(normalizeKind(kind)).toBe(kind);
    }
  });

  it("cualquier otra cosa es una palabra", () => {
    expect(normalizeKind("concepto")).toBe("word");
    expect(normalizeKind(null)).toBe("word");
  });
});

describe("un texto del formulario", () => {
  it("los espacios sueltos se van", () => {
    expect(optional("  hola  ")).toBe("hola");
    expect(optional("   ")).toBeNull();
    expect(optional(null)).toBeNull();
  });
});
