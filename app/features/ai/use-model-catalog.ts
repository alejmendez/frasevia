import { useEffect, useMemo, useState } from "react";

import { useT } from "~/lib/locale-context";
import {
  listModels,
  type ModelInfo,
  ModelListError,
  searchModels,
} from "./models";

/**
 * El catálogo de modelos, con su búsqueda.
 *
 * Son casi 460 modelos que cambian cada pocas semanas, así que se piden al abrir
 * en vez de estar escritos en el código. Es la única parte de la pantalla de IA
 * que espera algo, y por eso esto va aparte: quien lea el formulario no tiene que
 * atravesarse la carga, el error ni el filtrado.
 *
 * La petición se cancela al salir de la pantalla. Si no, quien navega a otra antes
 * de que responda sigue pagando la descarga y el filtrado de las casi 460 entradas
 * para un resultado que ya no se va a pintar.
 */

/** Cuántos modelos se ofrecen tras buscar. */
const VISIBLE_MODELS = 40;

/** Qué se está mostrando ahora mismo: nada aún, cargando, o el catálogo. */
export type CatalogState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; models: ModelInfo[] };

export interface ModelCatalog {
  /** Los que se ofrecen para elegir, ya filtrados. */
  visible: ModelInfo[];
  /** Cuántos hay sin filtrar, que es el número que muestra el resumen. */
  total: number;
  /** Qué está pasando con la carga. Es lo que decide qué se pinta. */
  catalog: CatalogState;
  query: string;
  setQuery: (query: string) => void;
  /** Vuelve a pedir el catálogo después de un fallo. */
  retry: () => void;
}

export function useModelCatalog(): ModelCatalog {
  const tr = useT();
  const [models, setModels] = useState<ModelInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  // Cada vez que sube, el efecto vuelve a pedir el catálogo. Es el reintentar.
  const [attempts, setAttempts] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: el traductor se usa solo en el mensaje de error, y si cambia el idioma mientras carga ese aviso se está formando en una pantalla que ya no está. No vale la pena volver a pedir 460 modelos por un cambio de idioma.
  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setModels(null);
    setError(null);

    void listModels(controller.signal)
      .then((loaded) => {
        if (active) setModels(loaded);
      })
      .catch((cause: unknown) => {
        // Abortar no es un fallo: es quien navegó a otro lado.
        if (!active) return;
        setError(
          cause instanceof ModelListError
            ? cause.message
            : tr("mazoIa.modelsLoadFailed"),
        );
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [attempts]);

  const catalog: CatalogState = useMemo(() => {
    if (models) return { status: "ready", models };
    if (error) return { status: "error", message: error };
    return { status: "loading" };
  }, [error, models]);

  return {
    visible: models ? searchModels(models, query).slice(0, VISIBLE_MODELS) : [],
    total: models?.length ?? 0,
    catalog,
    query,
    setQuery,
    retry: () => setAttempts((value) => value + 1),
  };
}
