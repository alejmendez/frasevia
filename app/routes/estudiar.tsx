import { useState } from "react";
import { data, Link, redirect, useFetcher } from "react-router";
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  ConfigNotice,
  inputClass,
  Page,
  ProgressBar,
  Tag,
} from "~/components/ui";
import {
  buildSession,
  checkTypedAnswer,
  modeDescription,
  modeLabel,
  type PracticeItem,
  type PracticeResult,
  STUDY_MODES,
  type StudyMode,
  summarize,
} from "~/features/study/engine";
import { getMyDeck, getProgressForCards } from "~/lib/decks";
import { cardCountLabel, percentLabel } from "~/lib/format";
import { t } from "~/lib/locale";
import { useT } from "~/lib/locale-context";
import { getSession, loginPath } from "~/lib/session";
import { type CardProgress, type StudyCard, toStudyCard } from "~/lib/types";
import type { Route } from "./+types/estudiar";

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    {
      title: loaderData?.deck
        ? t("estudiar.metaDeck", { deck: loaderData.deck.title })
        : t("estudiar.metaTitle"),
    },
  ];
}

export async function clientLoader({
  request,
  params,
}: Route.ClientLoaderArgs) {
  const session = await getSession();

  if (session.status === "unconfigured") {
    return {
      status: "unconfigured" as const,
      deck: null,
      cards: [],
      progress: [],
    };
  }

  if (session.status === "anonymous") {
    throw redirect(loginPath(request));
  }

  const { deck, cards, error } = await getMyDeck(
    session.supabase,
    params.deckId,
  );

  if (error) {
    throw data({ message: error }, { status: 500 });
  }

  if (!deck) {
    throw data({ message: t("estudiar.deckNotFound") }, { status: 404 });
  }

  const { progress, error: progressError } = await getProgressForCards(
    session.supabase,
    cards.map((card) => card.id),
  );

  if (progressError) {
    throw data({ message: progressError }, { status: 500 });
  }

  return { status: "ready" as const, deck, cards, progress };
}

/**
 * Guarda los resultados de la sesión.
 *
 * Se envían los deltas de esta sesión (intentos y aciertos) y la función
 * `record_practice` los acumula en la base: así dos sesiones abiertas a la vez
 * no se pisan entre sí.
 */
export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const raw = String(formData.get("results") ?? "[]");

  const session = await getSession();
  if (session.status !== "ready") {
    return data(
      { ok: false as const, message: t("estudiar.sessionExpired") },
      { status: 401 },
    );
  }

  let results: { cardId: string; correct: boolean }[];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error("no es una lista");
    }
    results = parsed
      .filter(
        (item): item is { cardId: string; correct: boolean } =>
          typeof item?.cardId === "string" &&
          typeof item?.correct === "boolean",
      )
      .slice(0, 200);
  } catch {
    return data(
      { ok: false as const, message: t("estudiar.badResults") },
      { status: 400 },
    );
  }

  if (results.length === 0) {
    return { ok: true as const, message: t("estudiar.nothingToSave") };
  }

  const payload = results.map((result) => ({
    card_id: result.cardId,
    attempts: 1,
    correct_count: result.correct ? 1 : 0,
  }));

  const { error } = await session.supabase.rpc("record_practice", {
    p_results: payload,
  });

  if (error) {
    return data(
      { ok: false as const, message: error.message },
      { status: 400 },
    );
  }

  return { ok: true as const, message: t("estudiar.saved") };
}

const SESSION_SIZE = 10;

export default function Estudiar({ loaderData }: Route.ComponentProps) {
  const tr = useT();
  const [mode, setMode] = useState<StudyMode>("elegir");
  const [sessionKey, setSessionKey] = useState(0);

  if (loaderData.status === "unconfigured") {
    return <ConfigNotice />;
  }

  const { deck, cards, progress } = loaderData;
  const studyCards = cards.map(toStudyCard);

  return (
    <Page>
      <p className="mb-4 text-sm">
        <Link to="/biblioteca" className="text-ink-soft hover:text-ink">
          {tr("estudiar.backLibrary")}
        </Link>
      </p>

      <header className="mb-8">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h1 className="font-display text-3xl text-ink">{deck.title}</h1>
          {deck.is_official ? (
            <Tag tone="brand">{tr("biblioteca.official")}</Tag>
          ) : null}
        </div>
        <p className="text-sm text-ink-soft">
          {cardCountLabel(deck.card_count)}
        </p>
      </header>

      {studyCards.length === 0 ? (
        <Alert variant="warning" title={tr("estudiar.emptyDeckTitle")}>
          <p>
            {tr("estudiar.emptyDeckLead")}{" "}
            <Link
              to={`/biblioteca/mazos/${deck.id}/editar`}
              className="underline"
            >
              {tr("estudiar.addCards")}
            </Link>{" "}
            {tr("estudiar.emptyDeckTail")}
          </p>
        </Alert>
      ) : (
        <SessionRunner
          key={`${mode}-${sessionKey}`}
          cards={studyCards}
          progress={progress}
          mode={mode}
          onModeChange={setMode}
          onRestart={() => setSessionKey((value) => value + 1)}
        />
      )}
    </Page>
  );
}

function SessionRunner({
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
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<PracticeResult[]>([]);
  const [finished, setFinished] = useState(false);
  const tr = useT();
  const saveFetcher = useFetcher<{ ok: boolean; message: string }>();

  const progressByCard = new Map(progress.map((item) => [item.card_id, item]));
  const cardsById = new Map(cards.map((card) => [card.id, card]));

  const plan = buildSession(cards, { mode, limit: SESSION_SIZE });

  if (finished || index >= plan.items.length) {
    return (
      <SessionSummary
        results={results}
        cardsById={cardsById}
        saveFetcher={saveFetcher}
        onRestart={onRestart}
      />
    );
  }

  const item = plan.items[index];

  function record(correct: boolean, selfAssessed: boolean) {
    const nextResults: PracticeResult[] = [
      ...results,
      { cardId: item.card.id, correct, selfAssessed },
    ];

    setResults(nextResults);

    if (index + 1 >= plan.items.length) {
      // Se guarda una sola vez, al terminar, con los deltas de la sesión.
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

      <ModePicker mode={plan.mode} onChange={onModeChange} />

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-xs text-ink-faint">
          <span>
            {tr("estudiar.counter", {
              index: index + 1,
              total: plan.items.length,
            })}
          </span>
          <span>{modeLabel(plan.mode)}</span>
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
            escrita o el "revelar" de la tarjeta anterior se mantienen y la
            siguiente aparece ya respondida. */}
        <PracticeCard
          key={`${plan.mode}-${index}-${item.card.id}`}
          item={item}
          progress={progressByCard.get(item.card.id)}
          onAnswer={record}
        />
      </div>
    </div>
  );
}

function ModePicker({
  mode,
  onChange,
}: {
  mode: StudyMode;
  onChange: (mode: StudyMode) => void;
}) {
  const tr = useT();

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-ink">
        {tr("estudiar.modeLegend")}
      </legend>
      <div className="flex flex-wrap gap-2">
        {STUDY_MODES.map((option) => {
          const active = option === mode;
          return (
            <label
              key={option}
              className={`cursor-pointer rounded-lg border px-3 py-2 text-sm transition-colors ${
                active
                  ? "border-brand bg-brand-muted font-medium text-brand-strong"
                  : "border-line-strong bg-paper-raised text-ink-soft hover:bg-paper-sunken"
              }`}
            >
              <input
                type="radio"
                name="modo"
                value={option}
                checked={active}
                onChange={() => onChange(option)}
                className="sr-only"
              />
              {modeLabel(option)}
            </label>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-ink-faint">{modeDescription(mode)}</p>
    </fieldset>
  );
}

/** Una tarjeta en pantalla, con el formato que corresponda al modo. */
function PracticeCard({
  item,
  progress,
  onAnswer,
}: {
  item: PracticeItem;
  progress: CardProgress | undefined;
  onAnswer: (correct: boolean, selfAssessed: boolean) => void;
}) {
  const tr = useT();
  const stateLabel =
    progress?.state === "mastered"
      ? tr("estudiar.stateMastered")
      : progress?.attempts
        ? tr("estudiar.stateLearning")
        : tr("estudiar.stateNew");

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <Tag tone={progress?.state === "mastered" ? "brand" : "neutral"}>
          {stateLabel}
        </Tag>
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

type AnswerHandler = (correct: boolean, selfAssessed: boolean) => void;

/** Explorer: muestra todo el contenido y pide avanzar. */
function Explore({
  item,
  onAnswer,
}: {
  item: Extract<PracticeItem, { kind: "explorar" }>;
  onAnswer: AnswerHandler;
}) {
  const tr = useT();

  return (
    <div>
      <p className="font-display text-2xl text-brand">{item.card.term}</p>
      <p className="mt-2 text-lg text-ink">{item.card.meaningEs}</p>

      {item.card.exampleEn ? (
        <div className="mt-5 border-t border-line pt-4">
          <p className="text-ink">{item.card.exampleEn}</p>
          {item.card.exampleEs ? (
            <p className="mt-1 text-ink-soft">{item.card.exampleEs}</p>
          ) : null}
        </div>
      ) : null}

      {item.card.usageNote ? (
        <p className="mt-4 rounded-lg bg-paper-sunken px-4 py-3 text-sm text-ink-soft">
          <span className="font-medium text-ink">
            {tr("estudiar.usageNote")}
          </span>
          {item.card.usageNote}
        </p>
      ) : null}

      <div className="mt-6">
        <Button onClick={() => onAnswer(true, true)}>
          {tr("estudiar.continue")}
        </Button>
      </div>
    </div>
  );
}

/** Repaso: revela la respuesta y la persona se autoevalúa. */
function Review({
  item,
  onAnswer,
}: {
  item: Extract<PracticeItem, { kind: "revisar" }>;
  onAnswer: AnswerHandler;
}) {
  const [revealed, setRevealed] = useState(false);
  const tr = useT();

  return (
    <div>
      <p className="font-display text-2xl text-brand">{item.card.term}</p>

      {revealed ? (
        <div className="mt-4 space-y-3">
          <p className="text-lg text-ink">{item.card.meaningEs}</p>
          {item.card.exampleEn ? (
            <div className="border-t border-line pt-3">
              <p className="text-ink">{item.card.exampleEn}</p>
              {item.card.exampleEs ? (
                <p className="mt-1 text-ink-faint">{item.card.exampleEs}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink-faint">
          {tr("estudiar.reviewHint")}
        </p>
      )}

      {revealed ? (
        <div className="mt-6">
          <p className="mb-2 text-sm text-ink-soft">
            {tr("estudiar.didYouKnow")}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => onAnswer(true, true)}>
              {tr("estudiar.knewIt")}
            </Button>
            <Button variant="secondary" onClick={() => onAnswer(false, true)}>
              {tr("estudiar.almost")}
            </Button>
            <Button variant="ghost" onClick={() => onAnswer(false, true)}>
              {tr("estudiar.didNotKnow")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <Button onClick={() => setRevealed(true)}>
            {tr("estudiar.reveal")}
          </Button>
        </div>
      )}
    </div>
  );
}

/** Elegir significado: una opción correcta entre cuatro. */
function ChooseMeaning({
  item,
  onAnswer,
}: {
  item: Extract<PracticeItem, { kind: "elegir" }>;
  onAnswer: AnswerHandler;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const tr = useT();
  const answered = selected !== null;
  const isCorrect = selected === item.answerId;

  return (
    <div>
      <p className="font-display text-2xl text-brand">{item.card.term}</p>
      <p className="mt-1 text-sm text-ink-soft">{tr("estudiar.whatMeaning")}</p>

      <div className="mt-5 grid gap-2">
        {item.options.map((option) => {
          const chosen = selected === option.id;
          const isAnswer = option.id === item.answerId;
          const tone = !answered
            ? "border-line-strong hover:border-brand hover:bg-brand-muted"
            : isAnswer
              ? "border-success bg-success-muted"
              : chosen
                ? "border-danger bg-danger-muted"
                : "border-line bg-paper-raised opacity-60";

          return (
            <button
              key={option.id}
              type="button"
              disabled={answered}
              aria-pressed={chosen}
              onClick={() => setSelected(option.id)}
              className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${tone}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {answered ? (
        <div className="mt-5">
          <Alert variant={isCorrect ? "success" : "error"}>
            {isCorrect
              ? tr("estudiar.correctAnswer", { meaning: item.card.meaningEs })
              : tr("estudiar.wasAnswer", { meaning: item.card.meaningEs })}
          </Alert>
          <div className="mt-4">
            <Button onClick={() => onAnswer(isCorrect, false)}>
              {tr("estudiar.continue")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Completar la frase: la persona escribe el término oculto. */
function FillTheBlank({
  item,
  onAnswer,
}: {
  item: Extract<PracticeItem, { kind: "completar" }>;
  onAnswer: AnswerHandler;
}) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const tr = useT();
  const isCorrect = checkTypedAnswer(value, item.answers);
  const [before = "", after = ""] = item.sentence.split("____");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <p className="text-sm text-ink-soft">{tr("estudiar.fillInstruction")}</p>

      <p className="mt-4 rounded-lg bg-paper-sunken px-4 py-6 text-center font-display text-xl leading-relaxed text-ink">
        {/* `buildFillInTheBlank` siempre deja un solo hueco, así que basta
            partir la oración en dos tramos. */}
        {before}
        <span className="mx-1 border-b-2 border-brand text-brand">
          {submitted ? (isCorrect ? value.trim() : item.card.term) : "________"}
        </span>
        {after}
      </p>

      <div className="mt-5">
        <label htmlFor="respuesta" className="sr-only">
          {tr("estudiar.answerLabel")}
        </label>
        <input
          id="respuesta"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={submitted}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={tr("estudiar.answerPlaceholder")}
          className={inputClass}
        />
      </div>

      {submitted ? (
        <div className="mt-5">
          <Alert variant={isCorrect ? "success" : "error"}>
            {isCorrect
              ? tr("estudiar.correctTyped")
              : tr("estudiar.wasTerm", { term: item.card.term })}
          </Alert>
          {item.card.exampleEs ? (
            <p className="mt-3 text-sm text-ink-soft">{item.card.exampleEs}</p>
          ) : null}
          <div className="mt-4">
            <Button onClick={() => onAnswer(isCorrect, false)}>
              {tr("estudiar.continue")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-5">
          <Button type="submit" disabled={value.trim() === ""}>
            {tr("estudiar.check")}
          </Button>
        </div>
      )}
    </form>
  );
}

/** Estado del envío de progreso, tal como lo expone `useFetcher`. */
type SaveFetcher = {
  state: "idle" | "submitting" | "loading";
  data: { ok: boolean; message: string } | undefined;
};

function SessionSummary({
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
  const saveFailed = saveFetcher.data?.ok === false;

  return (
    <Card>
      <h2 className="font-display text-2xl text-ink">
        {tr("estudiar.sessionDone")}
      </h2>

      <dl className="mt-5 grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs tracking-wide text-ink-faint uppercase">
            {tr("estudiar.statPracticed")}
          </dt>
          <dd className="font-display text-3xl text-ink">
            {summary.practiced}
          </dd>
        </div>
        <div>
          <dt className="text-xs tracking-wide text-ink-faint uppercase">
            {tr("estudiar.statCorrect")}
          </dt>
          <dd className="font-display text-3xl text-ink">{summary.correct}</dd>
        </div>
        <div>
          <dt className="text-xs tracking-wide text-ink-faint uppercase">
            {tr("estudiar.statAccuracy")}
          </dt>
          <dd className="font-display text-3xl text-ink">
            {percentLabel(summary.accuracy)}
          </dd>
        </div>
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
          : saveFailed
            ? tr("estudiar.saveFailed", {
                message: saveFetcher.data?.message ?? "",
              })
            : tr("estudiar.saved")}
      </p>
    </Card>
  );
}
