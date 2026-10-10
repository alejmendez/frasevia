import type { SupabaseClient } from "@supabase/supabase-js";
import { data } from "react-router";

import { t } from "~/lib/locale";

/**
 * Lo que la pantalla de estudio manda al action.
 *
 * Queda una sola operación: puntuar una ficha del repaso por memoria. La que
 * guardaba los resultados de una práctica entera se retiró con ella.
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

/** La respuesta cuando la sesión se terminó mientras se guardaba. */
export function sessionExpired(eventId = "") {
  return data(
    { ok: false as const, eventId, message: t("estudiar.sessionExpired") },
    { status: 401 },
  );
}
