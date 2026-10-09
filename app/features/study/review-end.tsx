import { GearSixIcon } from "@phosphor-icons/react/dist/ssr";

import { ButtonLink, Card } from "~/components/ui";
import { useLocale, useT } from "~/lib/locale-context";
import type { CardReviewState } from "~/lib/types";

/**
 * Lo que se ve cuando no hay nada que repasar, y cuando ya se terminó.
 *
 * Son dos pantallas parecidas con un final distinto, y comparten la misma
 * pregunta de fondo: «¿y ahora qué?». Por eso están juntas: si aparece una
 * tercera —no hay nada, ya terminaste— el sitio natural es este archivo.
 *
 * Cuando no hay nada pendiente pero sí hay algo para más adelante, se dice
 * cuándo. Es la diferencia entre «no tienes nada que hacer» y «no ahora».
 */
export function ReviewFinished({
  reviewedCount,
  notice,
}: {
  reviewedCount: number;
  notice: string;
}) {
  const tr = useT();

  return (
    <Card className="mx-auto max-w-4xl p-8 text-center sm:p-12">
      <h2 className="font-display text-3xl text-brand">
        {tr("estudiar.sessionDone")}
      </h2>
      <p className="mt-3 text-ink-soft">
        {tr("estudiar.reviewedCount", { count: reviewedCount })}
      </p>
      {notice ? (
        <p className="mt-4 text-sm text-brand" role="status">
          {notice}
        </p>
      ) : null}
      <EndActions />
    </Card>
  );
}

/** La cola está vacía: no hay nada vencido ahora. */
export function NothingDue({ states }: { states: CardReviewState[] }) {
  const tr = useT();
  const { locale } = useLocale();

  const upcoming = states
    .filter((state) => !state.retired && state.next_review_at)
    .map((state) => Date.parse(state.next_review_at ?? ""))
    .filter((date) => date > Date.now())
    .sort((a, b) => a - b)[0];

  return (
    <Card className="mx-auto max-w-4xl p-8 text-center sm:p-12">
      <h2 className="font-display text-3xl text-brand">
        {tr(upcoming ? "estudiar.nothingDue" : "estudiar.nothingToPractice")}
      </h2>
      {upcoming ? (
        <p className="mt-3 text-ink-soft">
          {tr("estudiar.nextReview", {
            date: new Date(upcoming).toLocaleString(
              locale === "es" ? "es-CL" : "en-US",
              { dateStyle: "medium", timeStyle: "short" },
            ),
          })}
        </p>
      ) : null}
      <EndActions />
    </Card>
  );
}

function EndActions() {
  const tr = useT();

  return (
    <div className="mt-6 flex flex-wrap justify-center gap-3">
      <ButtonLink to="/biblioteca">{tr("estudiar.backToLibrary")}</ButtonLink>
      <ButtonLink to="/ajustes/repaso" variant="secondary">
        <GearSixIcon aria-hidden size={18} />
        {tr("estudiar.changeIntervals")}
      </ButtonLink>
    </div>
  );
}
