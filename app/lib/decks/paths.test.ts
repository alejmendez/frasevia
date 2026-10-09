import { describe, expect, it } from "vitest";

import { deckEditHref, deckHref, deckPublicHref } from "./paths";

const privado = {
  id: "abc-123",
  slug: "verbos-irregulares",
  visibility: "private",
} as const;
const publico = {
  id: "xyz-789",
  slug: "mi-mazo",
  visibility: "public",
} as const;

describe("a dónde lleva un mazo", () => {
  it("un mazo tuyo se abre en su editor", () => {
    expect(deckHref(privado)).toBe("/biblioteca/mazos/abc-123/editar");
  });

  it("un mazo público se abre en su página", () => {
    expect(deckHref(publico)).toBe("/mazos/mi-mazo");
  });

  it("un mazo privado nunca va a su página pública", () => {
    // La página pública de un mazo privado responde «no encontrado» porque RLS
    // lo esconde: enlazar ahí es mandar a un 404.
    expect(deckHref(privado)).not.toContain(privado.slug);
  });

  it("las dos rutas sueltas siguen disponibles por separado", () => {
    expect(deckEditHref({ id: "abc-123" })).toBe(
      "/biblioteca/mazos/abc-123/editar",
    );
    expect(deckPublicHref({ slug: "mi-mazo" })).toBe("/mazos/mi-mazo");
  });
});
