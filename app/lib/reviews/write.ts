import type { SupabaseClient } from "@supabase/supabase-js";
import type { LevelSubmission } from "../review-levels";
import { DEFAULT_REVIEW_LEVELS, parseLevelSubmission } from "../review-levels";
import type { ReviewLevel } from "../types";
import { listReviewLevels } from "./read";

/**
 * Escrituras de los niveles de repaso y del estado de repaso de una tarjeta.
 *
 * Estaban dentro de `ajustes-repaso.tsx`, con la lista de columnas repetida tres
 * veces en el mismo archivo y además escrita a mano en `reviews.ts`. Dos listas
 * que se pueden desincronizar sin que nada falle: una se quedaría corto y la otra
 * devolvería algo más viejo, sin error de por medio.
 *
 * Aquí está la lista, una vez. Quien llama decide qué decir cuando algo falla.
 */

/**
 * Las columnas de un nivel de repaso.
 *
 * Es la forma completa de la fila, y es la que se pide al guardar. Se comparte
 * con las lecturas: leer y escribir tienen que ver las mismas columnas o la
 * pantalla muestra una cosa y guarda otra.
 */
export const REVIEW_LEVEL_COLUMNS =
  "id, user_id, system_key, name, action, interval_amount, interval_unit, position, color, active, created_at, updated_at";

export type LevelWriteResult =
  | { ok: true; levels: ReviewLevel[] }
  | { ok: false; message: string };

/** Devuelve una tarjeta retirada a la cola de repaso. */
export async function reactivateCardReview(
  supabase: SupabaseClient,
  cardId: string,
  direction: string,
): Promise<{ ok: boolean; message: string }> {
  const { error } = await supabase.rpc("reactivate_card_review", {
    p_card_id: cardId,
    p_direction: direction,
  });

  return { ok: !error, message: error?.message ?? "" };
}

/**
 * Guarda los niveles que envió el formulario.
 *
 * `created_at` se conserva: es la fecha en que se creó el nivel, no en que se
 * editó, y ponerla al día haría que un nivel nuevo y uno viejo de hace un año
 * parecieran freshly hechos. Por eso hay que leerlos antes de escribir.
 */
export async function saveReviewLevels(
  supabase: SupabaseClient,
  userId: string,
  submitted: unknown,
): Promise<LevelWriteResult> {
  const parsed = parseLevelSubmission(submitted);

  if (!Array.isArray(parsed)) {
    return { ok: false, message: "invalid-levels" };
  }

  const now = new Date().toISOString();
  const createdAt = await readCreatedAt(supabase, parsed);

  const rows = parsed.map((level) => ({
    ...withTimestamps(level, userId, createdAt.get(level.id) ?? now, now),
  }));

  return upsertLevels(supabase, rows);
}

/**
 * Vuelve a los cuatro niveles predeterminados sin borrar los personalizados.
 *
 * Los predeterminados conservan su identificador —así no se pierde el historial de
 * las fichas puntuadas con ellos— y los que la persona creó se desactivan en vez
 * de borrarse: le pertenecen y puede querer volver a usarlos.
 */
export async function resetReviewLevels(
  supabase: SupabaseClient,
  userId: string,
): Promise<LevelWriteResult> {
  const existing = await listReviewLevels(supabase);

  if (existing.error) {
    return { ok: false, message: existing.error };
  }

  const bySystemKey = new Map(
    existing.levels
      .filter((level) => level.system_key)
      .map((level) => [level.system_key, level]),
  );
  const now = new Date().toISOString();

  const rows = [
    ...DEFAULT_REVIEW_LEVELS.map((preset) => ({
      id: bySystemKey.get(preset.system_key)?.id ?? crypto.randomUUID(),
      user_id: userId,
      ...preset,
      active: true,
      created_at: bySystemKey.get(preset.system_key)?.created_at ?? now,
      updated_at: now,
    })),
    ...existing.levels
      .filter((level) => !level.system_key)
      .map((level, index) => ({
        ...level,
        active: false,
        position: DEFAULT_REVIEW_LEVELS.length + index + 1,
        updated_at: now,
      })),
  ];

  return upsertLevels(supabase, rows);
}

function withTimestamps(
  level: LevelSubmission,
  userId: string,
  createdAt: string,
  updatedAt: string,
) {
  return {
    ...level,
    user_id: userId,
    created_at: createdAt,
    updated_at: updatedAt,
  };
}

/**
 * La fecha de creación de cada nivel, por identificador.
 *
 * Un vacío si no se pudo leer: el guardado sigue adelante con la fecha de ahora.
 * Es preferible un nivel nuevo con la fecha de hoy a un nivel que no se guardó.
 */
async function readCreatedAt(
  supabase: SupabaseClient,
  levels: LevelSubmission[],
): Promise<Map<string, string>> {
  const ids = levels.map((level) => level.id);
  const { data } = await supabase
    .from("review_levels")
    .select("id, created_at")
    .in("id", ids);

  return new Map(
    (data ?? []).map((row) => [row.id as string, row.created_at as string]),
  );
}

async function upsertLevels(
  supabase: SupabaseClient,
  rows: Record<string, unknown>[],
): Promise<LevelWriteResult> {
  const { data, error } = await supabase
    .from("review_levels")
    .upsert(rows, { onConflict: "id" })
    .select(REVIEW_LEVEL_COLUMNS);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, levels: (data ?? []) as ReviewLevel[] };
}
