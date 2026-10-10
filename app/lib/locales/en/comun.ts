import type { Messages } from "../types";

/**
 * Common wording, the study type, general review and the sample deck.
 *
 * These keys don't live in the screen they talk about but in several at once:
 * `studyMode.*` shows up when creating a deck, editing one and filtering the
 * library, and `general.*` in the four study practices. That's why they're here
 * rather than in the screen where they're seen most.
 *
 * The sample texts from the landing page (`inicio.demoGeneral*`) are not
 * translated: they are the sample deck's content, and the interface language
 * isn't the content language. In a book written in Spanish, quotes in English stay
 * in English.
 */
export const comun = {
  "common.loading": "Loading…",
  "common.cancel": "Cancel",
  "common.done": "Done",
  "common.delete": "Delete",
  "common.deleting": "Deleting…",
  "common.noSupabaseEnv":
    "Supabase is not set up in your environment variables.",

  "theme.toDark": "Switch to dark mode",
  "theme.toLight": "Switch to light mode",

  "error.title": "Something went wrong",
  "error.message": "An unexpected error happened.",
  "error.notFoundTitle": "We couldn't find this page",
  "error.notFoundMessage":
    "The address may be mistyped, or the content may no longer be available.",
  "error.backHome": "Back to the start",
  "error.shortTitle": "Error",

  "configNotice.title": "Supabase is not set up",
  "configNotice.body":
    "Frasevia needs a Supabase connection to read decks, save your library and record your progress. It can't do that yet.",
  "configNotice.lead": "Copy",
  "configNotice.middle":
    "to .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY. Then restart the dev server.",
  "configNotice.note":
    "Meanwhile you can browse the interface, but nothing gets saved.",

  "studyMode.label": "What do you want to study?",
  "studyMode.language": "Languages",
  "studyMode.general": "General review",
  "studyMode.languageHint":
    "Words, phrases and translations to practise a language.",
  "studyMode.generalHint":
    "Questions and answers about anything you want to remember.",
  "studyMode.filterLabel": "Study type",
  "studyMode.all": "All topics",

  "general.contentLanguage": "Content language",
  "general.titlePlaceholder": "E.g. Programming concepts",
  "general.levelHint": "Optional. Add a difficulty or course.",
  "general.levelPlaceholder": "E.g. Introductory, second semester…",
  "general.seedHint":
    "One card per line: question | answer | example or context (optional)",
  "general.seedPlaceholder":
    "Which data structure follows LIFO order? | A stack. | The last element added is the first one removed.",
  "general.front": "Question or concept",
  "general.back": "Answer or explanation",
  "general.concept": "Concept",
  "general.example": "Example or context",
  "general.note": "Note or clarification",
  "general.notePrefix": "Note: ",
  "general.aiConceptHint":
    "Describe the subject and what you want to remember. You can paste your notes as a reference.",
  "general.aiConceptPlaceholder":
    "Data structures: stacks, queues, lists and trees",
  "general.aiExtras": "Include an example and explanation on each card",
  "general.recallHint": "Think of the answer before flipping.",
  "general.reviewHint": "Try to recall the answer before revealing it.",
  "general.choiceMode": "Choose the answer",
  "general.chooseAnswer": "Choose the correct answer.",
  "general.modeDescription.elegir":
    "Choose the correct answer from four options.",
  "general.modeDescription.explorar":
    "Read the questions, answers and their context.",
  "general.modeDescription.revisar":
    "Recall the answer and check it when you reveal it.",
  "general.modeDescription.completar": "Review the question and its answer.",

  "inicio.demoGeneralFront": "Which data structure follows LIFO order?",
  "inicio.demoGeneralBack": "A stack",
  "inicio.demoGeneralContext":
    "The last element added is the first one removed.",
} satisfies Messages;
