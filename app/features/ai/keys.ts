/**
 * Guarda de la clave de IA, en el navegador de quien la puso.
 *
 * ## Dónde y por qué
 *
 * La aplicación se compila en modo SPA y se publica en GitHub Pages: no hay
 * servidor. Eso deja solo dos formas de guardar una clave, y las dos son
 * `localStorage`:
 *
 * - Una **cookie `httpOnly`** no la puede leer JavaScript, así que el navegador
 *   no podría usarla para firmar la petición; y sin servidor tampoco hay nadie
 *   que la lea. No sirve para nada.
 * - Una **cookie legible por JavaScript** es idéntica a `localStorage` en
 *   seguridad, y encima se envía sola en cada petición a nuestro dominio.
 *
 * ## Lo que esto no protege
 *
 * `localStorage` no es un almacén de secretos: cualquier JavaScript que corra en
 * la página puede leerlo. La defensa real es de dos capas:
 *
 * 1. **Restringir la clave en OpenRouter**, por presupuesto y por sitio de
 *    referencia. Es lo único que sobrevive a que alguien la lea.
 * 2. **Que no haya JavaScript de terceros ni XSS.** La aplicación no carga
 *    scripts de terceros y nunca interpreta con `innerHTML` nada que venga de un
 *    modelo, y la CSP de `app/lib/csp.ts` cierra `connect-src` para que una
 *    clave robada no tenga a dónde ir.
 *
 * Y para quien prefiera no guardar nada: el modo importar no necesita clave.
 */

import { PROVIDER } from "./providers";

/** Clave concreta, no un objeto con todas: así «olvidar» es un `removeItem`. */
const STORAGE_KEY = PROVIDER.keyStorageKey;

/** Últimos cuatro caracteres, para reconocer la clave sin enseñarla entera. */
const PREVIEW_CHARS = 4;

/**
 * `localStorage` puede lanzar al escribir (cuota llena, modo privado de
 * Safari, permisos negados) y no existe en Node, donde corren las pruebas.
 * Todo pasa por aquí para que un fallo de almacenamiento no tumbe la pantalla.
 */
function storage(): Storage | null {
  try {
    if (typeof localStorage === "undefined") {
      return null;
    }
    return localStorage;
  } catch {
    return null;
  }
}

/** Clave guardada, o `null` si no hay ninguna. */
export function getKey(): string | null {
  try {
    return storage()?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

/**
 * Guarda la clave.
 *
 * Devuelve `false` si el navegador no dejó escribir, para que la interfaz pueda
 * avisar en vez de dar por guardado algo que no lo está.
 */
export function setKey(key: string): boolean {
  const trimmed = key.trim();
  if (trimmed === "") {
    return forgetKey();
  }

  try {
    storage()?.setItem(STORAGE_KEY, trimmed);
    return true;
  } catch {
    return false;
  }
}

/** Borra la clave de este navegador. */
export function forgetKey(): boolean {
  try {
    storage()?.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function hasKey(): boolean {
  return getKey() !== null;
}

/**
 * Muestra solo el final de la clave, para confirmar cuál es sin dejarla entera
 * a la vista.
 *
 * Con menos de ocho caracteres no se enseña nada: si alguien pega un texto
 * corto por error, no tiene por qué quedar medio revelado en pantalla.
 */
export function maskKey(key: string): string {
  const trimmed = key.trim();
  if (trimmed.length <= PREVIEW_CHARS * 2) {
    return "•".repeat(8);
  }
  return `••••••••${trimmed.slice(-PREVIEW_CHARS)}`;
}
