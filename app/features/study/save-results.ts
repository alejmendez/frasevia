import type { SupabaseClient } from "@supabase/supabase-js";
import { data } from "react-router";

import { t } from "~/lib/locale";
import { parsePracticeResults, toPracticePayload } from "./save-practice";

/**
 * Lo que la pantalla de estudio manda al action.
 *
 * Son dos viajes distintos con la misma forma de pregunta, y por eso están juntos:
 * el `intent` los separa y quien llama no tiene que saber nada más.
 *
 * - `rate-review` puntúa una ficha del repaso por memoria. Lleva su `eventId`, que
 *   es también la clave de idempotencia: si el guardado falla y la persona
 *   reintenta, la base no cuenta dos veces el mismo repaso.
 * - `results` cierra una práctica.
 */

/** Puntúa una ficha del repaso por memoria. */
export async function rateReview(
  supabase: SupabaseClient,
  formData: FormData,
): Promise<unknown> {
  const cardId = String(formData.get("cardId") ?? "");
  const direction = String(formData.get("direction") ?? "");
  const levelId = String(formData.get("levelId") ?? "");
  const eventId = String(formData.get("eventId") ?? "");

  if (!cardId || !direction || !levelId || !eventId) {
    return data(
      { ok: false as const, eventId, message: t("estudiar.badReview") },
      { status: 400 },
    );
  }

  const { data: saved, error } = await supabase.rpc("record_card_review", {
    p_card_id: cardId,
    p_direction: direction,
    p_level_id: levelId,
    p_idempotency_key: eventId,
    p_timezone: String(formData.get("timezone") ?? "UTC"),
  });

  if (error) {
    return data(
      { ok: false as const, eventId, message: error.message },
      { status: 400 },
    );
  }

  return { ok: true as const, eventId, saved };
}

/**
 * Guarda los resultados de una práctica al terminar.
 *
 * Se envían los deltas de esta sesión (intentos y aciertos) y la función
 * `record_practice` los acumula en la base: así dos sesiones abiertas a la vez no
 * se pisan entre sí.
 */
export async function savePractice(
  supabase: SupabaseClient,
  formData: FormData,
): Promise<unknown> {
  const parsed = parsePracticeResults(String(formData.get("results") ?? "[]"));

  if (!parsed.ok) {
    return data(
      { ok: false as const, message: t("estudiar.badResults") },
      { status: 400 },
    );
  }

  if (parsed.results.length === 0) {
    return { ok: true as const, message: t("estudiar.nothingToSave") };
  }

  const { error } = await supabase.rpc("record_practice", {
    p_results: toPracticePayload(parsed.results),
  });

  if (error) {
    return data(
      { ok: false as const, message: error.message },
      { status: 400 },
    );
  }

  return { ok: true as const, message: t("estudiar.saved") };
}

/** La respuesta cuando la sesión se terminó mientras se guardaba. */
export function sessionExpired(eventId = "") {
  return data(
    { ok: false as const, eventId, message: t("estudiar.sessionExpired") },
    { status: 401 },
  );
}
