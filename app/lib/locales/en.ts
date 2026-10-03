import type { SpanishMessages } from "./es";

/**
 * Catálogo en inglés.
 *
 * Está tipado como `SpanishMessages`, que es el tipo exacto que sale de `es.ts`:
 * si allí hay una clave y aquí falta, el error sale al compilar. Esa es la razón
 * de que el orden de este archivo sea el del español y no el que más suene: dos
 * catálogos se comparan mucho mejor en paralelo si comparten estructura.
 *
 * Los plurales van en la tupla `[singular, plural]`, igual que en español, y
 * solo hay dos formas porque con dos idiomas eso es lo que hace falta.
 */
export const en: SpanishMessages = {
  // -------------------------------------------------------------------------
  // Común
  // -------------------------------------------------------------------------
  "common.loading": "Loading…",
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.deleting": "Deleting…",
  "common.noSupabaseEnv":
    "Supabase is not set up in your environment variables.",

  // -------------------------------------------------------------------------
  // Tema claro / noche
  // -------------------------------------------------------------------------
  "theme.toDark": "Switch to dark mode",
  "theme.toLight": "Switch to light mode",

  // -------------------------------------------------------------------------
  // Errores de página
  // -------------------------------------------------------------------------
  "error.title": "Something went wrong",
  "error.message": "An unexpected error happened.",
  "error.notFoundTitle": "We couldn't find this page",
  "error.notFoundMessage":
    "The address may be mistyped, or the content may no longer be available.",
  "error.backHome": "Back to the start",
  "error.shortTitle": "Error",

  // -------------------------------------------------------------------------
  // Aviso de Supabase sin configurar
  // -------------------------------------------------------------------------
  "configNotice.title": "Supabase is not set up",
  "configNotice.body":
    "Frasevia needs a Supabase connection to read decks, save your library and record your progress. It can't do that yet.",
  "configNotice.lead": "Copy",
  "configNotice.middle":
    "to .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY. Then restart the dev server.",
  "configNotice.note":
    "Meanwhile you can browse the interface, but nothing gets saved.",

  // -------------------------------------------------------------------------
  // Barra y pie (root)
  // -------------------------------------------------------------------------
  "app.opening": "Opening Frasevia…",
  "app.navigating": "Navigating",
  "nav.primary": "Main",
  "nav.explore": "Explore",
  "nav.progress": "My progress",
  "nav.library": "My library",
  "nav.reviewSettings": "Review settings",
  "account.unconfigured": "Not set up",
  "account.signIn": "Sign in",
  "account.signUp": "Sign up",
  "account.yourAccount": "Your account",
  "account.signOut": "Sign out",
  "footer.tagline": "Frasevia — learn English from phrases people really said.",
  "footer.exploreDecks": "Explore decks",

  // -------------------------------------------------------------------------
  // Acceso con Google
  // -------------------------------------------------------------------------
  "google.disabled":
    "Google sign-in isn't available right now. You can sign in with your email and password.",
  "google.divider": "or",
  "google.opening": "Opening Google…",
  "google.privacy":
    "Google shares only your email and your name. Frasevia does not access your email or your contacts.",
  "google.labelContinue": "Continue with Google",
  "google.labelSignUp": "Sign up with Google",
  "google.errorParseUrl":
    "Google sign-in could not be prepared. Check VITE_SUPABASE_URL.",
  "google.errorNetwork": "Could not reach Supabase. Check your connection.",

  // -------------------------------------------------------------------------
  // Portada
  // -------------------------------------------------------------------------
  "inicio.metaTitle": "Frasevia — learn English from useful phrases",
  "inicio.metaDescription":
    "English decks with real examples for Spanish speakers. Explore, build your own decks and track your progress.",
  "inicio.eyebrow": "A little each day",
  "inicio.titleLead": "Think. Flip.",
  "inicio.titleAccent": " Remember",
  "inicio.body":
    "Learn English with cards that feel like paper. Recall the answer and choose when to review it again.",
  "inicio.ctaExplore": "Explore decks",
  "inicio.ctaSignUp": "Create an account",
  "inicio.cardsTitle": "Recall it before you look",
  "inicio.cardsBody":
    "Read the prompt, think of your answer and flip the card when you're ready.",
  "inicio.pillar1.title": "Cards with context",
  "inicio.pillar1.body":
    "Every word or phrase brings its example, its translation and a usage note, so the context lands before the definition does.",
  "inicio.pillar2.title": "One prompt, one answer",
  "inicio.pillar2.body":
    "Mental recall keeps practice direct: remember, compare and choose when to return.",
  "inicio.pillar3.title": "At your own pace",
  "inicio.pillar3.body":
    "No timer and no required streaks. You decide when each card comes back.",
  "inicio.startTitle": "Start with the basics deck",
  "inicio.startBody":
    "Greetings, introductions, basic questions, numbers, schedules and the verbs you use every day.",
  "inicio.tagBasics": "English from the basics",
  "inicio.tagDevs": "English for developers",
  "inicio.seeCatalog": "See the catalog",
  "inicio.ctaTry": "Try a card",
  "inicio.ctaTurn": "Reveal answer",
  "inicio.ctaFront": "Back to the front",
  "inicio.ctaLibrary": "Go to my library",
  "inicio.noStreaks": "At your own pace, with no required streaks.",
  "inicio.demoDirection": "SPANISH → ENGLISH",
  "inicio.demoQuestion": "How would you say it in English?",
  "inicio.demoHint": "Think of the answer before you flip.",
  "inicio.demoAnswerLabel": "ANSWER",
  "inicio.demoMeaning": "What is the base salary for this role?",
  "inicio.stepRemember": "Recall",
  "inicio.stepRememberBody": "Read the Spanish prompt and think of the answer.",
  "inicio.stepFlip": "Flip the card",
  "inicio.stepFlipBody": "Reveal the answer when you're ready.",
  "inicio.stepSchedule": "Choose the next review",
  "inicio.stepScheduleBody": "Frasevia helps you return at the right time.",
  "inicio.deckBasicsLabel": "A good place to start",
  "inicio.deckBasicsBody":
    "Greetings, introductions and useful everyday phrases.",
  "inicio.deckDevsLabel": "For work",
  "inicio.deckDevsBody":
    "Vocabulary and phrases for meetings, projects and interviews.",
  "inicio.openDeck": "View deck",

  // -------------------------------------------------------------------------
  // Iniciar sesión
  // -------------------------------------------------------------------------
  "signIn.metaTitle": "Sign in — Frasevia",
  "signIn.title": "Sign in",
  "signIn.description":
    "Sign in to practise, save your library and copy decks.",
  "signIn.oauthTitle": "Google sign-in did not complete",
  "signIn.oauthBody":
    "The permission may have been cancelled, or Google sign-in may not be enabled on the project. Try again, or sign in with your email and password.",
  "signIn.fieldEmail": "Email address",
  "signIn.fieldPassword": "Password",
  "signIn.invalidCredentials": "The email or the password is not correct.",
  "signIn.signingIn": "Signing in…",
  "signIn.forgot": "Forgot your password?",
  "signIn.noAccountYet": "Don't have an account yet?",
  "signIn.createOne": "Create one",

  // -------------------------------------------------------------------------
  // Crear una cuenta
  // -------------------------------------------------------------------------
  "signUp.metaTitle": "Create an account — Frasevia",
  "signUp.title": "Create an account",
  "signUp.description":
    "Your account stores the library, the progress of each card and the copies of the decks you copy.",
  "signUp.passwordTooShort": "The password needs at least 8 characters.",
  "signUp.passwordHint": "At least 8 characters.",
  "signUp.checkEmail":
    "Check your email: we sent you a link to confirm the account. Once you open it you can sign in.",
  "signUp.creating": "Creating the account…",
  "signUp.submit": "Create the account",
  "signUp.haveAccount": "Already have an account?",
  "signUp.signInLink": "Sign in",

  // -------------------------------------------------------------------------
  // Recuperar contraseña
  // -------------------------------------------------------------------------
  "reset.metaTitle": "Reset password — Frasevia",
  "reset.title": "Reset password",
  "reset.newTitle": "Choose a new password",
  "reset.body":
    "Enter your email and we'll send you a link to change your password.",
  "reset.newBody": "You're using the link we emailed you.",
  "reset.linkWorked":
    "Done, the link worked. Enter a new password for your account.",
  "reset.emailSent":
    "If that email has an account, we've sent you a link to change the password.",
  "reset.updated": "Password updated. You can sign in now.",
  "reset.fieldNewPassword": "New password",
  "reset.saving": "Saving…",
  "reset.savePassword": "Save password",
  "reset.sending": "Sending…",
  "reset.sendLink": "Send link",
  "reset.backToSignIn": "Back to sign in",

  // -------------------------------------------------------------------------
  // Explorar
  // -------------------------------------------------------------------------
  "explorar.metaTitle": "Explore decks — Frasevia",
  "explorar.metaDescription":
    "Public English decks with examples and translations into Spanish.",
  "explorar.eyebrow": "Public catalog",
  "explorar.title": "Explore decks",
  "explorar.description":
    "Decks from other people and the official Frasevia decks. You can copy the ones you like into your own library.",
  "explorar.searchLabel": "Search decks",
  "explorar.searchPlaceholder": "Search by title or description",
  "explorar.searchButton": "Search",
  "explorar.clear": "Clear",
  "explorar.noSupabaseTitle": "No Supabase connection",
  "explorar.noSupabaseBody":
    "The catalog could not be read because VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are missing from your .env.",
  "explorar.loadErrorTitle": "The catalog could not be loaded",
  "explorar.emptyResultsTitle": "No results",
  "explorar.emptyNoDecksTitle": "There are no public decks yet",
  "explorar.emptyResultsBody":
    "No deck matches “{query}”. Try a different word.",
  "explorar.emptyNoDecksBody":
    "Be the first to share a deck: make your own and publish it.",
  "explorar.seeAll": "See all",
  "explorar.createFirst": "Create my first deck",

  // -------------------------------------------------------------------------
  // Biblioteca
  // -------------------------------------------------------------------------
  "biblioteca.metaTitle": "My library — Frasevia",
  "biblioteca.eyebrow": "A little each day",
  "biblioteca.title": "Your English, one card at a time",
  "biblioteca.description": "A little review to keep moving forward.",
  "biblioteca.createWithAi": "Create with AI",
  "biblioteca.createDeck": "Create a deck",
  "biblioteca.createWithAiLong": "Create a deck with AI",
  "biblioteca.createManual": "Create a deck by hand",
  "biblioteca.loadErrorTitle": "Your library could not be loaded",
  "biblioteca.emptyTitle": "Your library is empty",
  "biblioteca.emptyDescription":
    "Build a deck from your own words and phrases, or copy one of the public decks to change it however you like.",
  "biblioteca.noCards": "No cards yet",
  "biblioteca.notPracticed": "Not practised yet",
  "biblioteca.progressAria": "{learned} of {total} cards learned in {deck}",
  "biblioteca.progressLine": [
    "{learned} learned · {learning} practising",
    "{learned} learned · {learning} practising",
  ],
  "biblioteca.official": "Official",
  "biblioteca.published": "Published",
  "biblioteca.private": "Private",
  "biblioteca.copied": "Copied",
  "biblioteca.edit": "Edit",
  "biblioteca.study": "Study",
  "biblioteca.todayReview": "Your review today",
  "biblioteca.pendingHeadline": [
    "{count} card ready to review",
    "{count} cards ready to review",
  ],
  "biblioteca.noPendingHeadline": "Keep moving at your own pace",
  "biblioteca.pendingDescription":
    "Start with the cards that need a little more practice.",
  "biblioteca.nextReviewSummary": "Your next review is {date}.",
  "biblioteca.noPendingDescription": [
    "You have {count} new card to discover.",
    "You have {count} new cards to discover.",
  ],
  "biblioteca.reviewPending": "Review due cards",
  "biblioteca.reviewSettings": "Review settings",
  "biblioteca.upcomingReviews": "Upcoming reviews",
  "biblioteca.noUpcoming": "You don't have any reviews scheduled yet.",
  "biblioteca.today": "Today",
  "biblioteca.tomorrow": "Tomorrow",
  "biblioteca.cardCount": ["{count} card", "{count} cards"],
  "biblioteca.myDecks": "My decks",
  "biblioteca.deckCount": ["{count} deck", "{count} decks"],
  "biblioteca.searchLabel": "Search decks",
  "biblioteca.searchPlaceholder": "Search decks…",
  "biblioteca.filtersLabel": "Filter decks",
  "biblioteca.filter.all": "All",
  "biblioteca.filter.private": "Private",
  "biblioteca.filter.public": "Public",
  "biblioteca.noSearchResults": "No decks match that search",
  "biblioteca.noSearchResultsHint":
    "Try another search or create a deck to get started.",
  "biblioteca.completeDescription": "Complete description",
  "biblioteca.exploreCommunity": "Explore community decks",
  "biblioteca.reviewStatsUnavailable": "Review counts could not be loaded.",
  "biblioteca.reviewStatsUnavailableBody":
    "Check the review migrations in README.md and apply them in Supabase to load your statistics and queue.",
  "biblioteca.upcomingUnavailable": "The review calendar could not be loaded.",
  "biblioteca.dueCount": ["{count} due", "{count} due"],
  "biblioteca.newCount": ["{count} new", "{count} new"],
  "biblioteca.scheduledCount": ["{count} scheduled", "{count} scheduled"],
  "biblioteca.reviewDeck": ["Review {count}", "Review {count}"],
  "biblioteca.learnNew": ["Learn {count} new card", "Learn {count} new cards"],
  "biblioteca.addCards": "Add cards",
  "biblioteca.viewDeck": "View deck",
  "biblioteca.lastReview": "Last review: {date}",
  "biblioteca.lastPractice": "Last practice: {date}",

  // -------------------------------------------------------------------------
  // Tarjeta de mazo
  // -------------------------------------------------------------------------
  "deck.noDescription": "No description.",
  "deck.by": "By {author}",

  // -------------------------------------------------------------------------
  // Etiquetas de datos
  // -------------------------------------------------------------------------
  "label.visibility.private": "Private",
  "label.visibility.public": "Public",
  "label.cardKind.word": "Word",
  "label.cardKind.phrase": "Phrase",
  "label.cardKind.question": "Question",
  "label.cardKind.rule": "Rule",
  "label.progress.new": "New",
  "label.progress.learning": "Practising",
  "label.progress.mastered": "Learned",
  "format.cardCount": ["{count} card", "{count} cards"],
  "format.percent": "{value}%",
  "time.noRecord": "not recorded",
  "time.justNow": "just now",

  // -------------------------------------------------------------------------
  // Progreso
  // -------------------------------------------------------------------------
  "progreso.metaTitle": "My progress — Frasevia",
  "progreso.eyebrow": "Your progress",
  "progreso.title": "My progress",
  "progreso.description":
    "What you've practised so far. There are no streaks or deadlines: the point is to see what sticks and what's worth reviewing.",
  "progreso.goLibrary": "Go to the library",
  "progreso.loadErrorTitle": "Your progress could not be loaded",
  "progreso.emptyTitle": "No progress recorded yet",
  "progreso.emptyDescription":
    "Once you practise a deck, you'll see here how many cards you've learned, which ones you're still practising, and when the last session was.",
  "progreso.chooseDeck": "Pick a deck",
  "progreso.statPracticed": "Practised",
  "progreso.statLearned": "Learned",
  "progreso.statLearning": "Practising",
  "progreso.statLastSession": "Last session",
  "progreso.totalAria": "{learned} of {total} cards learned",
  "progreso.keepPracticing": "Keep practising",
  "progreso.deckLine": [
    "{learned} learned of {total} practised",
    "{learned} learned of {total} practised",
  ],
  "progreso.score": "{correct}/{attempts} correct",

  // -------------------------------------------------------------------------
  // Estudiar
  // -------------------------------------------------------------------------
  "estudiar.metaTitle": "Study",
  "estudiar.metaDeck": "Study {deck}",
  "estudiar.deckNotFound": "Deck not found",
  "estudiar.sessionExpired": "Your session expired.",
  "estudiar.badResults": "The session could not be read.",
  "estudiar.badReview": "Some information is missing to save this review.",
  "estudiar.nothingToSave": "There was nothing to save.",
  "estudiar.saved": "Progress saved.",
  "estudiar.backLibrary": "← My library",
  "estudiar.pendingTitle": "Pending review",
  "estudiar.recallTitle": "Recall it before you look",
  "estudiar.recallSubtitle": "Think of the answer. Then flip the card.",
  "estudiar.otherPractices": "Other practice modes",
  "estudiar.otherPracticesHint":
    "Explore, choose an answer or fill in a phrase.",
  "estudiar.pendingLabel": "Due",
  "estudiar.newLabel": "New",
  "estudiar.direction": "{source} → {target}",
  "estudiar.promptEnglish": "How would you say it in English?",
  "estudiar.promptSpanish": "How would you say it in Spanish?",
  "estudiar.recallHint": "Recall the full expression.",
  "estudiar.responseLabel": "ANSWER",
  "estudiar.toFlip": "to flip the card",
  "estudiar.ratingQuestion": "How easy was it to remember?",
  "estudiar.ratingShortcutHint": "Press 1–{count} to choose a level.",
  "estudiar.noActiveLevels": "Turn on at least one level to schedule a review.",
  "estudiar.intervalMinutes": "In {amount} min",
  "estudiar.intervalHours": "In {amount} hours",
  "estudiar.intervalDays": "In {amount} days",
  "estudiar.tomorrow": "Tomorrow",
  "estudiar.noFurtherReviews": "Do not review again",
  "estudiar.retiredCanReturn": "You can reactivate retired cards later.",
  "estudiar.retiredConfirmation": "Card removed from automatic review.",
  "estudiar.saveFailedGeneric": "The review could not be saved.",
  "estudiar.retrySameCard": "The card is still here. You can try again.",
  "estudiar.nextReview": "Next review: {date}",
  "estudiar.nothingDue": "No cards are due",
  "estudiar.nothingToPractice": "There are no cards to review right now",
  "estudiar.changeIntervals": "Change intervals",
  "estudiar.reviewedCount": [
    "You reviewed {count} card.",
    "You reviewed {count} cards.",
  ],
  "estudiar.reviewedBefore": "Reviewed {count} times.",
  "estudiar.level.difficult": "Difficult",
  "estudiar.level.normal": "Normal",
  "estudiar.level.easy": "Easy",
  "estudiar.level.veryEasy": "Very easy",
  "estudiar.emptyDeckTitle": "This deck has no cards",
  "estudiar.emptyDeckLead": "There's nothing to practise yet.",
  "estudiar.addCards": "Add cards",
  "estudiar.emptyDeckTail": "and try again.",
  "estudiar.adjustedTitle": "We adjusted the practice",
  "estudiar.counter": "{index} of {total}",
  "estudiar.sessionAria": "Session progress: {index} of {total}",
  "estudiar.modeLegend": "How you want to practise",
  "estudiar.stateMastered": "Learned",
  "estudiar.stateLearning": "Practising",
  "estudiar.stateNew": "New",
  "estudiar.score": "{correct} of {attempts} correct",
  "estudiar.usageNote": "Usage note: ",
  "estudiar.continue": "Continue",
  "estudiar.reviewHint": "Try to recall the translation before revealing it.",
  "estudiar.didYouKnow": "Did you know it?",
  "estudiar.knewIt": "Yes, I knew it",
  "estudiar.almost": "Almost",
  "estudiar.didNotKnow": "I didn't know it",
  "estudiar.reveal": "Reveal answer",
  "estudiar.whatMeaning": "How do you say it in the other language?",
  "estudiar.correctAnswer": "Correct: {meaning}",
  "estudiar.wasAnswer": "The answer was «{meaning}».",
  "estudiar.fillInstruction":
    "Complete the sentence with the missing word or expression.",
  "estudiar.answerLabel": "Your answer",
  "estudiar.answerPlaceholder": "Type the answer in English",
  "estudiar.answerPlaceholderSpanish": "Type the answer in Spanish",
  "estudiar.correctTyped":
    "Correct! It doesn't matter whether you typed capitals or a full stop.",
  "estudiar.wasTerm": "It was «{term}».",
  "estudiar.check": "Check",
  "estudiar.sessionDone": "Session finished",
  "estudiar.statPracticed": "Practised",
  "estudiar.statCorrect": "Correct",
  "estudiar.statAccuracy": "Accuracy",
  "estudiar.keepPracticingTitle": "To keep practising",
  "estudiar.repeat": "Repeat the session",
  "estudiar.seeProgress": "See my progress",
  "estudiar.backToLibrary": "Back to the library",
  "estudiar.savingProgress": "Saving your progress…",
  "estudiar.saveFailed": "Could not save: {message}",

  // Avisos del motor de estudio
  "engine.notice.empty": "This deck doesn't have any cards yet.",
  "engine.notice.tooFewForChoice":
    "With so few cards there aren't enough alternatives to choose between, so we'll do a review instead.",
  "engine.notice.noFillInTheBlank":
    "No card has its term inside its example, so we'll do a review instead.",
  "engine.mode.elegir": "Choose the meaning",
  "engine.mode.completar": "Complete the sentence",
  "engine.mode.revisar": "Review",
  "engine.mode.explorar": "Explore",
  "engine.modeDescription.elegir":
    "Pick the right translation out of four options.",
  "engine.modeDescription.completar":
    "Type the word or phrase missing from the sentence.",
  "engine.modeDescription.revisar":
    "Look at the card, reveal the answer and say whether you knew it.",
  "engine.modeDescription.explorar":
    "Read the content with its example and its usage note.",

  // -------------------------------------------------------------------------
  // Mazo público
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Crear mazo a mano
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Crear mazo con IA
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Revisión de tarjetas generadas
  // -------------------------------------------------------------------------
  "review.title": "Cards",
  "review.keptOf": "{kept} of {total}",
  "review.restore": "Restore",
  "review.remove": "Remove",
  "review.saving": "Saving…",
  "review.saveCards": "Save {count} cards",
  "review.discard": "Discard and start over",
  "review.askMore": "Ask for other cards",

  // -------------------------------------------------------------------------
  // Editar mazo
  // -------------------------------------------------------------------------
  "mazoEditar.metaTitle": "Edit deck",
  "mazoEditar.metaDeck": "Edit {deck}",
  "mazoEditar.noSupabaseShort": "Supabase is not set up.",
  "mazoEditar.titleRequired": "The title can't be left empty.",
  "mazoEditar.deckSaved": "Deck saved.",
  "mazoEditar.cardNeedsFields": "The card needs a term and its meaning.",
  "mazoEditar.cardAdded": "Card added.",
  "mazoEditar.cardDeleted": "Card deleted.",
  "mazoEditar.unknownAction": "Unrecognised action.",
  "mazoEditar.nothingToSave": "There were no changes to save.",
  "mazoEditar.cardsNeedFields": "Every card needs a term and its meaning.",
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

  // -------------------------------------------------------------------------
  // Campos de mazo (compartidos por crear, editar y revisar)
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Idiomas y niveles que se ofrecen al crear un mazo
  // -------------------------------------------------------------------------
  "language.es": "Spanish",
  "language.en": "English",
  "language.pt": "Portuguese",
  "language.fr": "French",
  "language.de": "German",
  "level.beginner": "Beginner",
  "level.intermediate": "Intermediate",
  "level.advanced": "Advanced",
  "level.unspecified": "No specific level",

  // -------------------------------------------------------------------------
  // Review settings
  // -------------------------------------------------------------------------
  "ajustesRepaso.metaTitle": "Review settings — Frasevia",
  "ajustesRepaso.eyebrow": "My library · Review settings",
  "ajustesRepaso.title": "Review at your own pace",
  "ajustesRepaso.description":
    "You choose when each card returns. Changes apply to future reviews.",
  "ajustesRepaso.backLibrary": "Back to my library",
  "ajustesRepaso.levelsTitle": "Difficulty levels",
  "ajustesRepaso.levelsHint":
    "Choose the name, interval and order of each rating.",
  "ajustesRepaso.name": "Name",
  "ajustesRepaso.action": "Action",
  "ajustesRepaso.actionReview": "Review again",
  "ajustesRepaso.actionRetire": "Remove from review",
  "ajustesRepaso.amount": "Amount",
  "ajustesRepaso.unit": "Interval",
  "ajustesRepaso.minutes": "Minutes",
  "ajustesRepaso.hours": "Hours",
  "ajustesRepaso.days": "Days",
  "ajustesRepaso.color": "Color",
  "ajustesRepaso.retireHint":
    "The card stays in your deck and you can reactivate it later.",
  "ajustesRepaso.deactivate": "Turn off",
  "ajustesRepaso.activate": "Turn on",
  "ajustesRepaso.addLevel": "Add a level",
  "ajustesRepaso.customLevel": "My level",
  "ajustesRepaso.timezone": "Time zone: {timezone}",
  "ajustesRepaso.save": "Save changes",
  "ajustesRepaso.saving": "Saving…",
  "ajustesRepaso.reset": "Reset values",
  "ajustesRepaso.saved": "Changes saved for future reviews.",
  "ajustesRepaso.resetDone": "The four default levels have been restored.",
  "ajustesRepaso.previewTitle": "How it will look while studying",
  "ajustesRepaso.noActivePreview": "Turn on a level to show it during review.",
  "ajustesRepaso.moveUp": "Move {name} up",
  "ajustesRepaso.moveDown": "Move {name} down",
  "ajustesRepaso.level.difficult": "Difficult",
  "ajustesRepaso.level.normal": "Normal",
  "ajustesRepaso.level.easy": "Easy",
  "ajustesRepaso.level.veryEasy": "Very easy",
  "ajustesRepaso.color.coral": "Coral",
  "ajustesRepaso.color.sand": "Sand",
  "ajustesRepaso.color.sage": "Sage",
  "ajustesRepaso.color.lime": "Lime",
  "ajustesRepaso.color.forest": "Forest",
  "ajustesRepaso.color.blue": "Blue",
  "ajustesRepaso.retiredTitle": "Retired cards",
  "ajustesRepaso.retiredDescription":
    "Open a card to look it up, or put it back into automatic review.",
  "ajustesRepaso.noRetired": "You haven't retired any cards yet.",
  "ajustesRepaso.openDeck": "Open deck",
  "ajustesRepaso.reactivate": "Reactivate",
  "ajustesRepaso.reactivating": "Reactivating…",
  "ajustesRepaso.reactivated": "The card is back in the queue as due.",
  "ajustesRepaso.sessionExpired": "Your session expired. Sign in again.",
  "ajustesRepaso.invalidCard": "The card or direction is invalid.",
  "ajustesRepaso.invalidAction": "This action is not recognized.",
  "ajustesRepaso.invalidLevels": "Check the names and intervals before saving.",

  // -------------------------------------------------------------------------
  // Ajustes de IA
  // -------------------------------------------------------------------------
  "ajustesIa.metaTitle": "AI settings — Frasevia",
  "ajustesIa.eyebrow": "Settings",
  "ajustesIa.title": "AI keys",
  "ajustesIa.description":
    "Frasevia ships no keys of its own. You add yours and the app uses it from your browser. You pay, on your account, with your own limits.",
  "ajustesIa.noKeyTitle": "First things first: you don't need one",
  "ajustesIa.noKeyBody":
    "There's another way to generate cards that needs no key: copy a prompt into your own assistant and paste the JSON it gives you back here.",
  "ajustesIa.goCreate": "Go create a deck with AI",
  "ajustesIa.noKeyTail":
    "If you're not going to generate from here, you can ignore this page and no key is kept in your browser at all.",
  "ajustesIa.configured": "Configured · {preview}",
  "ajustesIa.keyHint":
    "It's saved as soon as you type it, so there's nothing to confirm. To remove it, use Forget.",
  "ajustesIa.storageError":
    "This browser wouldn't save the key. Storage may be blocked or full; try a private window, or use import mode, which needs no key.",
  "ajustesIa.forget": "Forget",
  "ajustesIa.getKey": "Get a key",
  "ajustesIa.scopingTitle": "How to keep it safe:",
  "ajustesIa.eraseTitle": "Erase it",
  "ajustesIa.eraseSaved":
    "Forgetting it costs you nothing in your decks: only the key is removed from this browser.",
  "ajustesIa.eraseNone": "There's no key saved in this browser right now.",
  "ajustesIa.forgetYes": "Yes, forget it",
  "ajustesIa.forgetKey": "Forget the key",
  "ajustesIa.whyTitle": "Why there are no other providers here",
  "ajustesIa.whyBody1":
    "Direct generation leaves from the browser, so it only works with services that send CORS headers. They were checked one by one: OpenRouter does, and a single key covers Google, Anthropic and MiniMax models too.",
  "ajustesIa.whyBody1Strong": "MiniMax doesn't work from the browser",
  "ajustesIa.whyBody1Middle":
    "—its API doesn't return those headers— which is why it isn't listed as its own option. If you want to use it, it's in OpenRouter's model catalog or in import mode.",
  "ajustesIa.whyBody2Lead": "And on Claude Code: its subscription credentials",
  "ajustesIa.whyBody2Strong": "are not an API key",
  "ajustesIa.whyBody2Tail":
    "and don't work for this. One isn't needed here, because import mode already uses whatever AI you have open.",

  // -------------------------------------------------------------------------
  // Proveedor de IA
  // -------------------------------------------------------------------------
  "provider.blurb":
    "A single key gives you access to GPT, Claude, Gemini, MiniMax and many more.",
  "provider.keyName": "OpenRouter API key",
  "provider.scoping":
    "In OpenRouter the key can be limited by budget and by allowed referrer; turning on both leaves a stolen key with no room to do damage.",

  // -------------------------------------------------------------------------
  // Errores de generación
  // -------------------------------------------------------------------------
  "generation.detailSuffix": " Detail: {detail}",
  "generation.invalidKey":
    "The OpenRouter key isn't valid. Check it in “AI settings”.",
  "generation.rejected":
    "OpenRouter rejected the request. Usually the key has no credit left, or it has the web-referrer restriction on and this site isn't listed.",
  "generation.rateLimited":
    "OpenRouter says the rate limit was reached or that there's no credit left.",
  "generation.unknownModel":
    "OpenRouter doesn't recognise the model “{model}”. Identifiers change often: look for it in the catalog on the previous screen, which is fetched on the spot.",
  "generation.providerDown":
    "OpenRouter is having trouble right now. Try again in a moment.",
  "generation.failedWithStatus":
    "The request to OpenRouter failed with status {status}.",
  "generation.missingKey":
    "The OpenRouter key is missing. Add it in “AI settings”, or use import mode, which needs no key.",
  "generation.pickModel":
    "Pick a model. The catalog is fetched from OpenRouter and needs no key.",
  "generation.network":
    "Could not reach OpenRouter from the browser. Check your connection and try again.",
  "generation.badJson":
    "OpenRouter replied with something that couldn't be read as JSON.",
  "generation.emptyResponse":
    "The model replied empty. It may have run out of tokens halfway; try fewer cards or another model.",

  "models.network": "Could not reach OpenRouter to see the models.",
  "models.badStatus":
    "OpenRouter replied with status {status} when asked for the model catalog.",
  "models.empty":
    "OpenRouter returned no usable models. You can type the identifier by hand.",

  "draft.notADeck":
    "The model returned nothing that looks like a deck. Try another model, or ask again.",
  "draft.malformed": "The model's reply was cut off or malformed. Try again.",
  "draft.noUsableCards":
    "The model replied, but no card had both a term and a translation. Try again.",
  "draft.defaultTitle": "AI-generated deck",
};
