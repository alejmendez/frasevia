import { MEANING_MAX, TERM_MAX, TITLE_MAX } from "~/features/ai/draft";

/**
 * Lo que hay que comprobar antes de guardar una traducción desde el menú rápido.
 *
 * Son cinco reglas y todas estaban escritas dentro del manejador del formulario,
 * mezcladas con las llamadas a la base: leerlas exigía saltar por encima de veinte
 * líneas de Supabase. Aquí se leen seguidas, y se pueden probar sin montar nada.
 *
 * Los límites vienen de `features/ai/draft`, que es donde la base los tiene
 * escritos. Estaban repetidos como números sueltos en el formulario y en la
 * validación del mismo formulario, y por eso el formulario podía aceptar algo que
 * el insert iba a rechazar —y con eso, perder la traducción entera.
 */

/** Por qué no se puede guardar, o `null` si sí se puede. */
export type QuickAddProblem =
  | "translation-required"
  | "translation-too-long"
  | "deck-unavailable"
  | "deck-name-required"
  | "deck-title-too-long";

export interface QuickAddForm {
  /** La traducción en inglés: es el término de la tarjeta. */
  english: string;
  /** Su equivalente en español. */
  spanish: string;
  /** El mazo elegido, o `null` si se quiere crear uno nuevo. */
  deckId: string | null;
  /** El título del mazo nuevo, si es que se quiere crear uno. */
  newDeckTitle: string;
}

export function validateQuickAdd(form: QuickAddForm): QuickAddProblem | null {
  const term = form.english.trim();
  const meaning = form.spanish.trim();

  if (term === "" || meaning === "") return "translation-required";
  if (term.length > TERM_MAX || meaning.length > MEANING_MAX) {
    return "translation-too-long";
  }

  if (form.deckId === null) {
    const title = form.newDeckTitle.trim();
    if (title === "") return "deck-name-required";
    if (title.length > TITLE_MAX) return "deck-title-too-long";
  }

  return null;
}

/**
 * El tipo de tarjeta que se deduce de la traducción.
 *
 * Una frase lleva espacios y una palabra no, que es lo único que hay que mirar
 * cuando quien usa la aplicación no eligió tipo: adivinar por el espacio acierta
 * casi siempre y, cuando falla, se cambia en el editor.
 */
export function guessCardKind(term: string): "word" | "phrase" {
  return /\s/.test(term.trim()) ? "phrase" : "word";
}
