import { describe, expect, it } from "vitest";

import type { LibraryDeck } from "~/lib/decks";
import { deckAction } from "./deck-card-footer";

/**
 * Qué botón se le ofrece a cada mazo.
 *
 * La regla es que se ofrezca lo más útil que se pueda hacer con ese mazo ahora,
 * y el orden importa: un mazo vacío no se puede repasar, uno con repasos
 * pendientes sí, uno con tarjetas nuevas sirve para aprender, y si no hay nada de
 * eso, se mira.
 *
 * Que sea una función pura es lo que permite comprobarlo: si estuviera dentro del
 * componente, cambiar el orden de las ramas no daría ningún aviso.
 */
const tr = (key: string) => key;

function deck(overrides: Partial<LibraryDeck> = {}): LibraryDeck {
  return {
    id: "deck-1",
    slug: "verbos",
    title: "Verbos",
    description: null,
    author_id: "user-1",
    card_count: 10,
    visibility: "private",
    is_official: false,
    study_mode: "language",
    source_language: "es",
    target_language: "en",
    level: null,
    source_deck_id: null,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    progress: null,
    review: null,
    ...overrides,
  } as LibraryDeck;
}

const review = (overrides: Record<string, number> = {}) =>
  ({
    deck_id: "deck-1",
    new_count: 0,
    due_count: 0,
    scheduled_count: 0,
    retired_count: 0,
    next_review_at: null,
    last_reviewed_at: null,
    ...overrides,
  }) as LibraryDeck["review"];

describe("qué se le ofrece a cada mazo", () => {
  it("un mazo vacío solo puede recibir tarjetas", () => {
    const action = deckAction(deck({ card_count: 0 }), tr);

    expect(action.to).toBe("/biblioteca/mazos/deck-1/editar");
    expect(action.label).toBe("biblioteca.addCards");
  });

  it("con repasos pendientes, repasar", () => {
    const action = deckAction(
      deck({ review: review({ due_count: 3, new_count: 5 }) }),
      tr,
    );

    // Los pendientes ganan a las nuevas: es lo que vence hoy.
    expect(action.to).toBe("/estudiar/deck-1");
    expect(action.label).toBe("biblioteca.reviewDeck");
    expect(action.primary).toBe(true);
  });

  it("sin pendientes pero con nuevas, aprender", () => {
    const action = deckAction(deck({ review: review({ new_count: 5 }) }), tr);

    expect(action.to).toBe("/estudiar/deck-1");
    expect(action.label).toBe("biblioteca.learnNew");
  });

  it("si no hay nada pendiente, se mira", () => {
    const action = deckAction(
      deck({ review: review({ scheduled_count: 4 }) }),
      tr,
    );

    expect(action.to).toBe("/biblioteca/mazos/deck-1/editar");
    expect(action.label).toBe("biblioteca.viewDeck");
    expect(action.primary).toBe(false);
  });

  it("sin resumen de repaso, se mira y ya", () => {
    // El resumen falta cuando la consulta de progreso falló sin que la pantalla
    // entera fallara: mejor mirar que Studymar sin saber nada.
    const action = deckAction(deck({ review: null }), tr);

    expect(action.to).toBe("/biblioteca/mazos/deck-1/editar");
    expect(action.label).toBe("biblioteca.viewDeck");
  });

  it("un mazo público se mira en su página, no en el editor", () => {
    const action = deckAction(deck({ visibility: "public", review: null }), tr);

    expect(action.to).toBe("/mazos/verbos");
  });

  it("cero nuevas no es lo mismo que no saber cuántas hay", () => {
    // Con `new_count` en cero, el mazo no tiene nada que aprender aunque tenga
    // tarjetas: se studied ya o están archivadas.
    expect(
      deckAction(deck({ review: review({ new_count: 0 }) }), tr).label,
    ).toBe("biblioteca.viewDeck");

    // Si la vista no trae el número, se supone que el mazo entero está por
    // aprender: es la lectura que evita invitar a repasar lo que nadie ha visto.
    const sinContar = deck({ review: review(), card_count: 12 });
    (sinContar.review as { new_count: number | null }).new_count = null;

    expect(deckAction(sinContar, tr).label).toBe("biblioteca.learnNew");
  });

  it("el texto del botón sale del traductor, con su cantidad", () => {
    const conConteo = (key: string, params?: { count?: number }) =>
      `${key}(${params?.count ?? ""})`;

    expect(
      deckAction(deck({ review: review({ due_count: 3 }) }), conConteo),
    ).toMatchObject({
      label: "biblioteca.reviewDeck(3)",
    });
  });
});
