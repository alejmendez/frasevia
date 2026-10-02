import { describe, expect, it } from "vitest";

import {
  DraftError,
  MAX_CARDS,
  MEANING_MAX,
  parseDeckDraft,
  TERM_MAX,
  TITLE_MAX,
} from "./draft";

/** Atajo para no repetir el andamiaje en cada prueba. */
function draftFrom(raw: string) {
  return parseDeckDraft(raw);
}

describe("parseDeckDraft", () => {
  describe("extracción del JSON", () => {
    it("lee un objeto limpio", () => {
      const draft = draftFrom(
        JSON.stringify({
          title: "Reuniones",
          cards: [{ term: "to push back", meaning_es: "aplazar" }],
        }),
      );

      expect(draft.title).toBe("Reuniones");
      expect(draft.cards).toHaveLength(1);
      expect(draft.cards[0].term).toBe("to push back");
      expect(draft.cards[0].meaningEs).toBe("aplazar");
    });

    it("lee un array suelto como la lista de tarjetas", () => {
      const draft = draftFrom(
        JSON.stringify([
          { term: "a deadline", meaning_es: "una fecha límite" },
        ]),
      );

      expect(draft.cards).toHaveLength(1);
      expect(draft.cards[0].meaningEs).toBe("una fecha límite");
    });

    it("quita el bloque de código que envuelve la respuesta", () => {
      const draft = draftFrom(
        "```json\n" +
          JSON.stringify({
            title: "Con bloque",
            cards: [{ term: "a stand-up", meaning_es: "una reunión diaria" }],
          }) +
          "\n```",
      );

      expect(draft.title).toBe("Con bloque");
      expect(draft.cards[0].term).toBe("a stand-up");
    });

    it("ignora la prosa de antes y de después", () => {
      const draft = draftFrom(
        "Aquí tienes el mazo que pediste:\n\n```json\n" +
          JSON.stringify({
            cards: [{ term: "a follow-up", meaning_es: "un seguimiento" }],
          }) +
          "\n```\n\nEspero que te sirva.",
      );

      expect(draft.cards).toHaveLength(1);
      expect(draft.cards[0].term).toBe("a follow-up");
    });

    it("no se rompe con llaves dentro de los textos", () => {
      // Un ejemplo con `{{ algo }}` es fácil de que lo produzca un modelo que
      // escribe sobre programación: si se cortara en la primera llave cerrando
      // que encuentre, el JSON quedaría a medias.
      const draft = draftFrom(
        JSON.stringify({
          cards: [
            {
              term: "a bug",
              meaning_es: "un fallo",
              example_en: "Fix the {{ name }} template first.",
            },
          ],
        }),
      );

      expect(draft.cards).toHaveLength(1);
      expect(draft.cards[0].exampleEn).toBe(
        "Fix the {{ name }} template first.",
      );
    });

    it("aguanta una respuesta entera de conversación", () => {
      // Es lo que llega de verdad por el modo de importar: un asistente
      // respondiendo en un chat, con su prosa antes y después, el bloque de
      // código, y dos tarjetas que no sirven. Si esto se leyera mal, el camino
      // que no necesita clave sería el que más falla.
      const respuesta = [
        "¡Claro! Aquí tienes el mazo que pediste, con 10 tarjetas:",
        "",
        "```json",
        JSON.stringify(
          {
            title: "Frases para Pedir Aplazamientos",
            description: "Cómo ganar tiempo sin sonar descortés.",
            level: "Intermedio",
            cards: [
              {
                kind: "phrase",
                term: "to push back a meeting",
                meaning_es: "aplazar una reunión",
                example_en: "Could we push back the meeting to Friday?",
                example_es: "¿Podríamos aplazar la reunión hasta el viernes?",
                usage_note: "Muy común en entornos de trabajo en inglés.",
                tags: ["reuniones"],
              },
              {
                kind: "word",
                term: "to table a discussion",
                meaning: "aplazar un tema para otra reunión",
                example_en: "Let's table that and move on.",
                example_es: "Aplazemos ese tema y sigamos.",
              },
              {
                // Sin `meaning_es`: el modelo se olvidó. Se descarta ella sola.
                term: "to circle back",
                example_en: "Let's circle back to this tomorrow.",
              },
            ],
          },
          null,
          2,
        ),
        "```",
        "",
        "Si quieres, puedo añadirte más expresiones para el contexto informal.",
      ].join("\n");

      const draft = draftFrom(respuesta);

      expect(draft.title).toBe("Frases para Pedir Aplazamientos");
      expect(draft.level).toBe("Intermedio");
      // Tres tarjetas, pero la que no tenía traducción no cuenta.
      expect(draft.cards).toHaveLength(2);
      expect(draft.cards[0]).toMatchObject({
        kind: "phrase",
        term: "to push back a meeting",
        meaningEs: "aplazar una reunión",
        exampleEn: "Could we push back the meeting to Friday?",
        tags: ["reuniones"],
      });
      // `meaning` es un alias válido de `meaning_es`.
      expect(draft.cards[1].meaningEs).toBe(
        "aplazar un tema para otra reunión",
      );
    });

    it("avisa cuando no hay nada con forma de mazo", () => {
      expect(() => draftFrom("Lo siento, no puedo ayudarte con eso.")).toThrow(
        DraftError,
      );
    });

    it("avisa cuando el JSON está cortado", () => {
      expect(() =>
        draftFrom('{"title":"A medias","cards":[{"term":"a","mea'),
      ).toThrow(DraftError);
    });
  });

  describe("normalización de campos", () => {
    it("acepta los nombres alternativos más habituales", () => {
      const draft = draftFrom(
        JSON.stringify({
          cards: [
            {
              word: "to wrap up",
              translation: "terminar una reunión",
              sentence_en: "Let's wrap up here.",
            },
          ],
        }),
      );

      expect(draft.cards[0]).toMatchObject({
        term: "to wrap up",
        meaningEs: "terminar una reunión",
        exampleEn: "Let's wrap up here.",
      });
    });

    it("acepta el nombre en español de la lista de tarjetas", () => {
      const draft = draftFrom(
        JSON.stringify({
          titulo: "En español",
          tarjetas: [{ texto: "el plazo", meaning: "el deadline" }],
        }),
      );

      expect(draft.title).toBe("En español");
      expect(draft.cards[0].term).toBe("el plazo");
    });

    it("deja en null los campos opcionales que no vienen", () => {
      const draft = draftFrom(
        JSON.stringify({
          cards: [{ term: "to pitch in", meaning_es: "aportar" }],
        }),
      );

      expect(draft.cards[0].exampleEn).toBeNull();
      expect(draft.cards[0].exampleEs).toBeNull();
      expect(draft.cards[0].usageNote).toBeNull();
    });

    it("usa «word» cuando el tipo no es uno de los válidos", () => {
      const draft = draftFrom(
        JSON.stringify({
          cards: [
            { term: "a", meaning_es: "b", kind: "adjetivo inventado" },
            { term: "c", meaning_es: "d", kind: "phrase" },
          ],
        }),
      );

      expect(draft.cards[0].kind).toBe("word");
      expect(draft.cards[1].kind).toBe("phrase");
    });
  });

  describe("descartes y topes", () => {
    it("descarta las tarjetas a las que les falta un campo obligatorio", () => {
      // Sin esto, el `insert` de Supabase fallaría entero por el `not null` de
      // `meaning_es` y se perderían también las tarjetas que sí estaban bien.
      const draft = draftFrom(
        JSON.stringify({
          cards: [
            { term: "sin significado" },
            { meaning_es: "sin término" },
            { term: "esta sí", meaning_es: "completa" },
          ],
        }),
      );

      expect(draft.cards).toHaveLength(1);
      expect(draft.cards[0].term).toBe("esta sí");
    });

    it("avisa cuando no queda ninguna tarjeta utilizable", () => {
      expect(() =>
        draftFrom(JSON.stringify({ cards: [{ term: "solo esto" }] })),
      ).toThrow(DraftError);
    });

    it("elimina las tarjetas repetidas", () => {
      const draft = draftFrom(
        JSON.stringify({
          cards: [
            { term: "to push back", meaning_es: "aplazar" },
            { term: "To  push  back", meaning_es: "aplazar" },
            { term: "to push back", meaning_es: "diferente" },
          ],
        }),
      );

      expect(draft.cards).toHaveLength(2);
    });

    it("recorta los textos largos a los límites de la base de datos", () => {
      const draft = draftFrom(
        JSON.stringify({
          title: "T".repeat(TITLE_MAX + 50),
          cards: [
            {
              term: "a".repeat(TERM_MAX + 50),
              meaning_es: "b".repeat(MEANING_MAX + 50),
            },
          ],
        }),
      );

      expect(draft.title.length).toBeLessThanOrEqual(TITLE_MAX);
      expect(draft.cards[0].term.length).toBeLessThanOrEqual(TERM_MAX);
      expect(draft.cards[0].meaningEs.length).toBeLessThanOrEqual(MEANING_MAX);
    });

    it("pone un título utilizable cuando el modelo no da ninguno", () => {
      // `decks_title_length` exige al menos un carácter, así que sin esto el
      // mazo no se podría guardar y se perderían todas las tarjetas.
      const draft = draftFrom(
        JSON.stringify({
          cards: [{ term: "a deadline", meaning_es: "un plazo" }],
        }),
      );

      expect(draft.title.trim()).not.toBe("");
    });

    it("no acepta más tarjetas de las que se pueden usar", () => {
      const cards = Array.from({ length: MAX_CARDS + 25 }, (_, index) => ({
        term: `termino ${index}`,
        meaning_es: `significado ${index}`,
      }));

      const draft = draftFrom(JSON.stringify({ cards }));

      expect(draft.cards).toHaveLength(MAX_CARDS);
    });
  });
});
