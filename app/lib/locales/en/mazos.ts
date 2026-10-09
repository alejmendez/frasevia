import type { Messages } from "../types";

/**
 * Decks: public, manual creation, editing and AI.
 */
export const mazos = {
  "mazoPublico.metaTitle": "Deck — Frasevia",
  "mazoPublico.metaDescription": "A preview of a Frasevia deck.",
  "mazoPublico.badRequest": "Unrecognised request.",
  "mazoPublico.copyAlreadyYours":
    "This deck is already yours. Open it from your library.",
  "mazoPublico.copyNotPublic": "That deck isn't public, so it can't be copied.",
  "mazoPublico.copyGone": "That deck is no longer available.",
  "mazoPublico.copyFailed": "The deck could not be copied. Try again.",
  "mazoPublico.loadErrorTitle": "The deck could not be loaded",
  "mazoPublico.notFoundTitle": "Deck not found",
  "mazoPublico.notFoundBody":
    "The deck may be private, or the address may be mistyped.",
  "mazoPublico.backToCatalog": "Back to the catalog",
  "mazoPublico.backToExplore": "← Explore",
  "mazoPublico.needsSupabase":
    "You need to set up Supabase to copy or study this deck.",
  "mazoPublico.checkingSession": "Checking your session…",
  "mazoPublico.createPrompt":
    "Create an account to copy this deck into your library and record your progress.",
  "mazoPublico.createAccount": "Create an account",
  "mazoPublico.alreadyAccount": "I already have an account",
  "mazoPublico.copying": "Copying…",
  "mazoPublico.copyToLibrary": "Copy to my library",
  "mazoPublico.studyNow": "Study now",
  "mazoPublico.copyNote":
    "The copy is independent: you can edit it without changing this deck.",
  "mazoPublico.previewTitle": "Preview",
  "mazoPublico.noCards": "This deck doesn't have any cards yet.",
  "mazoPublico.note": "Note: ",
  "mazoPublico.hiddenCards": [
    "And {count} more card. Create an account or sign in to see them all and study them.",
    "And {count} more cards. Create an account or sign in to see them all and study them.",
  ],

  "mazoNuevo.metaTitle": "Create a deck — Frasevia",
  "mazoNuevo.eyebrow": "Library",
  "mazoNuevo.title": "Create a deck",
  "mazoNuevo.description":
    "A deck gathers cards on one topic: words, phrases or rules. You can edit it and publish it whenever you want.",
  "mazoNuevo.titleRequired": "Give the deck a title.",
  "mazoNuevo.sessionExpired": "Your session expired. Sign in again.",
  "mazoNuevo.createFailed": "The deck could not be created.",
  "mazoNuevo.seedFailed":
    "The initial cards could not be created ({message}). The deck wasn't saved, so you can fix the text and try again.",
  "mazoNuevo.url": "URL: /mazos/{slug}",
  "mazoNuevo.titlePlaceholder": "English for work meetings",
  "mazoNuevo.levelPlaceholder": "Beginner",
  "mazoNuevo.creating": "Creating…",
  "mazoNuevo.submit": "Create the deck",
  "mazoNuevo.orCreateWithAi": "Or create it with AI from a concept",

  "mazoIa.metaTitle": "Create a deck with AI — Frasevia",
  "mazoIa.reviewTitle": "Review the cards",
  "mazoIa.reviewDescription":
    "{kept} of {total} left. Remove the ones you don't want and save them: afterwards you can edit each one in the deck editor.",
  "mazoIa.modelsLoadFailed": "The model catalog could not be loaded.",
  "mazoIa.generateFailed":
    "Something went wrong while generating the deck. Try another model.",
  "mazoIa.importFailed": "What you pasted could not be read.",
  "mazoIa.cardsSaveFailed":
    "The cards could not be saved ({message}). The deck wasn't created, so you can try again.",
  "mazoIa.clipboardFailed":
    "The browser wouldn't let us copy. Select the text in the box and copy it by hand.",
  "mazoIa.title": "Create a deck with AI",
  "mazoIa.description":
    "Describe a concept and it gives you the cards. You can generate here with an OpenRouter key, or copy a prompt into your own assistant and paste the result back. Both routes end the same way.",
  "mazoIa.errorTitle": "Could not continue",
  "mazoIa.tabsLabel": "How to get the cards",
  "mazoIa.tabGenerate": "Generate here",
  "mazoIa.tabImport": "Import from my assistant",
  "mazoIa.stepConcept": "1. The concept",
  "mazoIa.stepConceptBody":
    "The more specific, the better. “Verbs for negotiating deadlines” gives better cards than “business English”.",
  "mazoIa.fieldConcept": "What should the deck be about?",
  "mazoIa.conceptHint":
    "A sentence is enough. Paste something longer if you want.",
  "mazoIa.conceptPlaceholder":
    "Phrases for postponing something in a work meeting",
  "mazoIa.fieldCardCount": "How many cards",
  "mazoIa.cardCountHint": "Between {min} and {max}.",
  "mazoIa.fieldLevel": "Level",
  "mazoIa.levelHint": "Optional.",
  "mazoIa.levelUnspecified": "Not specified",
  "mazoIa.extrasLabel": "Ask for an example and a usage note on every card",
  "mazoIa.extrasHint":
    "It costs more tokens and takes a bit longer, but the cards are far better for practising.",
  "mazoIa.stepModel": "2. The model",
  "mazoIa.stepModelBody":
    "The catalog is fetched from OpenRouter when the page opens, so there's no list hard-coded in the source that goes stale. It also includes Google, Anthropic and MiniMax models, with no keys for those services.",
  "mazoIa.fieldModel": "Model",
  "mazoIa.modelHint":
    "If the catalog doesn't load, type the identifier by hand: any text is accepted.",
  "mazoIa.modelsErrorTitle": "The catalog could not be loaded",
  "mazoIa.retry": "Try again",
  "mazoIa.showModels": "See the {count} available models",
  "mazoIa.filterModelsPlaceholder": "Filter: gemini, claude, minimax, gpt…",
  "mazoIa.filterModelsLabel": "Filter models",
  "mazoIa.noJsonTitle":
    "No JSON output support. The reply arrives with text around it and is still read fine.",
  "mazoIa.noJson": "no JSON",
  "mazoIa.noModelMatch": "No model matches “{query}”.",
  "mazoIa.loadingModels": "Loading the model catalog…",
  "mazoIa.missingKeyTitle": "The OpenRouter key is missing",
  "mazoIa.missingKeyBody":
    "Without a key you can't generate from here. It's stored in this browser and never goes through any server of ours.",
  "mazoIa.addKey": "Add the key",
  "mazoIa.orGetIt": "or get one at",
  "mazoIa.openRouterPanel": "the OpenRouter dashboard",
  "mazoIa.importModeNote":
    "If you'd rather not sign up for anything, import mode works without a key.",
  "mazoIa.generating": "Generating…",
  "mazoIa.generateCards": "Generate cards",
  "mazoIa.hintAddKey": "Add a key, or switch to import mode.",
  "mazoIa.busyNote":
    "Asking OpenRouter for cards. It can take a few seconds, a few more if the model is thinking.",
  "mazoIa.stepImport": "2. Copy the prompt and paste the answer",
  "mazoIa.stepImportBody":
    "No key or account is needed here: generate the JSON with whatever AI you already have open — Claude, Gemini, ChatGPT, MiniMax or anything else — and paste it below.",
  "mazoIa.importStep1": "Copy the prompt.",
  "mazoIa.importStep2":
    "Paste it into your assistant and wait for it to answer.",
  "mazoIa.importStep3Lead": "Copy",
  "mazoIa.importStep3Strong": "only the JSON",
  "mazoIa.importStep3Tail":
    "that it gives you back, with or without a code block, and paste it into the box below.",
  "mazoIa.promptLabel": "Prompt to copy",
  "mazoIa.copied": "Copied",
  "mazoIa.copyPrompt": "Copy the prompt",
  "mazoIa.conceptNeeded": "Write the concept above so the prompt is complete.",
  "mazoIa.fieldAssistant": "Your assistant's answer",
  "mazoIa.fieldAssistantHint":
    "Just the JSON on its own is fine, as is the text around it.",
  "mazoIa.readCards": "Read the cards",

  "review.title": "Cards",
  "review.keptOf": "{kept} of {total}",
  "review.restore": "Restore",
  "review.remove": "Remove",
  "review.saving": "Saving…",
  "review.saveCards": "Save {count} cards",
  "review.discard": "Discard and start over",
  "review.askMore": "Ask for other cards",

  "mazoEditar.metaTitle": "Edit deck",
  "mazoEditar.metaDeck": "Edit {deck}",
  "mazoEditar.noSupabaseShort": "Supabase is not set up.",
  "mazoEditar.titleRequired": "The title can't be left empty.",
  "mazoEditar.deckSaved": "Deck saved.",
  "mazoEditar.cardNeedsFields": "Fill in both sides of the card.",
  "mazoEditar.cardAdded": "Card added.",
  "mazoEditar.cardDeleted": "Card deleted.",
  "mazoEditar.unknownAction": "Unrecognised action.",
  "mazoEditar.nothingToSave": "There were no changes to save.",
  "mazoEditar.cardsNeedFields": "Every card needs content on both sides.",
  "mazoEditar.cardsSaved": "Cards saved.",
  "mazoEditar.copyTag": "Copy",
  "mazoEditar.publicPage": "See public page",
  "mazoEditar.officialTitle": "Read-only official deck",
  "mazoEditar.officialBody":
    "The official content is maintained by the Frasevia team. If you want to change it,",
  "mazoEditar.makeCopy": "make a copy",
  "mazoEditar.officialTail": "and edit it in your library.",
  "mazoEditar.deckData": "Deck details",
  "mazoEditar.publicNotice":
    "While it's public, anyone with the link can read it and copy it to their library.",
  "mazoEditar.saveDeck": "Save deck",
  "mazoEditar.cardsHeading": "Cards ({count})",
  "mazoEditar.noCardsYet":
    "This deck doesn't have any cards yet. Add the first one with the form above.",
  "mazoEditar.saveCards": "Save cards",
  "mazoEditar.deleteDeckTitle": "Delete «{title}»?",
  "mazoEditar.deleteDeckBody":
    "The deck, its cards and the progress you recorded on them are all deleted. This can't be undone.",
  "mazoEditar.deleteDeckConfirm": "Delete the deck",
  "mazoEditar.deleteDeckTrigger": "Delete this deck",
  "mazoEditar.deleteCardTitle": "Delete this card?",
  "mazoEditar.deleteCardBody":
    "The card and the progress you recorded on it are both deleted.",
  "mazoEditar.deleteCardTrigger": "Delete this card",
  "mazoEditar.addCardTitle": "Add a card",
  "mazoEditar.fieldTerm": "English term",
  "mazoEditar.fieldMeaning": "Meaning in Spanish",
  "mazoEditar.fieldKind": "Type",
  "mazoEditar.fieldTags": "Tags",
  "mazoEditar.tagsHint": "Separated by commas.",
  "mazoEditar.fieldExampleEn": "Example in English",
  "mazoEditar.fieldExampleEs": "Translation of the example",
  "mazoEditar.fieldUsageNote": "Usage note",
  "mazoEditar.addCardSubmit": "Add card",
  "mazoEditar.createdOn": "Card created on {date}",

  "deckField.title": "Title",
  "deckField.description": "Description",
  "deckField.descriptionHint":
    "Say what the deck is about. It shows in the catalog.",
  "deckField.descriptionHintPublic":
    "It shows in the catalog when the deck is public.",
  "deckField.descriptionHintReview":
    "It shows in the catalog if you publish it.",
  "deckField.sourceLanguage": "Source language",
  "deckField.targetLanguage": "Language being learned",
  "deckField.cardLanguage": "Card language",
  "deckField.translationLanguage": "Translation language",
  "deckField.level": "Approximate level",
  "deckField.levelHint": "A rough idea, not a certification.",
  "deckField.visibility": "Visibility",
  "visibility.option.private": "Private, just me",
  "visibility.option.public": "Public, shows up in Explore",
  "deckField.seed": "First batch of cards (optional)",
  "deckField.seedHint":
    "One card per line, in this format: term | meaning in Spanish | example in English | translation of the example",

  "language.es": "Spanish",
  "language.en": "English",
  "language.pt": "Portuguese",
  "language.fr": "French",
  "language.de": "German",
  "level.beginner": "Beginner",
  "level.intermediate": "Intermediate",
  "level.advanced": "Advanced",
  "level.unspecified": "No specific level",
} satisfies Messages;
