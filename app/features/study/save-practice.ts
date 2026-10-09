/**
 * El estado de un envío de práctica, tal como lo expone `useFetcher`.
 *
 * El resumen lo necesita para decir si el guardado sigue en curso o falló, así
 * que el tipo vive aquí y no en el componente: si cambia la forma, los dos se
 * enteran.
 */
export interface SaveFetcher {
  state: "idle" | "submitting" | "loading";
  data: { ok: boolean; message: string } | undefined;
}

/**
 * Lo que llega del formulario de una sesión de práctica.
 *
 * El campo es un JSON que arma la propia pantalla, así que no es de fiar: puede
 * venir malformado, ser enorme o traer campos que no son. Lo que no se puede
 * dejar pasar es una lista que no es lista —eso sí rompería el guardado—, así
 * que lo demás se descarta en silencio y se guarda lo que haya.
 */

/** Cuántos resultados se aceptan como máximo de un envío. */
const MAX_RESULTS = 200;

export interface PracticeOutcome {
  cardId: string;
  correct: boolean;
}

/** El formato de los resultados que manda la práctica. */
export interface ParsedResults {
  ok: true;
  results: PracticeOutcome[];
}

export interface ParseFailure {
  ok: false;
  reason: "malformed";
}

export type ParseOutcome = ParsedResults | ParseFailure;

/**
 * Lee los resultados de una práctica.
 *
 * Descarta lo que no sea `{cardId, correct}` y corta la lista: el campo es
 * público y `record_practice` no necesita más de doscientas filas para hacer su
 * trabajo.
 */
export function parsePracticeResults(raw: string): ParseOutcome {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (!Array.isArray(parsed)) {
    return { ok: false, reason: "malformed" };
  }

  const results = parsed
    .filter(
      (item): item is PracticeOutcome =>
        typeof (item as PracticeOutcome | null)?.cardId === "string" &&
        typeof (item as PracticeOutcome | null)?.correct === "boolean",
    )
    .slice(0, MAX_RESULTS);

  return { ok: true, results };
}

/**
 * Los deltas que se envían a `record_practice`.
 *
 * Se mandan los deltas de esta sesión y no el total acumulado: la función los
 * acumula en la base, así que dos sesiones abiertas a la vez no se pisan.
 */
export function toPracticePayload(results: PracticeOutcome[]): Array<{
  card_id: string;
  attempts: number;
  correct_count: number;
}> {
  return results.map((result) => ({
    card_id: result.cardId,
    attempts: 1,
    correct_count: result.correct ? 1 : 0,
  }));
}
