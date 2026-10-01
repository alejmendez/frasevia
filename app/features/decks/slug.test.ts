import { describe, expect, it } from "vitest";

import { slugPreview } from "./slug";

describe("slugPreview", () => {
  it("pliega cada vocal acentuada en su letra base", () => {
    // Tabla completa a propósito: un carácter de más o de menos en la lista
    // desplazaría todas las vocales siguientes (el bug que motivó esta prueba).
    const table: Record<string, string> = {
      á: "a",
      à: "a",
      ä: "a",
      â: "a",
      ã: "a",
      é: "e",
      è: "e",
      ë: "e",
      ê: "e",
      í: "i",
      ì: "i",
      ï: "i",
      î: "i",
      ó: "o",
      ò: "o",
      ö: "o",
      ô: "o",
      õ: "o",
      ú: "u",
      ù: "u",
      ü: "u",
      û: "u",
      ñ: "n",
      ç: "c",
    };

    for (const [accented, plain] of Object.entries(table)) {
      expect(slugPreview(`x${accented}x`)).toBe(`x${plain}x`);
    }
  });

  it("convierte un título en una dirección legible", () => {
    expect(slugPreview("Inglés para desarrolladores")).toBe(
      "ingles-para-desarrolladores",
    );
  });

  it("colapsa espacios y signos en guiones", () => {
    expect(slugPreview("  Inglés   desde   las bases  ")).toBe(
      "ingles-desde-las-bases",
    );
    expect(slugPreview("Node.js & TypeScript")).toBe("node-js-typescript");
  });

  it("convierte las vocales acentuadas y la eñe, igual que el trigger de Postgres", () => {
    expect(slugPreview("Acentuación y Ñoño")).toBe("acentuacion-y-nono");
    expect(slugPreview("Corazón, canción,ürün")).toBe("corazon-cancion-urun");
  });

  it("no deja guiones sueltos en los extremos", () => {
    expect(slugPreview("...saludos...")).toBe("saludos");
  });

  it("cae a un valor por defecto si el título no tiene caracteres útiles", () => {
    expect(slugPreview("¿¡?")).toBe("mazo");
    expect(slugPreview("   ")).toBe("mazo");
  });
});
