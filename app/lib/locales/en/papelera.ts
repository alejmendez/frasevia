import type { Messages } from "../types";

/**
 * The trash: decks that were trashed and can be brought back.
 *
 * It is a screen of its own and not a section of the library because what lives
 * here is no longer in use: decks waiting for a decision, and hiding them in a
 * dropdown is the surest way for nobody to see them again.
 */
export const papelera = {
  "papelera.metaTitle": "Trash — Frasevia",
  "papelera.eyebrow": "Trash",
  "papelera.title": "What you sent to the trash",
  "papelera.description":
    "The decks you deleted are still here, with their cards and the progress you tracked. You can bring them back or delete them for good.",
  "papelera.back": "Back to the library",
  "papelera.emptyTitle": "The trash is empty",
  "papelera.emptyDescription":
    "When you send a deck to the trash it shows up here, so you can get it back.",
  "papelera.loadErrorTitle": "The trash could not be loaded",
  "papelera.deletedOn": "In the trash since {date}",
  "papelera.restore": "Restore",
  "papelera.restoreTitle": "Bring «{title}» back to your library?",
  "papelera.restoreBody":
    "The deck comes back with its cards and with the progress you tracked on them.",
  "papelera.restoreConfirm": "Restore the deck",
  "papelera.deleteForever": "Delete for good",
  "papelera.deleteForeverTitle": "Delete «{title}» for good?",
  "papelera.deleteForeverBody":
    "The deck, its cards and the progress you tracked on them are deleted. This cannot be undone.",
  "papelera.deleteForeverConfirm": "Delete for good",
  "papelera.deckRestored": "The deck is back in your library.",
  "papelera.deckDeleted": "The deck was deleted for good.",
} satisfies Messages;
