/**
 * El único proveedor con el que se puede generar desde el navegador.
 *
 * ## Por qué solo OpenRouter
 *
 * La llamada sale del navegador de quien genera, así que el proveedor tiene que
 * responder con cabeceras CORS. Se comprobó uno por uno, en el navegador y no en
 * la documentación:
 *
 * | Servicio | Desde el navegador |
 * | --- | --- |
 * | `openrouter.ai` | Sí. Verificado, incluido el catálogo de modelos |
 * | `api.anthropic.com` | Sí, con una cabecera especial |
 * | `generativelanguage.googleapis.com` | Sí, solo su endpoint nativo |
 * | `api.minimax.io` | **No.** Devuelve `TypeError` en el navegador y `401` desde Node: no manda cabeceras CORS |
 * | `api.openai.com` | No fiable. Su preflight ha devuelto `403` y `404` |
 *
 * Quedan tres sitios que en teoría funcionan, pero ninguno cubre todos los
 * modelos, y cada uno obliga a mantener su propio formato de petición y de
 * respuesta. OpenRouter los cubre a todos con **un** formato, el de OpenAI, que
 * ya es un estándar de facto. Añadir un proveedor directo después es un `case`,
 * no una decisión de arquitectura.
 *
 * ## Y por qué hay una segunda vía sin clave
 *
 * En `app/routes/mazo-ia.tsx` está el modo importar: copias un prompt a tu
 * conversación con el asistente que uses y pegas el JSON que te devuelva. No
 * hace falta clave, ni CORS, ni pagar nada, y funciona con MiniMax o con
 * cualquier otro porque quien genera es la IA que ya tiene la persona abierta.
 */

import { t } from "~/lib/locale";

/** Configuración de la generación directa. */
export const PROVIDER = {
  id: "openrouter" as const,
  label: "OpenRouter",
  keyUrl: "https://openrouter.ai/keys",
  keyStorageKey: "frasevia.ai.key.openrouter",
  /** Modelo que se propone. Se cambia al elegir otro en el selector. */
  defaultModel: "openai/gpt-4o-mini",
} as const;

/**
 * Textos del proveedor, ya traducidos.
 *
 * Eran parte de `PROVIDER` y ahora son funciones porque se pintan: el nombre de
 * la clave, la descripción y el consejo de seguridad salen en pantalla, y
 * leerlos del catálogo al renderizar es lo que hace que cambien con el idioma.
 * Lo que no es texto —el id, la URL y la clave de almacenamiento— sí sigue siendo
 * una constante.
 */
export const providerBlurb = () => t("provider.blurb");
export const providerKeyName = () => t("provider.keyName");
export const providerScoping = () => t("provider.scoping");

export type Provider = typeof PROVIDER;
