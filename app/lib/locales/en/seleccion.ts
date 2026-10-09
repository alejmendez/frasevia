import type { Messages } from "../types";

/**
 * The quick save menu for selected text.
 */
export const seleccion = {
  "selection.menuLabel": "Actions for selected text",
  "selection.addToDeck": "Add to a deck",
  "selection.closeMenu": "Close menu",
  "selection.dialogTitle": "Save for review",
  "selection.dialogDescription":
    "Frasevia will suggest a translation with your OpenRouter key. You can edit it before saving.",
  "selection.selectedLanguage": "The selected text is in",
  "selection.english": "English",
  "selection.spanish": "Spanish",
  "selection.destinationDeck": "Save to",
  "selection.createDeck": "Create a new deck",
  "selection.newDeckName": "Deck name",
  "selection.newDeckPlaceholder": "For example, Quick review",
  "selection.translationRequired":
    "Enter the English word and its Spanish translation.",
  "selection.translationTooLong":
    "English text can be up to 200 characters and Spanish text up to 400.",
  "selection.translating": "Getting a translation suggestion…",
  "selection.suggestionReady":
    "Suggestion ready. You can edit it before saving.",
  "selection.translationNeedsKey":
    "Add an OpenRouter key in AI settings to get a suggestion. You can also enter the translation manually.",
  "selection.configureAi": "Set up AI",
  "selection.translationTooLongForSuggestion":
    "Automatic suggestions support selections up to 200 characters. You can enter the translation manually.",
  "selection.translationSuggestionFailed":
    "Couldn't suggest a translation. You can enter one manually.",
  "selection.deckUnavailable": "That deck is no longer available.",
  "selection.sessionUnavailable":
    "Your session expired. Sign in to save this word.",
  "selection.deckNameRequired": "Enter a name for the new deck.",
  "selection.deckNameTooLong":
    "That deck name is too long. Use fewer than 120 characters.",
  "selection.saveFailed": "The word couldn't be saved. Please try again.",
  "selection.deckLoadError":
    "Your decks couldn't be loaded. You can create a new one.",
  "selection.saving": "Saving…",
  "selection.save": "Save word",
  "selection.savedTitle": "Word saved",
  "selection.saved": "You can now review it in “{deck}”.",
  "selection.practiceNow": "Practice now",
} satisfies Messages;
