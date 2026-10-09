import type { Messages } from "../types";

/**
 * Explore.
 */
export const explorar = {
  "explorar.metaTitle": "Explore decks — Frasevia",
  "explorar.metaDescription":
    "Public decks for languages and general review. Discover cards about anything you want to learn.",
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
  "explorar.emptyTypeBody":
    "There are no public decks of this type yet. Try all topics or create your own.",
  "explorar.emptyNoDecksBody":
    "Be the first to share a deck: make your own and publish it.",
  "explorar.seeAll": "See all",
  "explorar.createFirst": "Create my first deck",
} satisfies Messages;
