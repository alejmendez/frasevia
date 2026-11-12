import type { Messages } from "../types";

/**
 * La papelera: los mazos que se mandaron a la papelera y se pueden devolver.
 *
 * Es una pantalla aparte y no una sección de la biblioteca porque lo que hay
 * aquí ya no está en uso: son mazos esperando una decisión, y esconderlos en
 * un desplegable sería la forma de que nadie los viera otra vez.
 */
export const papelera = {
  "papelera.metaTitle": "Papelera — Frasevia",
  "papelera.eyebrow": "Papelera",
  "papelera.title": "Lo que mandaste a la papelera",
  "papelera.description":
    "Los mazos que borraste siguen aquí, con sus tarjetas y con el progreso que registraste. Puedes devolverlos o eliminarlos para siempre.",
  "papelera.back": "Volver a la biblioteca",
  "papelera.emptyTitle": "La papelera está vacía",
  "papelera.emptyDescription":
    "Cuando mandes un mazo a la papelera, aparecerá aquí para que puedas recuperarlo.",
  "papelera.loadErrorTitle": "No se pudo cargar la papelera",
  "papelera.deletedOn": "En la papelera desde el {date}",
  "papelera.restore": "Devolver",
  "papelera.restoreTitle": "¿Devolver «{title}» a tu biblioteca?",
  "papelera.restoreBody":
    "El mazo vuelve con sus tarjetas y con el progreso que registraste en ellas.",
  "papelera.restoreConfirm": "Devolver el mazo",
  "papelera.deleteForever": "Eliminar para siempre",
  "papelera.deleteForeverTitle": "¿Eliminar «{title}» para siempre?",
  "papelera.deleteForeverBody":
    "Se borra el mazo, sus tarjetas y el progreso que registraste en ellas. No se puede deshacer.",
  "papelera.deleteForeverConfirm": "Eliminar para siempre",
  "papelera.deckRestored": "El mazo volvió a tu biblioteca.",
  "papelera.deckDeleted": "El mazo se eliminó para siempre.",
} satisfies Messages;
