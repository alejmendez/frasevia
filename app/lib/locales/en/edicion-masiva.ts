import type { Messages } from "../types";

/**
 * Bulk editing with JSON.
 *
 * A deck is exported as a list of cards in JSON, that list is handed to a
 * language model and whatever comes back is pasted in. These keys are the
 * instructions for that round trip, and also what the model is told.
 */
export const edicionMasiva = {
  "edicionMasiva.button": "Bulk edit with JSON",
  "edicionMasiva.title": "Edit the deck with JSON",
  "edicionMasiva.description":
    "Copy the deck's cards, give them to a language model and paste here whatever it gives you back.",
  "edicionMasiva.step1": "Copy the JSON with the button below.",
  "edicionMasiva.step2":
    "Give it to a language model, with the instructions, and ask it for the changes.",
  "edicionMasiva.step3": "Paste what it returns here and save.",
  "edicionMasiva.jsonLabel": "JSON of the cards",
  "edicionMasiva.rules":
    "Cards that aren't in the JSON are left as they are. Cards without an identifier are added at the end of the deck.",
  "edicionMasiva.copyForAi": "Copy for the AI",
  "edicionMasiva.copyJson": "Copy just the JSON",
  "edicionMasiva.copied": "Copied",
  "edicionMasiva.copyFailed":
    "The browser wouldn't let us copy. Select the JSON in the box and copy it by hand.",
  "edicionMasiva.apply": "Save the changes",
  "edicionMasiva.saving": "Saving…",
  "edicionMasiva.applied": "Cards updated: {updated}. Cards added: {created}.",
  "edicionMasiva.prompt":
    "This is the JSON of the cards of a Frasevia deck. Give me back only the JSON, with the same objects in the same order, but with the values fixed: fill in whatever is between square brackets with real content, keep the language and the style of the rest, and don't change the identifiers. If a card needs new text, write it in the same field.",
  "edicionMasiva.error.invalidJson": "That isn't valid JSON.",
  "edicionMasiva.error.notAList": "The JSON has to be a list of cards.",
  "edicionMasiva.error.empty": "The list of cards is empty.",
  "edicionMasiva.error.notACard": "Entry {index} isn't a card.",
  "edicionMasiva.error.missingFields":
    "Card {index} has no term or no meaning.",
  "edicionMasiva.error.tooLong":
    "Card {index} has text that's longer than the database allows.",
  "edicionMasiva.error.badKind":
    "Card {index} has a card type that doesn't exist.",
  "edicionMasiva.error.unknownCard":
    "Card {cardId} doesn't exist in this deck.",
} satisfies Messages;
