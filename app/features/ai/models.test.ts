import { describe, expect, it } from "vitest";
import type { ModelInfo } from "./models";
import { limitModels, parseModelList, searchModels } from "./models";

/** Envoltorio con la forma real de OpenRouter, que usa `data`. */
function openRouterPayload(rows: unknown[]) {
  return { data: rows };
}

function model(overrides: Record<string, unknown> = {}) {
  return {
    id: "openai/gpt-4o-mini",
    name: "OpenAI: GPT-4o mini",
    context_length: 128000,
    architecture: { modality: "text->text" },
    supported_parameters: ["response_format", "temperature"],
    ...overrides,
  };
}

describe("parseModelList", () => {
  it("lee la forma que devuelve OpenRouter", () => {
    const models = parseModelList(
      openRouterPayload([model(), model({ id: "google/gemini-3.8-flash" })]),
    );

    expect(models).toHaveLength(2);
    expect(models[0]).toMatchObject({
      id: "openai/gpt-4o-mini",
      label: "OpenAI: GPT-4o mini",
      supportsJsonMode: true,
    });
  });

  it("acepta también un array suelto", () => {
    expect(parseModelList([model()])).toHaveLength(1);
  });

  it("devuelve una lista vacía ante una respuesta inesperada", () => {
    expect(parseModelList(null)).toEqual([]);
    expect(parseModelList({ data: "no es una lista" })).toEqual([]);
  });

  it("ordena de mayor a menor contexto", () => {
    const models = parseModelList(
      openRouterPayload([
        model({ id: "pequeño", context_length: 1000 }),
        model({ id: "grande", context_length: 900000 }),
        model({ id: "mediano", context_length: 128000 }),
      ]),
    );

    expect(models.map((m) => m.id)).toEqual(["grande", "mediano", "pequeño"]);
  });

  it("elimina los duplicados conservando el primero", () => {
    const models = parseModelList(
      openRouterPayload([
        model({ id: "mismo", name: "con nombre" }),
        model({ id: "mismo", name: "otro nombre" }),
      ]),
    );

    expect(models).toHaveLength(1);
    expect(models[0].label).toBe("con nombre");
  });
});

describe("filtros de la respuesta", () => {
  it("descarta lo que no es texto", () => {
    // OpenRouter también lista modelos de imagen, audio y vídeo. Pedirles
    // tarjetas a uno de esos daría un error poco explicable.
    const models = parseModelList(
      openRouterPayload([
        model(),
        model({ id: "imagen/x", architecture: { modality: "text->image" } }),
        model({ id: "audio/y", architecture: { modality: "text->audio" } }),
      ]),
    );

    expect(models.map((m) => m.id)).toEqual(["openai/gpt-4o-mini"]);
  });

  it("descarta las variantes batch", () => {
    // Se cobran distinto y no aportan nada a este caso.
    const models = parseModelList(
      openRouterPayload([
        model(),
        model({ id: "google/gemini-3.8-flash:batch" }),
      ]),
    );

    expect(models.map((m) => m.id)).not.toContain(
      "google/gemini-3.8-flash:batch",
    );
  });

  it("marca los que no admiten salida en JSON", () => {
    // Importa: OpenRouter responde 400 si se manda `response_format` a un
    // modelo que no lo soporta.
    const models = parseModelList(
      openRouterPayload([
        model(),
        model({ id: "viejo/x", supported_parameters: ["temperature"] }),
        model({ id: "sin-datos/y", supported_parameters: undefined }),
      ]),
    );

    const byId = Object.fromEntries(
      models.map((m) => [m.id, m.supportsJsonMode]),
    );

    expect(byId["openai/gpt-4o-mini"]).toBe(true);
    expect(byId["viejo/x"]).toBe(false);
    expect(byId["sin-datos/y"]).toBe(false);
  });

  it("descarta las filas sin identificador", () => {
    const models = parseModelList(
      openRouterPayload([model(), model({ id: "" }), model({ id: null })]),
    );

    expect(models).toHaveLength(1);
  });
});

describe("limitModels", () => {
  it("deja la lista manejable sin tirar lo más útil", () => {
    const models: ModelInfo[] = Array.from({ length: 500 }, (_, index) => ({
      id: `m${index}`,
      label: `Modelo ${index}`,
      supportsJsonMode: true,
      contextLength: 500 - index,
    }));

    const limited = limitModels(models);

    expect(limited).toHaveLength(200);
    // El corte es por contexto, así que lo que se queda es lo grande.
    expect(limited[0].id).toBe("m0");
  });
});

describe("searchModels", () => {
  const models: ModelInfo[] = [
    {
      id: "google/gemini-3.8-flash",
      label: "Google: Gemini 3.8 Flash",
      supportsJsonMode: true,
      contextLength: 1000000,
    },
    {
      id: "anthropic/claude-sonnet-5.5",
      label: "Anthropic: Claude Sonnet 5.5",
      supportsJsonMode: true,
      contextLength: 200000,
    },
    {
      id: "minimax/minimax-m3",
      label: "MiniMax: MiniMax M3",
      supportsJsonMode: true,
      contextLength: 1000000,
    },
  ];

  it("devuelve todo con la búsqueda vacía", () => {
    expect(searchModels(models, "  ")).toHaveLength(3);
  });

  it("encuentra por identificador", () => {
    expect(searchModels(models, "minimax").map((m) => m.id)).toEqual([
      "minimax/minimax-m3",
    ]);
  });

  it("encuentra por nombre legible", () => {
    expect(searchModels(models, "Gemini").map((m) => m.id)).toEqual([
      "google/gemini-3.8-flash",
    ]);
  });

  it("no distingue mayúsculas", () => {
    expect(searchModels(models, "CLAUDE")).toHaveLength(1);
  });

  it("devuelve vacío cuando no hay coincidencia", () => {
    expect(searchModels(models, "llama")).toEqual([]);
  });
});
