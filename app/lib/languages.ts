import type { MessageKey } from "./locale";
import { t } from "./locale";

/**
 * Idiomas que se ofrecen al crear o editar un mazo.
 *
 * El `code` es lo que se guarda en la base de datos y lo que viaja en las
 * consultas; la etiqueta se traduce. Se separan las dos cosas porque el código
 * no es un texto que deba cambiar al cambiar de idioma, y porque la lista está
 * repetida en tres formularios distintos.
 *
 * No hay función para poner el nombre de un idioma en un texto: las tarjetas y
 * los mazos guardados muestran el código (`es → en`), que es corto, no se
 * traduce y se lee igual en las dos interfaces.
 */
export interface DeckLanguage {
  /** Código ISO 639-1, tal como se guarda. */
  code: string;
  /** Nombre legible, en el idioma de la interfaz. */
  label: string;
}

const LANGUAGE_CODES: [code: string, key: MessageKey][] = [
  ["es", "language.es"],
  ["en", "language.en"],
  ["pt", "language.pt"],
  ["fr", "language.fr"],
  ["de", "language.de"],
];

export function deckLanguages(): DeckLanguage[] {
  return LANGUAGE_CODES.map(([code, key]) => ({ code, label: t(key) }));
}
