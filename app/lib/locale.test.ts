import { describe, expect, it } from "vitest";

import { DEFAULT_LOCALE, LOCALES, lookup, otherLocale } from "./locale";
import { en } from "./locales/en";
import { es } from "./locales/es";
import type { MessageValue } from "./locales/types";

/**
 * Guarda contra el fallo más probable de un catálogo: que se queden
 * desincronizados.
 *
 * El tipo de `en.ts` ya obliga a que existan todas las claves del español, así
 * que esto no vigila lo mismo: vigila los sitios por donde se puede colar el
 * error sin que el compilador lo note, que son los mensajes con `{marcador}`.
 * Si la versión inglesa de «{count} tarjetas» se queda sin `{count}`, el tipo
 * sigue Cumple y lo que sale en pantalla es « cards». Eso no se ve ni
 * compilando ni leyendo el catálogo de un vistazo.
 */

const PLACEHOLDER = /\{(\w+)\}/g;

/** Los marcadores de un mensaje, sea cadena o tupla. */
function placeholders(value: MessageValue): string[] {
  const forms = typeof value === "string" ? [value] : value;

  return [
    ...new Set(
      forms.flatMap((form) =>
        [...form.matchAll(PLACEHOLDER)].map((match) => match[1]),
      ),
    ),
  ].sort();
}

describe("catálogos de traducción", () => {
  it("el inglés trae todas las claves del español", () => {
    const missing = Object.keys(es).filter(
      (key) => !(key in (en as Record<string, unknown>)),
    );

    expect(missing).toEqual([]);
  });

  it("el inglés no trae claves que el español no tiene", () => {
    // Una clave de sobra en inglés es un error tipográfico: nadie la va a leer.
    const extra = Object.keys(en).filter(
      (key) => !(key in (es as Record<string, unknown>)),
    );

    expect(extra).toEqual([]);
  });

  it.each(Object.keys(es).filter((key) => key in en))(
    "`%s` usa los mismos marcadores en los dos idiomas",
    (key) => {
      const spanish = placeholders(es[key as keyof typeof es]);
      const english = placeholders(en[key as keyof typeof en]);

      expect(english).toEqual(spanish);
    },
  );

  it("ningún mensaje está vacío", () => {
    const empty = Object.entries(es)
      .filter(([, value]) => {
        const forms = typeof value === "string" ? [value] : value;
        return forms.some((form) => form.trim() === "");
      })
      .map(([key]) => key);

    expect(empty).toEqual([]);
  });
});

describe("lookup", () => {
  it("devuelve el mensaje del idioma pedido", () => {
    expect(lookup("es", "common.cancel")).toBe("Cancelar");
    expect(lookup("en", "common.cancel")).toBe("Cancel");
  });

  it("interpola los marcadores que recibió", () => {
    expect(
      lookup("es", "estudiar.metaDeck", { deck: "Inglés para reuniones" }),
    ).toBe("Estudiar Inglés para reuniones");
    expect(
      lookup("en", "estudiar.metaDeck", { deck: "English for meetings" }),
    ).toBe("Study English for meetings");
  });

  it("deja el marcador tal cual si no le pasan valor", () => {
    // Es mejor que se vea `{deck}` en developing que un hueco sin explicar.
    expect(lookup("en", "estudiar.metaDeck")).toBe("Study {deck}");
  });

  it("elige la forma singular solo con uno", () => {
    expect(lookup("es", "format.cardCount", { count: 1 })).toBe("1 tarjeta");
    expect(lookup("es", "format.cardCount", { count: 0 })).toBe("0 tarjetas");
    expect(lookup("es", "format.cardCount", { count: 7 })).toBe("7 tarjetas");

    expect(lookup("en", "format.cardCount", { count: 1 })).toBe("1 card");
    expect(lookup("en", "format.cardCount", { count: 0 })).toBe("0 cards");
    expect(lookup("en", "format.cardCount", { count: 7 })).toBe("7 cards");
  });

  it("devuelve la clave si no existe en ningún catálogo", () => {
    const fantasma = "no.existe" as Parameters<typeof lookup>[1];

    expect(lookup("es", fantasma)).toBe("no.existe");
  });
});

describe("idiomas", () => {
  it("el español es el idioma por defecto y está en la lista", () => {
    expect(DEFAULT_LOCALE).toBe("es");
    expect(LOCALES).toContain("es");
  });

  it("el selector de dos idiomas salta al otro", () => {
    expect(otherLocale("es")).toBe("en");
    expect(otherLocale("en")).toBe("es");
  });

  it("tiene los dos catálogos para todos los idiomas", () => {
    // Si `LOCALES` crece y no se escribe el catálogo, esto avisa antes que el
    // primer `undefined` pintado en producción.
    for (const locale of LOCALES) {
      expect(lookup(locale, "common.cancel")).not.toBe("common.cancel");
    }
  });
});
