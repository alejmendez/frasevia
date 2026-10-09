/**
 * La cola de puntuaciones del repaso.
 *
 * Un `fetcher` solo admite un envío vivo —mandar otro cancela el anterior—, así
 * que con una sola puntuación cada vez la persona tenía que esperar a la red
 * entre tarjeta y tarjeta. Con una cola, puntuar avanza al instante y el envío va
 * detrás; como mucho se pierde la que siga en vuelo al salir de la pantalla, y
 * para eso cada una lleva su `eventId` como clave de idempotencia.
 *
 * No tiene nada de React a propósito: vive fuera del componente para poder
 * probarla sin montar la pantalla entera, y porque es una máquina de estados
 * sobre tres valores, no un efecto.
 */

/**
 * Una puntuación que se está enviando o esperando confirmación.
 *
 * `eventId` es también la clave de idempotencia que usa `record_card_review`: si
 * el guardado falla y la persona reintenta, se reutiliza el mismo `eventId` para
 * que la base no cuente dos veces el mismo repaso.
 */
export interface PendingReview {
  eventId: string;
  index: number;
  cardId: string;
  direction: string;
  levelId: string;
}

export class ReviewWriteQueue {
  private queue: PendingReview[] = [];
  private inFlight: PendingReview | null = null;

  /** Encola una puntuación y devuelve la que toca enviar, si había hueco. */
  push(review: PendingReview): PendingReview | null {
    this.queue.push(review);
    return this.take();
  }

  /** La puntuación en vuelo, si la hay. */
  current(): PendingReview | null {
    return this.inFlight;
  }

  /**
   * Libera la que estaba en vuelo y devuelve la siguiente.
   *
   * `completed` tiene que ser la que estaba en vuelo: es lo que evita que una
   * respuesta vieja se confunda con la que toca.
   */
  complete(completed: PendingReview): PendingReview | null {
    if (this.inFlight !== completed) {
      return null;
    }

    // Se libera el hueco antes de pedir la siguiente: `take` no vuelve a tomar
    // si ya hay una en vuelo, y sin esta línea la cola se quedaba atascada
    // detrás de la primera respuesta.
    this.inFlight = null;
    return this.take();
  }

  /** Descarta todo, para cuando la pantalla se desmonta. */
  clear(): void {
    this.queue = [];
  }

  /** Cuántas quedan sin enviar. */
  get pending(): number {
    return this.queue.length;
  }

  private take(): PendingReview | null {
    if (this.inFlight) {
      return null;
    }
    const next = this.queue.shift() ?? null;
    this.inFlight = next;
    return next;
  }
}

/**
 * La siguiente ficha que todavía no está puntuada.
 *
 * Es una vuelta a la lista, no un salto al principio: volver a la primera porque
 * ya se respondió es justo lo que hace que una sesión de repaso se sienta como un
 * bucle.
 */
export function nextPendingReviewIndex(
  total: number,
  fromIndex: number,
  reviewed: Set<number>,
): number | null {
  for (let offset = 1; offset < total; offset += 1) {
    const candidate = (fromIndex + offset) % total;
    if (!reviewed.has(candidate)) return candidate;
  }
  return null;
}

/**
 * Zona horaria del navegador, leída una sola vez.
 *
 * `Intl.DateTimeFormat().resolvedOptions()` es una construcción de objeto
 * relativamente costosa y el valor no cambia dentro de una sesión, así que se
 * resuelve la primera vez que hace falta y se reutiliza.
 */
let cachedTimeZone: string | null = null;

export function clientTimeZone(): string {
  cachedTimeZone ??= Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  return cachedTimeZone;
}
