/**
 * Forma de los catálogos de traducción.
 *
 * Se declara aparte para que `es.ts` (que es quien fija las claves) y `en.ts`
 * (que tiene que traerlas todas) compartan el mismo contrato sin que ninguno
 * tenga que importar al otro.
 */

/**
 * Un mensaje, o dos si lleva número.
 *
 * La tupla es `[singular, plural]`. Solo se distinguen esos dos casos porque es
 * lo único que necesitan los dos idiomas de la aplicación: tanto en español
 * como en inglés, `Intl.PluralRules` separa el `one` del resto. Importa
 * hacerlo así y no con las categorías completas porque en español el `0` cae en
 * `many`, y "0 tarjetas" tiene que salir por la forma plural, no por la
 * singular.
 */
export type MessageValue = string | readonly [singular: string, plural: string];

/** Catálogo completo: clave → mensaje. */
export type Messages = Record<string, MessageValue>;

/** Valores que se pueden interpolar en un mensaje con `{nombre}`. */
export type MessageParams = Record<string, string | number>;
