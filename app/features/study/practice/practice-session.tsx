import { useState } from "react";
import { useFetcher } from "react-router";

import { Alert, Card, ProgressBar } from "~/components/ui";
import { useT } from "~/lib/locale-context";
import type { CardProgress, StudyCard } from "~/lib/types";
import {
  buildSession,
  modeLabel,
  type PracticeItem,
  type PracticeResult,
  type StudyMode,
} from "../engine";
import {
  type AnswerHandler,
  ChooseMeaning,
  Explore,
  FillTheBlank,
  Review,
} from "./cards";
import { ModePicker } from "./mode-picker";
import { CardStateTag, PracticeSummary } from "./practice-summary";

/**
 * Una tanda de práctica: diez tarjetas en el modo que se elija.
 *
 * El motor (`features/study/engine.ts`) decide qué se muestra y si una respuesta
 * escrita es correcta; esto solo lleva la cuenta y pinta lo que el motor devuelve.
 *
 * El guardado va por `fetcher` y ocurre una sola vez, al terminar, con los deltas
 * de toda la sesión: mandarlos de uno en uno multiplicaría los viajes por diez
 * para aprender lo mismo en la base.
 */
export function PracticeSession({
  cards,
  progress,
  mode,
  onModeChange,
  onRestart,
}: {
  cards: StudyCard[];
  progress: CardProgress[];
  mode: StudyMode;
  onModeChange: (mode: StudyMode) => void;
  onRestart: () => void;
}) {
  const tr = useT();
  const saveFetcher = useFetcher<{ ok: boolean; message: string }>();
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<PracticeResult[]>([]);
  const [finished, setFinished] = useState(false);

  const plan = buildSession(cards, { mode, limit: SESSION_SIZE });
  const general = cards[0]?.studyMode === "general";

  if (finished || index >= plan.items.length) {
    return (
      <PracticeSummary
        results={results}
        cardsById={new Map(cards.map((card) => [card.id, card]))}
        saveFetcher={saveFetcher}
        onRestart={onRestart}
      />
    );
  }

  const item = plan.items[index];
  const cardProgress = progressByCard(progress, item.card.id);

  function record(correct: boolean, selfAssessed: boolean) {
    const nextResults: PracticeResult[] = [
      ...results,
      { cardId: item.card.id, correct, selfAssessed },
    ];

    setResults(nextResults);

    if (index + 1 >= plan.items.length) {
      void saveFetcher.submit(
        { results: JSON.stringify(nextResults) },
        { method: "post" },
      );
      setFinished(true);
      return;
    }

    setIndex((value) => value + 1);
  }

  return (
    <div>
      {plan.notice ? (
        <div className="mb-5">
          <Alert variant="info" title={tr("estudiar.adjustedTitle")}>
            {plan.notice}
          </Alert>
        </div>
      ) : null}

      <ModePicker mode={plan.mode} onChange={onModeChange} general={general} />

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-xs text-ink-faint">
          <span>
            {tr("estudiar.counter", {
              index: index + 1,
              total: plan.items.length,
            })}
          </span>
          <span>
            {general && plan.mode === "elegir"
              ? tr("general.choiceMode")
              : modeLabel(plan.mode)}
          </span>
        </div>
        <ProgressBar
          value={index}
          total={plan.items.length}
          label={tr("estudiar.sessionAria", {
            index,
            total: plan.items.length,
          })}
        />
      </div>

      <div className="mt-6">
        {/* La clave incluye el índice: React reutiliza la instancia del
            componente entre tarjetas y, sin esto, la opción elegida, la frase
            escrita o el «revelar» de la tarjeta anterior se mantienen y la
            siguiente aparece ya respondida. */}
        <PracticeCard
          key={`${plan.mode}-${index}-${item.card.id}`}
          item={item}
          progress={cardProgress}
          onAnswer={record}
        />
      </div>
    </div>
  );
}

/** Una tarjeta en pantalla, con el formato que corresponda al modo. */
function PracticeCard({
  item,
  progress,
  onAnswer,
}: {
  item: PracticeItem;
  progress?: CardProgress;
  onAnswer: AnswerHandler;
}) {
  const tr = useT();

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <CardStateTag progress={progress} />
        {progress?.attempts ? (
          <span className="text-xs text-ink-faint">
            {tr("estudiar.score", {
              correct: progress.correct_count,
              attempts: progress.attempts,
            })}
          </span>
        ) : null}
      </div>

      {item.kind === "elegir" ? (
        <ChooseMeaning item={item} onAnswer={onAnswer} />
      ) : item.kind === "completar" ? (
        <FillTheBlank item={item} onAnswer={onAnswer} />
      ) : item.kind === "revisar" ? (
        <Review item={item} onAnswer={onAnswer} />
      ) : (
        <Explore item={item} onAnswer={onAnswer} />
      )}
    </Card>
  );
}

function progressByCard(
  progress: CardProgress[],
  cardId: string,
): CardProgress | undefined {
  return progress.find((item) => item.card_id === cardId);
}

/** Cuántas tarjetas caben en una tanda. */
export const SESSION_SIZE = 10;
