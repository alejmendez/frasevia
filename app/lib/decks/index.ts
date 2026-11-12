/**
 * Mazos: cómo se leen, cómo se escriben y qué forma tienen.
 *
 * Antes esto era un solo archivo de tres concerns —catálogo público, mazos
 * propios y progreso— sin ninguna escritura, porque las escrituras vivían
 * dentro de las pantallas. Ahora cada archivo tiene un motivo:
 *
 * - `catalog.ts` : el catálogo público. Lo que cualquiera puede leer.
 * - `read.ts`    : la biblioteca. Lo que es tuyo, y la papelera.
 * - `progress.ts`: el progreso de las tarjetas que ya estudiaste.
 * - `write.ts`   : inserciones, updates y borrados. Lo que se cambia.
 * - `rows.ts`    : la forma exacta de una fila y sus reglas.
 * - `paths.ts`   : a dónde lleva cada mazo.
 *
 * Quien importa algo de aquí lo hace desde el barril, así que las rutas siguen
 * diciendo `~/lib/decks` y no tienen que saber en qué archivo está cada cosa.
 */

export {
  getPublicDeckBySlug,
  listPublicDecks,
  type PublicDeck,
} from "./catalog";
export { deckEditHref, deckHref, deckPublicHref } from "./paths";
export { getProgressForCards, listMyProgress } from "./progress";
export {
  getMyDeck,
  type LibraryDeck,
  listMyDecks,
  listMyQuickAddDecks,
  listMyTrashedDecks,
  type QuickAddDeck,
} from "./read";
export {
  CARD_COLUMNS,
  CARD_EDITABLE_FIELDS,
  type CardDraft,
  type CardEditableField,
  type CardRow,
  DECK_COLUMNS,
  type DeckBrief,
  type DeckRow,
  deckTargetLanguage,
  toCardRow,
  toCardRows,
  toDeckRow,
} from "./rows";

export {
  appendCard,
  type CardEdit,
  createDeck,
  createDeckWithCards,
  type DeckWriteResult,
  deleteCard,
  deleteDeck,
  discardDeck,
  nextCardPosition,
  restoreDeck,
  trashDeck,
  updateDeck,
  updateDeckCards,
} from "./write";
