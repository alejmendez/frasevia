/**
 * Llamada directa a OpenRouter, desde el navegador.
 *
 * ## Por qué no hay proxy
 *
 * La aplicación se compila en modo SPA y se publica en GitHub Pages: no hay
 * servidor nuestro (`app/lib/static.test.ts` lo vigila). La petición sale del
 * navegador de quien estudia hacia OpenRouter, con la clave que esa persona
 * guardó en su equipo. La clave nunca pasa por nuestra infraestructura, que
 * para este caso es la mejor garantía que se le puede dar.
 *
 * Si algún día se quisiera quitar la clave del navegador, el sitio tendría que
 * dejar de publicarse como archivos estáticos. Es una decisión de
 * infraestructura, no un detalle de este módulo.
 */

import { type DeckDraft, parseDeckDraft } from "./draft";
import { getKey } from "./keys";
import type { ModelInfo } from "./models";
import { buildDraftPrompt, type DraftRequest, maxTokensFor } from "./prompt";

export class GenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GenerationError";
  }
}

export interface GenerateOptions {
  model: string;
  request: DraftRequest;
  /**
   * Si se pasó el modelo del catálogo, se sabe si admite salida en JSON.
   * Sin ese dato se asume que no, que es el camino que nunca falla.
   */
  jsonMode?: ModelInfo["supportsJsonMode"];
  signal?: AbortSignal;
}

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

/** Una petición cancelada no es un fallo y no debe mostrarse como tal. */
export function isAbort(error: unknown): boolean {
  return (
    (error instanceof DOMException || error instanceof Error) &&
    error.name === "AbortError"
  );
}

/** Busca el mensaje de error en la forma en que lo manda OpenRouter. */
async function readErrorDetail(response: Response): Promise<string> {
  try {
    const body = await response.json();
    const message = (body as { error?: { message?: string } })?.error?.message;
    return typeof message === "string" ? message : "";
  } catch {
    return "";
  }
}

/** Traduce un estado HTTP en algo que la persona pueda arreglar. */
function explainStatus(
  status: number,
  detail: string,
  model: string,
): GenerationError {
  const suffix = detail ? ` Detalle: ${detail}` : "";

  if (status === 401) {
    return new GenerationError(
      `La clave de OpenRouter no es válida. Revísala en «Ajustes de IA».${suffix}`,
    );
  }

  if (status === 403) {
    return new GenerationError(
      "OpenRouter rechazó la petición. Suele ser la clave sin saldo, o con la " +
        "restricción de referencias web activada y este sitio sin añadir." +
        suffix,
    );
  }

  if (status === 429) {
    return new GenerationError(
      "OpenRouter dice que se alcanzó el límite de peticiones o que no queda " +
        "crédito." +
        suffix,
    );
  }

  if (status === 400 || status === 404) {
    return new GenerationError(
      `OpenRouter no reconoce el modelo «${model}». Los identificadores cambian ` +
        "con frecuencia: búscalo en el catálogo de la pantalla anterior, que se " +
        `pide al momento.${suffix}`,
    );
  }

  if (status >= 500) {
    return new GenerationError(
      "OpenRouter está teniendo problemas ahora mismo. Prueba en un momento." +
        suffix,
    );
  }

  return new GenerationError(
    `La petición a OpenRouter falló con el estado ${status}.${suffix}`,
  );
}

function requireKey(): string {
  const key = getKey();
  if (!key) {
    throw new GenerationError(
      "Falta la clave de OpenRouter. Añádela en «Ajustes de IA», o usa el modo " +
        "de importar, que no necesita clave.",
    );
  }
  return key;
}

/**
 * Pide un mazo en borrador.
 *
 * `jsonMode` decide si se manda `response_format`. OpenRouter responde 400 si se
 * le pide salida JSON a un modelo que no la admite, así que el catálogo lo indica
 * y aquí se respeta. Un modelo desconocido se trata como que no la admite: es
 * el camino que nunca falla, y `parseDeckDraft` ya tolera que la respuesta venga
 * envuelta en prosa o en un bloque de código.
 */
export async function generateDeckDraft(
  options: GenerateOptions,
): Promise<DeckDraft> {
  const model = options.model.trim();
  if (model === "") {
    throw new GenerationError(
      "Elige un modelo. El catálogo se pide al OpenRouter y no necesita clave.",
    );
  }

  const { system, user } = buildDraftPrompt(options.request);

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      signal: options.signal,
      headers: {
        Authorization: `Bearer ${requireKey()}`,
        "Content-Type": "application/json",
        // Informativo: identifica la aplicación en el panel de OpenRouter. No
        // lleva la clave ni nada privado.
        "HTTP-Referer": typeof location === "undefined" ? "" : location.origin,
        "X-Title": "Frasevia",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: maxTokensFor(options.request.cardCount),
        ...(options.jsonMode
          ? { response_format: { type: "json_object" } }
          : {}),
      }),
    });
  } catch (error) {
    if (isAbort(error)) {
      throw error;
    }
    throw new GenerationError(
      "No se pudo contactar con OpenRouter desde el navegador. Comprueba la " +
        "conexión e inténtalo de nuevo.",
    );
  }

  if (!response.ok) {
    throw explainStatus(
      response.status,
      await readErrorDetail(response),
      model,
    );
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new GenerationError(
      "OpenRouter respondió con algo que no se pudo leer como JSON.",
    );
  }

  const choices = (data as { choices?: unknown })?.choices;
  const content = (choices as { message?: { content?: unknown } }[])?.[0]
    ?.message?.content;

  if (typeof content !== "string" || content.trim() === "") {
    throw new GenerationError(
      "El modelo respondió vacío. Puede que se haya quedado sin tokens a " +
        "mitad; prueba con menos tarjetas o con otro modelo.",
    );
  }

  return parseDeckDraft(content);
}
