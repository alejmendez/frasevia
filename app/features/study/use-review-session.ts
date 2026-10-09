import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFetcher } from "react-router";

import { useLocale, useT } from "~/lib/locale-context";
import type { CardReviewState, ReviewLevel, StudyCard } from "~/lib/types";
import {
  clientTimeZone,
  nextPendingReviewIndex,
  type PendingReview,
  ReviewWriteQueue,
} from "./review-write-queue";
import { buildReviewSession, type ReviewSessionEntry } from "./schedule";

/**
 * La sesión de repaso por memoria: qué se ve, qué se está guardando y a dónde se
 * va después.
 *
 * Estaba dentro de un componente de 830 líneas con ocho `useState` y cuatro
 * `useEffect`. La parte difícil de esa pantalla no es pintar: es que puntuar
 * avance al instante sin esperar a la red, que cada guardado traiga su propia
 * respuesta y que un fallo devuelva la ficha a la cola y salte a ella. Eso es una
 * máquina de estados, y una máquina de estados se lee mejor sola.
 *
 * Aquí no hay JSX. Los valores que se derivan —el texto de cada cara, el ejemplo,
 * las etiquetas de los niveles— se calculan en el componente, que es donde se
 * pintan. Lo que vive aquí es lo que hay que recordar entre un render y el otro.
 */

/** Lo que el action devuelve cuando se puntúa una ficha. */
export interface MemoryReviewAction {
  ok: boolean;
  eventId: string;
  saved?: {
    next_review_at?: string | null;
    retired?: boolean;
    level_name?: string;
  };
  message?: string;
}

export interface ReviewSession {
  items: ReviewSessionEntry<StudyCard>[];
  item: ReviewSessionEntry<StudyCard> | undefined;
  statesByKey: Map<string, CardReviewState>;
  index: number;
  revealed: boolean;
  isTransitioning: boolean;
  /** Los índices de la sesión ya puntuados. */
  reviewed: ReadonlySet<number>;
  /** Los índices cuya puntuación todavía está volando o en cola. */
  savingIndices: ReadonlySet<number>;
  activeLevels: ReviewLevel[];
  notice: string;
  error: string | null;
  /** Cada ficha está guardada de verdad, así que ya no queda nada que hacer. */
  finished: boolean;
  rate: (level: ReviewLevel) => void;
  reveal: () => void;
  goTo: (index: number) => void;
  frontHeadingRef: React.RefObject<HTMLHeadingElement | null>;
  backHeadingRef: React.RefObject<HTMLHeadingElement | null>;
}

export function useReviewSession({
  cards,
  states,
  levels,
  direction,
}: {
  cards: StudyCard[];
  states: CardReviewState[];
  levels: ReviewLevel[];
  direction: string | null;
}): ReviewSession {
  const tr = useT();
  const { locale } = useLocale();
  const fetcher = useFetcher<MemoryReviewAction>();

  const activeLevels = useMemo(
    () =>
      levels
        .filter((level) => level.active)
        .sort((a, b) => a.position - b.position),
    [levels],
  );

  // La sesión se congela al montarla: las fichas que entran no cambian mientras
  // se repasa, aunque la cola global sí siga creciendo por detrás.
  const [items] = useState(() => buildReviewSession(cards, states, direction));

  // Los índices de estado solo dependen de lo que recibe el componente, así que
  // sin memorizarlos se reconstruían en cada render —y esta pantalla vuelve a
  // renderizar en cada pulsación de teclado— para acabar en lo mismo.
  const statesByKey = useMemo(
    () =>
      new Map(
        states.map((state) => [`${state.card_id}:${state.direction}`, state]),
      ),
    [states],
  );

  const [index, setIndex] = useState(0);
  const [reviewed, setReviewed] = useState<ReadonlySet<number>>(
    () => new Set(),
  );
  const [revealed, setRevealed] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [savingIndices, setSavingIndices] = useState<ReadonlySet<number>>(
    () => new Set(),
  );
  const [finished, setFinished] = useState(false);

  const transitionTimeout = useRef<number | null>(null);
  const frontHeadingRef = useRef<HTMLHeadingElement>(null);
  const backHeadingRef = useRef<HTMLHeadingElement>(null);

  /**
   * Escrituras de repaso y su cola.
   *
   * La cola vive en un `ref` porque `rate` se llama desde un manejador y necesita
   * encolar y arrancar en el mismo tick, sin esperar a un render. El estado solo
   * guarda los índices, para poder marcar en la lista qué ficha se está guardando.
   *
   * Un único `fetcher` solo admite un envío vivo: meter dos seguidos haría que el
   * enrutador cancelara el primero. Encolar es lo que permite repassar sin
   * esperar —la pantalla avanza al instante y la red va detrás— sin que una
   * puntuación se pierda por el camino.
   */
  const writes = useRef(new ReviewWriteQueue());
  const retryEventIds = useRef(new Map<number, string>());

  const item = items[index];
  const cardFocusKey = item ? `${item.card.id}:${item.direction}` : null;

  /** Manda una puntuación por el `fetcher` de la ruta. */
  const send = useCallback(
    (review: PendingReview) => {
      void fetcher.submit(
        {
          intent: "rate-review",
          cardId: review.cardId,
          direction: review.direction,
          levelId: review.levelId,
          eventId: review.eventId,
          timezone: clientTimeZone(),
        },
        { method: "post" },
      );
    },
    [fetcher],
  );

  const rate = useCallback(
    (level: ReviewLevel) => {
      if (!item || isTransitioning || error !== null || reviewed.has(index)) {
        return;
      }

      // Consulta optimista: la ficha cuenta como repasada y la pantalla avanza ya,
      // sin esperar a la red. Si el guardado falla, el efecto que escucha
      // `fetcher.data` la devuelve a la cola, salta a esa ficha y avisa, y el mismo
      // `eventId` sirve para reintentar sin duplicar el repaso.
      const optimistic = new Set(reviewed).add(index);
      setReviewed(optimistic);
      setSavingIndices((current) => addTo(current, index));
      setError(null);
      setNotice("");

      // Se reutiliza el `eventId` del intento anterior si esta ficha ya falló una
      // vez, para que `record_card_review` no la cuente dos veces al reintentar.
      const eventId = retryEventIds.current.get(index) ?? crypto.randomUUID();
      const toSend = writes.current.push({
        eventId,
        index,
        cardId: item.card.id,
        direction: item.direction,
        levelId: level.id,
      });

      if (toSend) send(toSend);

      const nextIndex = nextPendingReviewIndex(items.length, index, optimistic);
      if (nextIndex !== null) {
        setIndex(nextIndex);
        setRevealed(false);
      }
    },
    [error, index, isTransitioning, item, items.length, reviewed, send],
  );

  const reveal = useCallback(() => {
    if (revealed) return;
    clearTransition(transitionTimeout);
    setRevealed(true);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsTransitioning(false);
      return;
    }

    setIsTransitioning(true);
    transitionTimeout.current = window.setTimeout(() => {
      transitionTimeout.current = null;
      setIsTransitioning(false);
    }, 480);
  }, [revealed]);

  /** Salta a una ficha de la sesión y vuelve a taparla. */
  const goTo = useCallback((target: number) => {
    clearTransition(transitionTimeout);
    setIndex(target);
    setRevealed(false);
    setIsTransitioning(false);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      clearTransition(transitionTimeout);
      // Vaciar la cola al desmontar es solo hygiene: no se mandan las
      // puntuaciones que quedaron sin enviar. Enviar una acción desde un
      // componente que ya no está montado solo puede competir con la navegación
      // que lo está sustituyendo.
      writes.current.clear();
    };
  }, []);

  const sessionComplete = items.length > 0 && reviewed.size === items.length;
  const savingCount = savingIndices.size;

  // La sesión se da por terminada cuando cada ficha está **guardada**, no solo
  // puntuada: si queda algo en vuelo o en la cola, se espera. Al revés, la
  // pantalla de fin aparecería mientras la última escritura sigue en la red, y si
  // esa fallara ya no habría desde dónde reintentar.
  useEffect(() => {
    if (sessionComplete && !error && savingCount === 0) {
      setFinished(true);
    }
  }, [error, savingCount, sessionComplete]);

  useEffect(() => {
    if (!cardFocusKey) return;
    (revealed ? backHeadingRef.current : frontHeadingRef.current)?.focus();
  }, [cardFocusKey, revealed]);

  /**
   * Concilia cada respuesta con lo que la pantalla ya mostró.
   *
   * La ficha se contó como repasada en el momento de puntuarla, así que aquí solo
   * hay que confirmar o deshacer: si el guardado fue bien, se anuncia la próxima
   * fecha y se sigue mandando lo que quede en cola; si falló, se deshace el
   * conteo, la ficha vuelve a la lista y se salta a ella para reintentar.
   *
   * La cola sigue mandando aunque esta puntuación falle: lo que falló es una
   * escritura concreta, no el resto. Parar aquí dejaría las siguientes sin enviar
   * aunque el problema ya no estuviera.
   */
  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;

    const completed = writes.current.current();
    // `fetcher.data` sigue teniendo la respuesta anterior mientras se manda la
    // siguiente: el `eventId` es lo que dice si esta es la que tocaba.
    if (!completed || fetcher.data.eventId !== completed.eventId) return;

    const saved = fetcher.data.ok ? fetcher.data.saved : undefined;
    const failedMessage = fetcher.data.ok
      ? null
      : (fetcher.data.message ?? tr("estudiar.saveFailedGeneric"));

    if (failedMessage) {
      // Se conserva el `eventId` para que el reintento no cuente dos veces el
      // mismo repaso: `record_card_review` lo trata como clave de idempotencia.
      retryEventIds.current.set(completed.index, completed.eventId);
      setReviewed((current) => without(current, completed.index));
      setSavingIndices((current) => without(current, completed.index));
      setNotice("");
      setError(failedMessage);
      goTo(completed.index);
    } else {
      retryEventIds.current.delete(completed.index);
      setSavingIndices((current) => without(current, completed.index));
      setError(null);
      setNotice(confirmationNotice(saved, locale, tr));
    }

    clearTransition(transitionTimeout);

    const nextToSend = writes.current.complete(completed);
    if (nextToSend) send(nextToSend);
  }, [fetcher.data, fetcher.state, goTo, locale, send, tr]);

  // Se declara antes del efecto de las teclas porque el atajo no debe cambiar de
  // identidad en cada render: el listener se vuelve a poner y quitar por cada
  // pulsación, y eso es trabajo en el hilo principal por cada tecla.
  const handleKey = useCallback(
    (event: KeyboardEvent) => {
      // Un atajo global no debe robarle una tecla a un campo, a un botón ni a otro
      // diálogo: `Space` escribirá un espacio, no volteará la tarjeta.
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.closest(
            "input, textarea, select, [role='dialog'], [aria-modal='true']",
          ))
      ) {
        return;
      }
      if (isTransitioning || !item) return;

      if ((event.code === "Space" || event.key === " ") && !revealed) {
        event.preventDefault();
        reveal();
        return;
      }

      if (/^[1-9]$/.test(event.key)) {
        const level = activeLevels[Number(event.key) - 1];
        if (level) {
          event.preventDefault();
          rate(level);
        }
      }
    },
    [activeLevels, isTransitioning, item, rate, reveal, revealed],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return {
    items,
    item,
    statesByKey,
    index,
    revealed,
    isTransitioning,
    reviewed,
    savingIndices,
    activeLevels,
    notice,
    error,
    finished,
    rate,
    reveal,
    goTo,
    frontHeadingRef,
    backHeadingRef,
  };
}

function clearTransition(ref: React.RefObject<number | null>) {
  if (ref.current !== null) {
    window.clearTimeout(ref.current);
    ref.current = null;
  }
}

function addTo(set: ReadonlySet<number>, index: number): ReadonlySet<number> {
  return new Set(set).add(index);
}

function without(set: ReadonlySet<number>, index: number): ReadonlySet<number> {
  if (!set.has(index)) return set;
  const next = new Set(set);
  next.delete(index);
  return next;
}

/** Lo que se anuncia cuando una puntuación se ha guardado de verdad. */
function confirmationNotice(
  saved: MemoryReviewAction["saved"],
  locale: string,
  tr: ReturnType<typeof useT>,
): string {
  if (saved?.retired) return tr("estudiar.retiredConfirmation");

  if (saved?.next_review_at) {
    return tr("estudiar.nextReview", {
      date: new Date(saved.next_review_at).toLocaleString(
        locale === "es" ? "es-CL" : "en-US",
        { dateStyle: "medium", timeStyle: "short" },
      ),
    });
  }

  return tr("estudiar.saved");
}
