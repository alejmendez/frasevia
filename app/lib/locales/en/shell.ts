import type { Messages } from "../types";

/**
 * Header, footer and signing in with Google.
 */
export const shell = {
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
  "footer.tagline":
    "Frasevia. Learn languages and remember what matters to you.",
  "footer.exploreDecks": "Explore decks",

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
} satisfies Messages;
