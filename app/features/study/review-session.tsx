import { ArrowsClockwiseIcon } from "@phosphor-icons/react/dist/ssr";

import { Button, ProgressBar } from "~/components/ui";
import { useT } from "~/lib/locale-context";
import type { CardReviewState, ReviewLevel, StudyCard } from "~/lib/types";

import { ReviewCardFaces } from "./review-card-faces";
import { NothingDue, ReviewFinished } from "./review-end";
import { ReviewQueueList } from "./review-queue-list";
import {
  ReviewRating,
  ReviewSaveError,
  ReviewStatusLine,
} from "./review-rating";
import { type ReviewSession, useReviewSession } from "./use-review-session";

/**
 * La sesión de repaso por memoria.
 *
 * Aquí solo se compone: el estado está en `use-review-session` y cada trozo de
 * pantalla tiene su archivo. La regla del repositorio es que un componente no
 * pase de unas 80 líneas, y esta función no decide nada: elige qué se ve según
 * dónde esté la sesión y pinta las piezas.
 */
export function ReviewSessionView({
  cards,
  states,
  levels,
  direction,
  isDeckSession,
}: {
  cards: StudyCard[];
  states: CardReviewState[];
  levels: ReviewLevel[];
  direction: string | null;
  isDeckSession: boolean;
}) {
  const session = useReviewSession({ cards, states, levels, direction });

  // El final de la sesión es un estado aparte del componente. Al terminar, el
  // resto de la pantalla sobra y no tiene sentido seguir montada: aquí puede
  // haber hasta cientos de filas de la cola de repaso, más los dos controles de
  // pronunciación por cara de la ficha. Montarla mientras se guarda lo último
  // mantiene todo eso vivo sin que se vea, y en la práctica se notaba en las
  // pantallas largas.
  if (session.finished) {
    return (
      <ReviewFinished
        reviewedCount={session.items.length}
        notice={session.notice}
      />
    );
  }

  if (session.items.length === 0 || !session.item) {
    return <NothingDue states={states} />;
  }

  return (
    <section className="mx-auto max-w-6xl">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-stretch">
        <div className="order-2 min-w-0 lg:order-1">
          <CardTop
            index={session.index}
            total={session.items.length}
            completed={session.reviewed.size}
            status={session.item.status}
          />

          <ReviewCardFaces
            card={session.item.card}
            direction={session.item.direction}
            revealed={session.revealed}
            frontHeadingRef={session.frontHeadingRef}
            backHeadingRef={session.backHeadingRef}
          />

          {!session.revealed ? (
            <RevealButton onReveal={session.reveal} />
          ) : null}
        </div>

        <ReviewQueueList
          cards={cards}
          states={states}
          items={session.items}
          direction={direction}
          isDeckSession={isDeckSession}
          index={session.index}
          reviewed={session.reviewed}
          savingIndices={session.savingIndices}
          error={session.error}
          onJump={session.goTo}
        />
      </div>

      <ReviewRating
        levels={session.activeLevels}
        disabled={session.isTransitioning}
        onRate={session.rate}
      />

      {session.error ? <ReviewSaveError message={session.error} /> : null}
      <ReviewStatusLine
        saving={session.savingIndices.size > 0}
        notice={session.notice}
      />
      <ScreenReaderCounters session={session} />
    </section>
  );
}

/** El contador, la barra y si la ficha es nueva o estaba pendiente. */
function CardTop({
  index,
  total,
  completed,
  status,
}: {
  index: number;
  total: number;
  completed: number;
  status: "due" | "new";
}) {
  const tr = useT();

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-4 text-sm text-ink-soft">
        <span>{tr("estudiar.counter", { index: index + 1, total })}</span>
        <span>
          {tr(status === "due" ? "estudiar.pendingLabel" : "estudiar.newLabel")}
        </span>
      </div>
      <ProgressBar
        value={completed}
        total={total}
        label={tr("estudiar.sessionAria", { index: completed, total })}
      />
    </>
  );
}

/** El botón de voltear y el recordatorio del atajo. */
function RevealButton({ onReveal }: { onReveal: () => void }) {
  const tr = useT();

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
      <Button className="min-h-14 min-w-56 px-7" onClick={onReveal}>
        <ArrowsClockwiseIcon aria-hidden size={20} weight="bold" />
        {tr("estudiar.reveal")}
      </Button>
      <span className="text-sm text-ink-faint">
        <kbd className="rounded border border-line-strong bg-paper-raised px-2 py-1 font-sans text-xs">
          Space
        </kbd>{" "}
        {tr("estudiar.toFlip")}
      </span>
    </div>
  );
}

/**
 * Lo que se cuenta solo para quien usa lector de pantalla.
 *
 * Cuántas veces se ha visto esa ficha antes, y en qué punto va la sesión. Se
 * escribe en texto invisible a propósito: es el tipo de dato que no cabe en un
 * número de pantalla y sí hace falta anunciado.
 */
function ScreenReaderCounters({ session }: { session: ReviewSession }) {
  const tr = useT();
  const state = session.item
    ? session.statesByKey.get(
        `${session.item.card.id}:${session.item.direction}`,
      )
    : undefined;

  if (!state && session.reviewed.size === 0) return null;

  return (
    <>
      {state ? (
        <span className="sr-only">
          {tr("estudiar.reviewedBefore", { count: state.review_count })}
        </span>
      ) : null}
      {session.reviewed.size > 0 ? (
        <span className="sr-only">
          {tr("estudiar.counter", {
            index: session.reviewed.size,
            total: session.items.length,
          })}
        </span>
      ) : null}
    </>
  );
}
