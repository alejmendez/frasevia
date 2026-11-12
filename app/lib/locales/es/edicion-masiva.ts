import type { Messages } from "../types";

/**
 * La edición masiva con JSON.
 *
 * Un mazo se exporta como una lista de tarjetas en JSON, esa lista se le pasa a
 * un modelo de lenguaje y lo que devuelve se pega de vuelta. Estas claves son
 * las instrucciones de ese ida y vuelta, y también lo que se le dice al modelo.
 */
export const edicionMasiva = {
  "edicionMasiva.button": "Edición masiva con JSON",
  "edicionMasiva.title": "Editar el mazo con JSON",
  "edicionMasiva.description":
    "Copia las tarjetas del mazo, pásaselas a un modelo de lenguaje y pega aquí lo que te devuelva.",
  "edicionMasiva.step1": "Copia el JSON con el botón de abajo.",
  "edicionMasiva.step2":
    "Pégaselo a un modelo de lenguaje, con las instrucciones, y pídele los cambios.",
  "edicionMasiva.step3": "Pega aquí lo que devuelva y guarda.",
  "edicionMasiva.jsonLabel": "JSON de las tarjetas",
  "edicionMasiva.rules":
    "Las tarjetas que no aparezcan en el JSON se quedan como están. Las que no tengan identificador se agregan al final del mazo.",
  "edicionMasiva.copyForAi": "Copiar para la IA",
  "edicionMasiva.copyJson": "Copiar solo el JSON",
  "edicionMasiva.copied": "Copiado",
  "edicionMasiva.copyFailed":
    "El navegador no dejó copiar. Selecciona el JSON del recuadro y cópialo a mano.",
  "edicionMasiva.apply": "Guardar los cambios",
  "edicionMasiva.saving": "Guardando…",
  "edicionMasiva.applied":
    "Tarjetas actualizadas: {updated}. Tarjetas agregadas: {created}.",
  "edicionMasiva.prompt":
    "Este es el JSON de las tarjetas de un mazo de Frasevia. Devuélveme solo el JSON, con los mismos objetos y en el mismo orden, pero con los valores corregidos: rellena lo que está entre corchetes con contenido real, mantén el idioma y el estilo del resto y no cambies los identificadores. Si una tarjeta necesita un texto nuevo, escríbelo en el mismo campo.",
  "edicionMasiva.error.invalidJson": "Eso no es un JSON válido.",
  "edicionMasiva.error.notAList":
    "El JSON tiene que ser una lista de tarjetas.",
  "edicionMasiva.error.empty": "La lista de tarjetas está vacía.",
  "edicionMasiva.error.notACard": "La entrada {index} no es una tarjeta.",
  "edicionMasiva.error.missingFields":
    "La tarjeta {index} no tiene término ni significado.",
  "edicionMasiva.error.tooLong":
    "La tarjeta {index} tiene un texto más largo de lo que admite la base.",
  "edicionMasiva.error.badKind":
    "La tarjeta {index} tiene un tipo de tarjeta que no existe.",
  "edicionMasiva.error.unknownCard":
    "La tarjeta {cardId} no existe en este mazo.",
} satisfies Messages;
