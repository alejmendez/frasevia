import { en } from "./locales/en";
import { es, type SpanishKey, type SpanishMessages } from "./locales/es";
import type { MessageParams, MessageValue } from "./locales/types";

/**
 * Idioma de la interfaz.
 *
 * El idioma no se guarda en Supabase ni en una cookie: es una preferencia del
 * navegador, igual que el tema, y vive en `localStorage` y en una variable de
 * módulo que hace de espejo para el código que no es React. No hay render en
 * servidor (`ssr: false`), así que no existe la posibilidad de tener el HTML en
 * un idioma y la hidratación en otro por culpa de dónde se resuelve el valor.
 *
 * ## Por qué el español es el idioma por defecto y no el del navegador
 *
 * El producto es para gente hispanohablante que está aprendiendo inglés. Si el
 * idioma inicial fuera el del sistema, quien tiene el navegador en inglés
 * —justo quien más lo necesita en español— encontraría la interfaz en inglés,
 * y las tarjetas en español. Fijar el español por defecto hace que el idioma
 * siempre sea una decisión de quien está usando la pantalla, y no una casualidad
 * del sistema.
 *
 * ## Dónde se resuelve
 *
 * La preferencia se lee después de hidratar, no durante el primer render (ver
 * `locale-context.tsx`). Entre la una cosa y la otra la pantalla muestra el
 * indicador de carga de la aplicación, así que no hay destello de idioma.
 */

/** Idiomas de la interfaz. */
export type Locale = "es" | "en";

/** Cualquier clave de un catálogo. */
export type MessageKey = SpanishKey;

export type { MessageParams };

/** El idioma que se usa si esta persona no ha elegido otro. */
export const DEFAULT_LOCALE: Locale = "es";

/**
 * Idiomas disponibles.
 *
 * Es el registro de los que existen: añadir uno aquí obliga a escribir su
 * catálogo, y `locale.test.ts` recorre esta lista comprobando que se traduce.
 * El selector no la usa —con dos idiomas le basta con `otherLocale`—, pero
 * quitarla sería quitar el aviso.
 */
export const LOCALES: readonly Locale[] = ["es", "en"];

/**
 * Catálogos, ya tipados contra las claves del español.
 *
 * El tipo es lo que avisa de que el inglés se quede sin una clave o le sobre una:
 * el error sale al compilar, no como un texto vacío en pantalla. No lleva
 * `as unknown as`: si el español cambiara de forma, esto tiene que dejar de
 * compilar y hay que enterarse.
 */
const CATALOGS: Record<Locale, SpanishMessages> = { es, en };

const STORAGE_KEY = "frasevia-locale";

/**
 * Idioma activo para el código que no es React.
 *
 * Es un espejo, no la fuente: lo actualiza `applyLocale`, que a su vez la llaman
 * el proveedor al montar y el selector al cambiar. Existe porque hay cosas que
 * se traducen fuera del árbol de componentes y no pueden usar `useContext`: las
 * funciones `meta` de las rutas, los formateadores de `app/lib/format.ts` y los
 * mensajes de error que lanzan los módulos de IA.
 */
let active: Locale = DEFAULT_LOCALE;

/** El idioma que hay en pantalla ahora mismo. */
export function activeLocale(): Locale {
  return active;
}

/**
 * Datos del selector: cómo se escribe cada idioma y su código corto.
 *
 * `native` es el nombre del idioma **en su propia lengua** y por eso está aquí y
 * no en los catálogos: tiene que salir igual en las dos interfaces para que se
 * reconozca esté la que esté. Es la convención de los selectores de idioma, y
 * evita tener que traducir el nombre de un idioma.
 */
export const LOCALE_INFO: Record<Locale, { native: string; short: string }> = {
  es: { native: "Español", short: "ES" },
  en: { native: "English", short: "EN" },
};

/** El otro idioma: el único al que puede saltar un selector de dos. */
export function otherLocale(locale: Locale): Locale {
  return locale === "es" ? "en" : "es";
}

// ---------------------------------------------------------------------------
// Interpolación
// ---------------------------------------------------------------------------

const PLACEHOLDER = /\{(\w+)\}/g;

function interpolate(template: string, params?: MessageParams): string {
  if (!params) {
    return template;
  }

  // Un `{nombre}` sin valor se deja tal cual: delata el mensaje incompleto al
  // developing en lugar de dejar un hueco en pantalla sin explicación.
  return template.replace(PLACEHOLDER, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

/**
 * Elige entre la forma singular y la plural.
 *
 * Se decide con `count === 1` y no con `Intl.PluralRules` porque con dos
 * idiomas no hay más que distinguir, y porque en español el `0` cae en la
 * categoría `many`: "0 tarjetas" tiene que salir por la plural.
 */
function pick(value: MessageValue, params?: MessageParams): string {
  if (typeof value === "string") {
    return value;
  }

  return Number(params?.count) === 1 ? value[0] : value[1];
}

/**
 * Busca una clave sin asumir nada de los tipos.
 *
 * El indexado por `string` es lo que obliga el paso por `Record<string, …>`: con
 * el tipo del catálogo, TypeScript daría por hecho que la clave existe y el
 * `??` de abajo sería código muerto que en realidad es la red de seguridad.
 */
function read(
  catalog: Record<MessageKey, MessageValue>,
  key: string,
): MessageValue | undefined {
  const loose = catalog as Record<string, MessageValue>;
  return Object.hasOwn(loose, key) ? loose[key] : undefined;
}

/**
 * Traduce una clave en un idioma concreto.
 *
 * Si el idioma activo no trae la clave se cae al español en vez de pintar la
 * clave en pantalla. Solo pasaría si los catálogos se desincronizasen, que es
 * justo lo que impide el tipo de `en.ts`.
 */
export function lookup(
  locale: Locale,
  key: MessageKey,
  params?: MessageParams,
): string {
  const value =
    read(CATALOGS[locale], key) ?? read(CATALOGS[DEFAULT_LOCALE], key);

  return value === undefined ? key : interpolate(pick(value, params), params);
}

/**
 * Traduce con el idioma activo.
 *
 * Es la versión sin React: la usan las funciones `meta`, los formateadores y los
 * errores de los módulos de IA. Dentro de un componente conviene `useT()`, que
 * además vuelve a renderizar al cambiar el idioma.
 */
export function t(key: MessageKey, params?: MessageParams): string {
  return lookup(active, key, params);
}

// ---------------------------------------------------------------------------
// Preferencia
// ---------------------------------------------------------------------------

function isLocale(value: string | null): value is Locale {
  return value === "es" || value === "en";
}

/** La preferencia guardada, o `null` si esta persona todavía no eligió idioma. */
export function readStoredLocale(): Locale | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isLocale(value) ? value : null;
  } catch {
    // Almacenamiento bloqueado (modo privado, cookies de terceros): se aplica el
    // idioma por defecto y el cambio solo durará esta pestaña.
    return null;
  }
}

/** Pone el idioma en el documento. Es la única que toca `<html>`. */
export function applyLocale(locale: Locale) {
  active = locale;
  // Importa más de lo que parece: sin esto los lectores de pantalla leerían la
  // interfaz española con fonética inglesa (y al revés) mientras dura la sesión.
  document.documentElement.lang = locale;
}

/** Elige un idioma y lo recuerda. */
export function setStoredLocale(locale: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Sin almacenamiento el cambio se aplica igual, solo que no se recuerda.
  }

  applyLocale(locale);
}

/**
 * Script de arranque, para el `<head>`.
 *
 * Solo pone `lang` en `<html>`, que es lo único que puede hacerse antes de que
 * corra React: los textos están en el JS. El idioma del texto lo decide
 * `locale-context.tsx` al hidratar, y para entonces la pantalla todavía muestra
 * el indicador de carga, así que el cambio no se ve.
 *
 * Va como una cadena y no como módulo por lo mismo que el script del tema: tiene
 * que ser de lo primero que corre en la página.
 */
export const LOCALE_BOOTSTRAP =
  `(function(){try{` +
  `var s=localStorage.getItem(${JSON.stringify(STORAGE_KEY)});` +
  `if(s==="es"||s==="en"){document.documentElement.lang=s;}` +
  `}catch(e){}})()`;
