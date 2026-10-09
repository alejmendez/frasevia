import type { Messages } from "../types";

/**
 * Review settings, AI settings and the provider.
 */
export const ajustes = {
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

  "provider.blurb":
    "A single key gives you access to GPT, Claude, Gemini, MiniMax and many more.",
  "provider.keyName": "OpenRouter API key",
  "provider.scoping":
    "In OpenRouter the key can be limited by budget and by allowed referrer; turning on both leaves a stolen key with no room to do damage.",

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
  "generation.emptyTranslation":
    "The model didn't return a translation. You can enter one manually.",

  "models.network": "Could not reach OpenRouter to see the models.",
  "models.badStatus":
    "OpenRouter replied with status {status} when asked for the model catalog.",
  "models.empty":
    "OpenRouter returned no usable models. You can type the identifier by hand.",

  "draft.notADeck":
    "The model returned nothing that looks like a deck. Try another model, or ask again.",
  "draft.malformed": "The model's reply was cut off or malformed. Try again.",
  "draft.noUsableCards":
    "No complete cards found. Each card needs content on both sides.",
  "draft.defaultTitle": "AI-generated deck",
} satisfies Messages;
