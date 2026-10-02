/**
 * Listado de modelos de OpenRouter.
 *
 * ## Por qué se pregunta a la API y no se escribe en el código
 *
 * OpenRouter tenía 464 modelos en el momento de escribir esto, y cambian cada
 * pocas semanas: identificadores como `google/gemini-3.8-flash` no existían hace
 * poco y los que se existían se van. Una lista escrita a mano se queda vieja
 * sin avisar y empieza a fallar con un error que no explica nada.
 *
 * ## No hace falta clave para esto
 *
 * `GET /api/v1/models` es público, así que el listado se puede teach a
 * alguien que aún no ha metido la clave. Se comprobó que responde con CORS,
 * que es lo que permite leerlo desde el navegador.
 */

export interface ModelInfo {
  /** Identificador exacto, tal como lo espera la API. */
  id: string;
  /** Nombre legible, para reconocerlo en una lista. */
  label: string;
  /**
   * Si el modelo admite `response_format`.
   *
   * Importa porque OpenRouter rechaza la petición si se le manda ese campo y el
   * modelo no lo soporta. Es una de las razones por las que un modelo concreto
   * puede fallar mientras otro del mismo proveedor funciona.
   */
  supportsJsonMode: boolean;
  /** Contexto en tokens, para ordenar los más capaces primero. */
  contextLength: number;
}

export class ModelListError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModelListError";
  }
}

/** Forma del objeto que devuelve OpenRouter, reducida a lo que se usa. */
interface OpenRouterModel {
  id?: unknown;
  name?: unknown;
  context_length?: unknown;
  architecture?: { modality?: unknown } | null;
  supported_parameters?: unknown;
}

const ENDPOINT = "https://openrouter.ai/api/v1/models";

function readNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Descarta lo que no sirve para construir tarjetas.
 *
 * OpenRouter expone también modelos de imagen, audio y vídeo, aliases de
 * versión y variantes `:batch` que se cobran distinto y no aportan nada aquí.
 * Se filtran por modality y por sufijo, que es información que el propio
 * proveedor manda.
 */
function isUsable(model: OpenRouterModel): boolean {
  const modality = readString(model.architecture?.modality);
  if (modality !== "" && modality !== "text->text") {
    return false;
  }

  const id = readString(model.id);
  return id !== "" && !id.endsWith(":batch");
}

/**
 * Normaliza la respuesta y la deja lista para el selector.
 *
 * Se ordenan por contexto de mayor a menor porque, entre modelos parecidos, el
 * de ventana más grande suele ser el más capaz. El primero visto se queda con
 * el nombre, y los siguientes solo aportan identificadores duplicados.
 */
export function parseModelList(payload: unknown): ModelInfo[] {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown })?.data)
      ? (payload as { data: unknown[] }).data
      : [];

  const seen = new Set<string>();
  const models: ModelInfo[] = [];

  for (const row of rows) {
    if (typeof row !== "object" || row === null) {
      continue;
    }

    const model = row as OpenRouterModel;
    if (!isUsable(model)) {
      continue;
    }

    const id = readString(model.id);
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);

    models.push({
      id,
      label: readString(model.name) || id,
      supportsJsonMode: Array.isArray(model.supported_parameters)
        ? model.supported_parameters.includes("response_format")
        : false,
      contextLength: readNumber(model.context_length),
    });
  }

  return models.sort((a, b) => b.contextLength - a.contextLength);
}

/**
 * Deja la lista manejable para un `<select>` o un buscador.
 *
 * Se queda con un tope alto porque un buscador con 464 entradas funciona bien,
 * pero una lista sin filtro de 464 no. El corte es por contexto, así que lo que
 * sobra es lo más viejo o lo más pequeño, no lo más útil.
 */
export function limitModels(models: ModelInfo[], max = 200): ModelInfo[] {
  return models.slice(0, max);
}

/** Filtra por texto libre, sobre identificador y nombre. */
export function searchModels(models: ModelInfo[], query: string): ModelInfo[] {
  const needle = query.trim().toLowerCase();
  if (needle === "") {
    return models;
  }

  return models.filter(
    (model) =>
      model.id.toLowerCase().includes(needle) ||
      model.label.toLowerCase().includes(needle),
  );
}

/**
 * Pide el catálogo. No necesita la clave.
 *
 * No recibe el proveedor como argumento porque solo hay uno. Cuando se sume
 * otro, aquí se decide qué endpoint y qué forma de respuesta se leen, que es
 * justo lo que la tabla de `providers.ts` documenta.
 */
export async function listModels(signal?: AbortSignal): Promise<ModelInfo[]> {
  let response: Response;

  try {
    response = await fetch(ENDPOINT, { signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }
    throw new ModelListError(
      "No se pudo contactar con OpenRouter para ver los modelos.",
    );
  }

  if (!response.ok) {
    throw new ModelListError(
      `OpenRouter respondió con el estado ${response.status} al pedir el catálogo de modelos.`,
    );
  }

  const models = parseModelList(await response.json());

  if (models.length === 0) {
    throw new ModelListError(
      "OpenRouter no devolvió ningún modelo utilizable. Se puede escribir el identificador a mano.",
    );
  }

  return limitModels(models);
}
