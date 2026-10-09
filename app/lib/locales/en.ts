/**
 * El catálogo en inglés.
 *
 * No hay ninguna clave aquí: solo la unión de los grupos, en el mismo reparto que
 * el español. La paridad entre los dos la comprueba `locale.test.ts`, que además
 * revisa que los marcadores de interpolación coincidan clave por clave.
 *
 * Está tipado contra el español, así que una clave de más o de menos sale al
 * compilar y no como un texto vacío en pantalla.
 */

import { ajustes } from "./en/ajustes";
import { biblioteca } from "./en/biblioteca";
import { comun } from "./en/comun";
import { estudiar } from "./en/estudiar";
import { explorar } from "./en/explorar";
import { mazos } from "./en/mazos";
import { portada } from "./en/portada";
import { progreso } from "./en/progreso";
import { seleccion } from "./en/seleccion";
import { shell } from "./en/shell";
import type { CompleteMessages } from "./types";

export const en = {
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
} satisfies CompleteMessages;

/** El catálogo en inglés, indexado por clave. */
export type EnglishMessages = typeof en;
