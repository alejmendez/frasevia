import { useMemo } from "react";

import { cx } from "~/components/ui";
import { useT } from "~/lib/locale-context";
import type { CardReviewState, StudyCard } from "~/lib/types";

import {
  buildQueueList,
  orientReviewCard,
  type ReviewSessionEntry,
} from "./schedule";

/**
 * La lista lateral: lo que falta por repasar, en orden.
 *
 * En una sesión de mazo la cola global trae fichas de otros mazos y fichas ya
 * archivadas que no entran en la sesión. Se muestran al final, con su estado y
 * sin poder pulsarse, porque verlas es distinto de poder repasarlas.
 *
 * Es la tercera lista de la pantalla —la sesión, la cola y aquí— y por eso cada
 * fila dice en qué está: puntuada, guardándose, la que se está viendo, o nueva.
 */
export function ReviewQueueList({
  cards,
  states,
  items,
  direction,
  isDeckSession,
  index,
  reviewed,
  savingIndices,
  error,
  onJump,
}: {
  cards: StudyCard[];
  states: CardReviewState[];
  items: ReviewSessionEntry<StudyCard>[];
  direction: string | null;
  isDeckSession: boolean;
  index: number;
  reviewed: ReadonlySet<number>;
  savingIndices: ReadonlySet<number>;
  error: string | null;
  onJump: (index: number) => void;
}) {
  const tr = useT();

  const rows = useMemo(
    () => buildQueueList(cards, items, states, direction),
    [cards, direction, items, states],
  );

  return (
    <aside className="order-1 rounded-card border border-line bg-paper-raised/80 p-4 lg:sticky lg:top-6 lg:order-2">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl text-brand">
          {tr(
            isDeckSession ? "estudiar.deckQueueTitle" : "estudiar.queueTitle",
          )}
        </h2>
        <span className="shrink-0 text-xs tabular-nums text-ink-soft">
          {tr("estudiar.queueProgress", {
            done: reviewed.size,
            total: items.length,
          })}
        </span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-ink-soft">
        {tr(isDeckSession ? "estudiar.deckQueueHint" : "estudiar.queueHint")}
      </p>

      <ol className="mt-3 max-h-60 space-y-1 overflow-y-auto pr-1 lg:max-h-[calc(100vh-13rem)]">
        {rows.map((row, rowIndex) => {
          const term = orientReviewCard(row.card, row.direction).sourceText;
          const sessionIndex = row.sessionIndex;
          const isSessionCard = sessionIndex !== null;
          const isReviewed = isSessionCard && reviewed.has(sessionIndex);
          const isSaving = isSessionCard && savingIndices.has(sessionIndex);
          const isCurrent = isSessionCard && index === sessionIndex;
          const status = rowStatus({
            row,
            isSessionCard,
            isReviewed,
            isSaving,
            isCurrent,
            tr,
          });

          return (
            <li key={`${row.card.id}:${row.direction}`}>
              <button
                type="button"
                disabled={
                  !isSessionCard || isReviewed || isSaving || error !== null
                }
                aria-current={isCurrent ? "step" : undefined}
                aria-label={tr("estudiar.jumpToCard", {
                  index: (sessionIndex ?? rowIndex) + 1,
                  term,
                  status,
                })}
                onClick={() => {
                  if (sessionIndex !== null) onJump(sessionIndex);
                }}
                className={cx(
                  "flex min-h-12 w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors disabled:cursor-default",
                  isCurrent
                    ? "border-brand bg-brand-muted text-brand"
                    : isReviewed
                      ? "border-transparent bg-paper-sunken/70 text-ink-faint"
                      : "border-transparent text-ink hover:border-line hover:bg-paper-sunken/60",
                )}
              >
                <span className="w-6 shrink-0 text-center text-xs tabular-nums text-ink-faint">
                  {String(rowIndex + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block line-clamp-2 break-words text-sm font-medium">
                    {term}
                  </span>
                  {row.card.deckTitle ? (
                    <span className="mt-0.5 block truncate text-xs text-ink-faint">
                      {row.card.deckTitle}
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 text-[0.68rem] text-ink-faint">
                  {status}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

/** En qué está una fila de la cola. */
function rowStatus({
  row,
  isSessionCard,
  isReviewed,
  isSaving,
  isCurrent,
  tr,
}: {
  row: { status: string };
  isSessionCard: boolean;
  isReviewed: boolean;
  isSaving: boolean;
  isCurrent: boolean;
  tr: ReturnType<typeof useT>;
}): string {
  // Lo que no es de la sesión solo tiene dos estados posibles, y son los que
  // explica la lista: archivada, o pendiente para más adelante.
  if (!isSessionCard) {
    return tr(
      row.status === "scheduled"
        ? "estudiar.queueScheduled"
        : "estudiar.queueRetired",
    );
  }

  if (isReviewed) return tr("estudiar.queueReviewed");
  if (isSaving) return tr("estudiar.queueSaving");
  if (isCurrent) return tr("estudiar.queueCurrent");

  return tr(
    row.status === "due" ? "estudiar.pendingLabel" : "estudiar.newLabel",
  );
}
