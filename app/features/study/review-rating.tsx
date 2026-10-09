import { GearSixIcon } from "@phosphor-icons/react/dist/ssr";
import { Link } from "react-router";

import { Alert, ButtonLink, cx } from "~/components/ui";
import { useT } from "~/lib/locale-context";
import {
  intervalName,
  levelName,
  REVIEW_COLOR_CLASSES,
} from "~/lib/review-levels";
import type { ReviewLevel } from "~/lib/types";

/**
 * Los botones de puntuación.
 *
 * El número del atajo va en el botón y no solo en la pista de abajo: es lo que
 * permite tocar diez tarjetas sin mirar. Y `aria-keyshortcuts` lo declara, para
 * que el atajo no sea un misterio para quien usa lector de pantalla.
 *
 * Los nombres y los intervalos salen de `lib/review-levels`, que es el mismo sitio
 * del que los saca la pantalla de ajustes: si divergieran, el mismo nivel se
 * llamaría de una forma aquí y de otra allí.
 */
export function ReviewRating({
  levels,
  disabled,
  onRate,
}: {
  levels: ReviewLevel[];
  disabled: boolean;
  onRate: (level: ReviewLevel) => void;
}) {
  const tr = useT();

  return (
    <div className="mt-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-brand">
            {tr("estudiar.ratingQuestion")}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            {tr("estudiar.ratingTimingHint")}
          </p>
        </div>
        <ButtonLink to="/ajustes/repaso" variant="ghost">
          <GearSixIcon aria-hidden size={17} />
          {tr("estudiar.changeIntervals")}
        </ButtonLink>
      </div>

      {levels.length === 0 ? (
        <Alert variant="warning" title={tr("estudiar.noActiveLevels")}>
          <Link to="/ajustes/repaso" className="underline">
            {tr("estudiar.changeIntervals")}
          </Link>
        </Alert>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {levels.map((level, position) => {
              const name = levelName(level, tr);
              const interval = intervalName(level, tr);

              return (
                <button
                  key={level.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onRate(level)}
                  aria-keyshortcuts={
                    position < 9 ? String(position + 1) : undefined
                  }
                  aria-label={`${position + 1}. ${name}. ${interval}`}
                  className={cx(
                    "flex min-h-20 items-center gap-3 rounded-xl border px-4 py-3 text-left transition-transform active:scale-[0.98] disabled:cursor-wait disabled:opacity-60",
                    REVIEW_COLOR_CLASSES[level.color] ??
                      REVIEW_COLOR_CLASSES.sand,
                  )}
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-paper/65 text-lg font-semibold">
                    {position + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold">{name}</span>
                    <span className="mt-0.5 block text-sm opacity-80">
                      {interval}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-right text-xs text-ink-faint">
            {tr("estudiar.ratingShortcutHint", {
              count: Math.min(levels.length, 9),
            })}
          </p>
        </>
      )}

      <p className="mt-3 text-right text-xs text-ink-faint">
        {tr("estudiar.retiredCanReturn")}
      </p>
    </div>
  );
}

/** El fallo de guardado, con la instrucción de reintentar. */
export function ReviewSaveError({ message }: { message: string }) {
  const tr = useT();

  return (
    <Alert variant="error" className="mt-4">
      <p>{tr("estudiar.saveFailed", { message })}</p>
      <p className="mt-1">{tr("estudiar.retrySameCard")}</p>
    </Alert>
  );
}

/** Los avisos que no son errores: se está guardando, o se ha guardado. */
export function ReviewStatusLine({
  saving,
  notice,
}: {
  saving: boolean;
  notice: string;
}) {
  const tr = useT();

  return (
    <>
      {saving ? (
        <p role="status" className="mt-3 text-sm text-ink-soft">
          {tr("estudiar.savingProgress")}
        </p>
      ) : null}
      {notice ? (
        <p role="status" aria-live="polite" className="mt-3 text-sm text-brand">
          {notice}
        </p>
      ) : null}
    </>
  );
}
