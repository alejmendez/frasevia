import { Button, ButtonLink, Card, Tag } from "~/components/ui";
import { percentLabel } from "~/lib/format";
import { useT } from "~/lib/locale-context";
import type { CardProgress, StudyCard } from "~/lib/types";
import { type PracticeResult, summarize } from "../engine";
import type { SaveFetcher } from "../save-practice";

/**
 * El resumen de una práctica y el aviso de si se pudo guardar.
 *
 * El envío va por `fetcher` a propósito: quien termina una sesión de diez
 * tarjetas no debería perder el scroll ni volver arriba porque el progreso se
 * guardó. Por eso el estado del envío y el resumen están en el mismo sitio: se
 * muestran juntos y el fallo se lee sin buscar.
 *
 * El `fetcher` lo crea quien manda el envío y lo pasa. No puede ser propio: el
 * resumen se monta después de que la pantalla dejara de existir, y un `fetcher`
 * distinto no sabría nada de la respuesta.
 */
export function PracticeSummary({
  results,
  cardsById,
  saveFetcher,
  onRestart,
}: {
  results: PracticeResult[];
  cardsById: Map<string, StudyCard>;
  saveFetcher: SaveFetcher;
  onRestart: () => void;
}) {
  const tr = useT();
  const summary = summarize(results, cardsById);
  const failed = saveFetcher.data?.ok === false;

  return (
    <Card>
      <h2 className="font-display text-2xl text-ink">
        {tr("estudiar.sessionDone")}
      </h2>

      <dl className="mt-5 grid gap-4 sm:grid-cols-3">
        <Stat label={tr("estudiar.statPracticed")} value={summary.practiced} />
        <Stat label={tr("estudiar.statCorrect")} value={summary.correct} />
        <Stat
          label={tr("estudiar.statAccuracy")}
          value={percentLabel(summary.accuracy)}
        />
      </dl>

      {summary.needsReview.length > 0 ? (
        <div className="mt-6 border-t border-line pt-4">
          <h3 className="text-sm font-semibold text-ink">
            {tr("estudiar.keepPracticingTitle")}
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-ink-soft">
            {summary.needsReview.map((card) => (
              <li key={card.id}>
                <span className="text-brand">{card.term}</span> —{" "}
                {card.meaningEs}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Button onClick={onRestart}>{tr("estudiar.repeat")}</Button>
        <ButtonLink to="/progreso" variant="secondary">
          {tr("estudiar.seeProgress")}
        </ButtonLink>
        <ButtonLink to="/biblioteca" variant="ghost">
          {tr("estudiar.backToLibrary")}
        </ButtonLink>
      </div>

      <p className="mt-4 text-xs text-ink-faint" role="status">
        {saveFetcher.state !== "idle"
          ? tr("estudiar.savingProgress")
          : failed
            ? tr("estudiar.saveFailed", {
                message: saveFetcher.data?.message ?? "",
              })
            : tr("estudiar.saved")}
      </p>
    </Card>
  );
}

/** El estado de la tarjeta, arriba en la práctica. */
export function CardStateTag({ progress }: { progress?: CardProgress }) {
  const tr = useT();
  const label =
    progress?.state === "mastered"
      ? tr("estudiar.stateMastered")
      : progress?.attempts
        ? tr("estudiar.stateLearning")
        : tr("estudiar.stateNew");

  return (
    <Tag tone={progress?.state === "mastered" ? "brand" : "neutral"}>
      {label}
    </Tag>
  );
}

/** Un número grande con su nombre encima. */
function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-ink-faint uppercase">
        {label}
      </dt>
      <dd className="font-display text-3xl text-ink">{value}</dd>
    </div>
  );
}
