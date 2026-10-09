/**
 * A dónde lleva cada tipo de mazo.
 *
 * Un mazo propio se edita y uno público se ve: son dos rutas distintas y el
 * destino estaba escrito a mano en cinco sitios, cada uno con su propio criterio
 * para decidir. El caso que duele es el contrario: un mazo privado no tiene
 * página pública —RLS lo esconde—, así que un enlace a `/mazos/<slug>` ahí es
 * un 404 de la propia aplicación.
 */

/** Lo mínimo que hace falta para decidir a dónde va un mazo. */
export interface DeckDestination {
  id: string;
  slug: string;
  visibility: "private" | "public";
}

/** El editor del mazo. Es el destino de todo lo que es tuyo. */
export function deckEditHref(deck: { id: string }): string {
  return `/biblioteca/mazos/${deck.id}/editar`;
}

/** La página pública del mazo. Solo tiene sentido si el mazo es público. */
export function deckPublicHref(deck: { slug: string }): string {
  return `/mazos/${deck.slug}`;
}

/**
 * A dónde va un mazo según de quién es.
 *
 * Es la decisión que las cinco copias de este cálculo tomaban de un modo u otro,
 * y la regla es una: lo tuyo se abre en el editor, lo de otra persona en su
 * página pública.
 */
export function deckHref(deck: DeckDestination): string {
  return deck.visibility === "public"
    ? deckPublicHref(deck)
    : deckEditHref(deck);
}
