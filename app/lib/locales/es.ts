/**
 * El catálogo en español, que es también la lista de claves de la aplicación.
 *
 * Aquí no hay ninguna clave: solo la unión de los grupos. Está partido por
 * pantalla porque son casi mil renglones, y porque al final hay que poder
 * encontrar la que falta sin recorrer el archivo entero.
 *
 * Este módulo es la fuente de verdad: `en.ts` está tipado contra `SpanishKey`,
 * así que si aquí aparece una clave que allí no, el error sale al compilar y no
 * como un «undefined» pintado en pantalla.
 *
 * Las claves van por pantallilla (`inicio.title`, `estudiar.continue`) y no por
 * texto, para que cambiar una redacción no toque el código que la usa.
 */

import { ajustes } from "./es/ajustes";
import { biblioteca } from "./es/biblioteca";
import { comun } from "./es/comun";
import { estudiar } from "./es/estudiar";
import { explorar } from "./es/explorar";
import { mazos } from "./es/mazos";
import { portada } from "./es/portada";
import { progreso } from "./es/progreso";
import { seleccion } from "./es/seleccion";
import { shell } from "./es/shell";
import type { MessageValue } from "./types";

export const es = {
  ...ajustes,
  ...biblioteca,
  ...comun,
  ...estudiar,
  ...explorar,
  ...mazos,
  ...portada,
  ...progreso,
  ...seleccion,
  ...shell,
} as const satisfies Record<string, MessageValue>;

/** Toda clave de la aplicación. El inglés se comprueba contra esta lista. */
export type SpanishKey = keyof typeof es;

/** El catálogo español, indexado por clave. */
export type SpanishMessages = { [K in SpanishKey]: MessageValue };
