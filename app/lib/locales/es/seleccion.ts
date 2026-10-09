import type { Messages } from "../types";

/**
 * El menú rápido de texto seleccionado.
 */
export const seleccion = {
  "selection.menuLabel": "Acciones para el texto seleccionado",
  "selection.addToDeck": "Añadir a un mazo",
  "selection.closeMenu": "Cerrar menú",
  "selection.dialogTitle": "Guardar para repasar",
  "selection.dialogDescription":
    "Frasevia sugerirá una traducción con tu clave de OpenRouter. Puedes editarla antes de guardar.",
  "selection.selectedLanguage": "El texto seleccionado está en",
  "selection.english": "Inglés",
  "selection.spanish": "Español",
  "selection.destinationDeck": "Guardar en",
  "selection.createDeck": "Crear un mazo nuevo",
  "selection.newDeckName": "Nombre del mazo",
  "selection.newDeckPlaceholder": "Por ejemplo, Repaso rápido",
  "selection.translationRequired":
    "Escribe la palabra en inglés y su traducción al español.",
  "selection.translationTooLong":
    "El inglés admite hasta 200 caracteres y el español hasta 400.",
  "selection.translating": "Preparando una sugerencia de traducción…",
  "selection.suggestionReady":
    "Sugerencia lista. Puedes editarla antes de guardar.",
  "selection.translationNeedsKey":
    "Añade una clave de OpenRouter en Ajustes de IA para sugerir una traducción. También puedes escribirla manualmente.",
  "selection.configureAi": "Configurar IA",
  "selection.translationTooLongForSuggestion":
    "La sugerencia automática admite selecciones de hasta 200 caracteres. Puedes escribir la traducción manualmente.",
  "selection.translationSuggestionFailed":
    "No se pudo sugerir una traducción. Puedes escribirla manualmente.",
  "selection.deckUnavailable": "Ese mazo ya no está disponible.",
  "selection.sessionUnavailable":
    "Tu sesión terminó. Vuelve a entrar para guardar la palabra.",
  "selection.deckNameRequired": "Escribe un nombre para el mazo nuevo.",
  "selection.deckNameTooLong":
    "El nombre del mazo es demasiado largo. Usa menos de 120 caracteres.",
  "selection.saveFailed": "No se pudo guardar la palabra. Inténtalo de nuevo.",
  "selection.deckLoadError":
    "No se pudieron cargar tus mazos. Puedes crear uno nuevo.",
  "selection.saving": "Guardando…",
  "selection.save": "Guardar palabra",
  "selection.savedTitle": "Palabra guardada",
  "selection.saved": "Ya puedes repasar en «{deck}».",
  "selection.practiceNow": "Practicar ahora",
} satisfies Messages;
