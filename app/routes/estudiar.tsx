import {
  ArrowLeftIcon,
  ArrowsClockwiseIcon,
  GearSixIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { data, Link, redirect, useFetcher } from "react-router";
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  ConfigNotice,
  cx,
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
import { buildReviewSession, reviewDirection } from "~/features/study/schedule";
import { getMyDeck, getProgressForCards } from "~/lib/decks";
import { percentLabel } from "~/lib/format";
import { t } from "~/lib/locale";
import { useLocale, useT } from "~/lib/locale-context";
import {
  listCardReviewStates,
  listPendingReviewCards,
  listReviewLevels,
} from "~/lib/reviews";
import { getSession, loginPath } from "~/lib/session";
import type { CardReviewState, ReviewLevel } from "~/lib/types";
import { type CardProgress, type StudyCard, toStudyCard } from "~/lib/types";
import type { Route } from "./+types/estudiar";

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    {
      title: loaderData?.deck?.title
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
      reviewStates: [],
      reviewLevels: [],
      direction: "es-en",
    };
  }

  if (session.status === "anonymous") {
    throw redirect(loginPath(request));
  }

  if (!params.deckId) {
    const [queueResult, levelsResult] = await Promise.all([
      listPendingReviewCards(session.supabase),
      listReviewLevels(session.supabase),
    ]);
    if (queueResult.error || levelsResult.error) {
      throw data(
        { message: queueResult.error ?? levelsResult.error ?? "" },
        { status: 500 },
      );
    }

    const cards: StudyCard[] = queueResult.cards.map((row) => {
      const spanishToEnglish =
        row.source_language === "es" && row.target_language === "en";
      return {
        id: row.card_id,
        term: spanishToEnglish ? row.meaning_es : row.term,
        meaningEs: spanishToEnglish ? row.term : row.meaning_es,
        exampleEn: row.example_en,
        exampleEs: row.example_es,
        usageNote: row.usage_note,
        direction: row.direction,
        sourceLanguage: row.source_language,
        targetLanguage: row.target_language,
        deckTitle: row.deck_title,
      };
    });
    const reviewStates: CardReviewState[] = queueResult.cards.map((row) => ({
      card_id: row.card_id,
      direction: row.direction,
      last_reviewed_at: row.last_reviewed_at,
      next_review_at: row.next_review_at,
      retired: false,
      last_level_id: row.last_level_id,
      review_count: row.review_count,
      updated_at: row.last_reviewed_at,
    }));

    return {
      status: "ready" as const,
      scope: "global" as const,
      deck: null,
      cards,
      progress: [],
      reviewStates,
      reviewLevels: levelsResult.levels,
      direction: null,
    };
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

  const direction = reviewDirection(deck.source_language, deck.target_language);
  const [reviewResult, levelsResult] = await Promise.all([
    listCardReviewStates(
      session.supabase,
      cards.map((card) => card.id),
      direction,
    ),
    listReviewLevels(session.supabase),
  ]);

  if (reviewResult.error || levelsResult.error) {
    throw data(
      { message: reviewResult.error ?? levelsResult.error ?? "" },
      { status: 500 },
    );
  }

  return {
    status: "ready" as const,
    scope: "deck" as const,
    deck,
    cards: cards.map((card) => ({
      ...toStudyCard(card, deck.source_language, deck.target_language),
      direction,
      sourceLanguage: deck.source_language,
      targetLanguage: deck.target_language,
      deckTitle: deck.title,
    })),
    progress,
    reviewStates: reviewResult.states,
    reviewLevels: levelsResult.levels,
    direction,
  };
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
  if (formData.get("intent") === "rate-review") {
    const session = await getSession();
    if (session.status !== "ready") {
      return data(
        {
          ok: false as const,
          eventId: "",
          message: t("estudiar.sessionExpired"),
        },
        { status: 401 },
      );
    }

    const cardId = String(formData.get("cardId") ?? "");
    const direction = String(formData.get("direction") ?? "");
    const levelId = String(formData.get("levelId") ?? "");
    const eventId = String(formData.get("eventId") ?? "");
    const timezone = String(formData.get("timezone") ?? "UTC");

    if (!cardId || !direction || !levelId || !eventId) {
      return data(
        { ok: false as const, eventId, message: t("estudiar.badReview") },
        { status: 400 },
      );
    }

    const { data: saved, error } = await session.supabase.rpc(
      "record_card_review",
      {
        p_card_id: cardId,
        p_direction: direction,
        p_level_id: levelId,
        p_idempotency_key: eventId,
        p_timezone: timezone,
      },
    );

    if (error) {
      return data(
        { ok: false as const, eventId, message: error.message },
        { status: 400 },
      );
    }

    return { ok: true as const, eventId, saved };
  }

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

  const { deck, cards, progress, reviewStates, reviewLevels, direction } =
    loaderData;
  const isDeckSession = loaderData.scope === "deck";
  const studyCards = cards;
  const deckTitle = deck?.title ?? tr("estudiar.pendingTitle");

  return (
    <Page className="max-w-7xl">
      <Link
        to="/biblioteca"
        className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm text-brand hover:underline"
      >
        <ArrowLeftIcon aria-hidden size={18} />
        {tr("estudiar.backLibrary")}
      </Link>

      <header className="mb-7">
        <p className="text-sm font-medium text-ink-soft">{deckTitle}</p>
        <h1 className="mt-2 font-display text-4xl leading-tight text-brand sm:text-5xl">
          {tr("estudiar.recallTitle")}
        </h1>
        <p className="mt-2 text-ink-soft">{tr("estudiar.recallSubtitle")}</p>
      </header>

      {isDeckSession && cards.length === 0 ? (
        <Alert variant="warning" title={tr("estudiar.emptyDeckTitle")}>
          <p>
            {tr("estudiar.emptyDeckLead")}{" "}
            <Link
              to={`/biblioteca/mazos/${deck?.id}/editar`}
              className="underline"
            >
              {tr("estudiar.addCards")}
            </Link>{" "}
            {tr("estudiar.emptyDeckTail")}
          </p>
        </Alert>
      ) : (
        <>
          <MemoryReviewSession
            key={`${deck?.id ?? "global"}-${sessionKey}`}
            cards={studyCards}
            states={reviewStates}
            levels={reviewLevels}
            direction={direction}
          />

          {isDeckSession ? (
            <details className="mt-10 rounded-card border border-line bg-paper-raised/75 p-5 sm:p-6">
              <summary className="min-h-11 cursor-pointer font-display text-2xl text-brand">
                {tr("estudiar.otherPractices")}
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {tr("estudiar.otherPracticesHint")}
              </p>
              <div className="mt-5">
                <SessionRunner
                  key={`${mode}-${sessionKey}`}
                  cards={studyCards}
                  progress={progress}
                  mode={mode}
                  onModeChange={setMode}
                  onRestart={() => setSessionKey((value) => value + 1)}
                />
              </div>
            </details>
          ) : null}
        </>
      )}
    </Page>
  );
}

type MemoryReviewAction = {
  ok: boolean;
  eventId: string;
  saved?: {
    next_review_at?: string | null;
    retired?: boolean;
    level_name?: string;
  };
  message?: string;
};

const LEVEL_STYLE: Record<string, string> = {
  coral: "rating-level--coral",
  sand: "rating-level--sand",
  sage: "rating-level--sage",
  lime: "rating-level--lime",
  forest: "rating-level--forest",
  blue: "rating-level--blue",
};

function MemoryReviewSession({
  cards,
  states,
  levels,
  direction,
}: {
  cards: StudyCard[];
  states: CardReviewState[];
  levels: ReviewLevel[];
  direction: string | null;
}) {
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
  const [items] = useState(() => buildReviewSession(cards, states, direction));
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const eventId = useRef<string | null>(null);
  const transitionTimeout = useRef<number | null>(null);
  const frontHeadingRef = useRef<HTMLHeadingElement>(null);
  const backHeadingRef = useRef<HTMLHeadingElement>(null);
  const item = items[index];
  const cardFocusKey = item ? `${item.card.id}:${item.direction}` : null;
  const currentState = item
    ? states.find(
        (state) =>
          state.card_id === item.card.id && state.direction === item.direction,
      )
    : undefined;

  const rate = useCallback(
    (level: ReviewLevel) => {
      if (!item || saving || isTransitioning || !revealed) return;
      setSaving(true);
      setError(null);
      setNotice("");
      eventId.current ??= crypto.randomUUID();

      const timezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      void fetcher.submit(
        {
          intent: "rate-review",
          cardId: item.card.id,
          direction: item.direction,
          levelId: level.id,
          eventId: eventId.current,
          timezone,
        },
        { method: "post" },
      );
    },
    [fetcher, isTransitioning, item, revealed, saving],
  );

  const reveal = useCallback(() => {
    if (revealed || saving) return;
    if (transitionTimeout.current !== null) {
      window.clearTimeout(transitionTimeout.current);
      transitionTimeout.current = null;
    }
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
  }, [revealed, saving]);

  useEffect(
    () => () => {
      if (transitionTimeout.current !== null) {
        window.clearTimeout(transitionTimeout.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!cardFocusKey) return;
    (revealed ? backHeadingRef.current : frontHeadingRef.current)?.focus();
  }, [cardFocusKey, revealed]);

  useEffect(() => {
    if (
      fetcher.state !== "idle" ||
      !fetcher.data ||
      fetcher.data.eventId !== eventId.current
    ) {
      return;
    }

    setSaving(false);
    if (!fetcher.data.ok) {
      setError(fetcher.data.message ?? tr("estudiar.saveFailedGeneric"));
      return;
    }

    const nextAt = fetcher.data.saved?.next_review_at;
    setNotice(
      fetcher.data.saved?.retired
        ? tr("estudiar.retiredConfirmation")
        : nextAt
          ? tr("estudiar.nextReview", {
              date: new Date(nextAt).toLocaleString(
                locale === "es" ? "es-CL" : "en-US",
                {
                  dateStyle: "medium",
                  timeStyle: "short",
                },
              ),
            })
          : tr("estudiar.saved"),
    );
    eventId.current = null;
    setError(null);
    setRevealed(false);
    setIsTransitioning(false);
    if (transitionTimeout.current !== null) {
      window.clearTimeout(transitionTimeout.current);
      transitionTimeout.current = null;
    }
    setIndex((value) => value + 1);
  }, [fetcher.data, fetcher.state, locale, tr]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
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
      if (saving || isTransitioning || !item) return;

      if ((event.code === "Space" || event.key === " ") && !revealed) {
        event.preventDefault();
        reveal();
        return;
      }

      if (revealed && /^[1-9]$/.test(event.key)) {
        const level = activeLevels[Number(event.key) - 1];
        if (level) {
          event.preventDefault();
          rate(level);
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeLevels, isTransitioning, item, rate, reveal, revealed, saving]);

  function levelName(level: ReviewLevel) {
    if (
      level.system_key &&
      DEFAULT_LEVEL_NAMES[level.system_key] === level.name
    ) {
      switch (level.system_key) {
        case "difficult":
          return tr("estudiar.level.difficult");
        case "normal":
          return tr("estudiar.level.normal");
        case "easy":
          return tr("estudiar.level.easy");
        case "very_easy":
          return tr("estudiar.level.veryEasy");
      }
    }
    return level.name;
  }

  function intervalName(level: ReviewLevel) {
    if (level.action === "retire") return tr("estudiar.noFurtherReviews");
    if (level.interval_unit === "days" && level.interval_amount === 1) {
      return tr("estudiar.tomorrow");
    }
    const amount = level.interval_amount ?? 1;
    if (level.interval_unit === "minutes") {
      return tr("estudiar.intervalMinutes", { amount });
    }
    if (level.interval_unit === "hours") {
      return tr("estudiar.intervalHours", { amount });
    }
    return tr("estudiar.intervalDays", { amount });
  }

  if (items.length > 0 && index >= items.length) {
    return (
      <Card className="mx-auto max-w-4xl p-8 text-center sm:p-12">
        <h2 className="font-display text-3xl text-brand">
          {tr("estudiar.sessionDone")}
        </h2>
        <p className="mt-3 text-ink-soft">
          {tr("estudiar.reviewedCount", { count: items.length })}
        </p>
        {notice ? (
          <p className="mt-4 text-sm text-brand" role="status">
            {notice}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/biblioteca">
            {tr("estudiar.backToLibrary")}
          </ButtonLink>
          <ButtonLink to="/ajustes/repaso" variant="secondary">
            <GearSixIcon aria-hidden size={18} />
            {tr("estudiar.changeIntervals")}
          </ButtonLink>
        </div>
      </Card>
    );
  }

  if (items.length === 0 || !item) {
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
                {
                  dateStyle: "medium",
                  timeStyle: "short",
                },
              ),
            })}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/biblioteca">
            {tr("estudiar.backToLibrary")}
          </ButtonLink>
          <ButtonLink to="/ajustes/repaso" variant="secondary">
            <GearSixIcon aria-hidden size={18} />
            {tr("estudiar.changeIntervals")}
          </ButtonLink>
        </div>
      </Card>
    );
  }

  const isSpanishToEnglish = item.direction === "es-en";
  const sourceLanguage =
    item.card.sourceLanguage ?? (isSpanishToEnglish ? "es" : "en");
  const targetLanguage =
    item.card.targetLanguage ?? (isSpanishToEnglish ? "en" : "es");
  const sourceText = item.card.term;
  const targetText = item.card.meaningEs;
  const targetExample =
    targetLanguage === "en" ? item.card.exampleEn : item.card.exampleEs;
  const exampleTranslation =
    sourceLanguage === "en" ? item.card.exampleEn : item.card.exampleEs;
  const answeredCount = Math.min(index, items.length);

  return (
    <section className="mx-auto max-w-5xl">
      <div className="mb-3 flex items-center justify-between gap-4 text-sm text-ink-soft">
        <span>
          {tr("estudiar.counter", { index: index + 1, total: items.length })}
        </span>
        <span>
          {tr(
            item.status === "due"
              ? "estudiar.pendingLabel"
              : "estudiar.newLabel",
          )}
        </span>
      </div>
      <ProgressBar
        value={index}
        total={items.length}
        label={tr("estudiar.sessionAria", { index, total: items.length })}
      />

      <div className="review-card-perspective mt-7">
        <div className={cx("review-card-rotator", revealed && "is-revealed")}>
          <article
            aria-hidden={revealed}
            className="paper-card review-card-face p-7 sm:p-10"
          >
            <span aria-hidden="true" className="paper-tape" />
            <div className="paper-card__margin min-h-80 pl-6 sm:pl-9">
              <p className="text-xs font-bold tracking-[0.16em] text-brand uppercase">
                {tr("estudiar.direction", {
                  source: sourceLanguage.toUpperCase(),
                  target: targetLanguage.toUpperCase(),
                })}
              </p>
              {item.card.deckTitle ? (
                <p className="mt-2 text-xs text-ink-faint">
                  {item.card.deckTitle}
                </p>
              ) : null}
              <h2
                ref={frontHeadingRef}
                tabIndex={-1}
                className="handwritten mt-5 text-2xl leading-snug text-brand outline-none sm:text-3xl"
              >
                {tr(
                  targetLanguage === "es"
                    ? "estudiar.promptSpanish"
                    : "estudiar.promptEnglish",
                )}
              </h2>
              <p
                lang={sourceLanguage}
                className="handwritten mt-8 break-words text-5xl leading-tight text-brand sm:text-7xl"
              >
                {sourceText}
              </p>
              <p className="handwritten mt-8 text-xl text-ink-soft sm:text-2xl">
                {tr("estudiar.recallHint")}
              </p>
            </div>
          </article>

          <article
            aria-hidden={!revealed}
            className="paper-card review-card-face review-card-face--back p-7 sm:p-10"
          >
            <span aria-hidden="true" className="paper-tape" />
            <div className="paper-card__margin pl-6 sm:pl-9">
              <p className="text-xs font-bold tracking-[0.16em] text-brand uppercase">
                {tr("estudiar.responseLabel")}
              </p>
              <h2
                ref={backHeadingRef}
                tabIndex={revealed ? -1 : undefined}
                lang={targetLanguage}
                className="handwritten mt-3 break-words text-5xl leading-tight text-brand outline-none sm:text-7xl"
              >
                {targetText}
              </h2>
              <p className="handwritten mt-1 text-2xl text-ink-soft sm:text-3xl">
                {sourceText}
              </p>
              {targetExample ? (
                <div className="mt-6 border-t border-line pt-5">
                  <p
                    lang={targetLanguage}
                    className="handwritten break-words text-2xl leading-snug text-brand sm:text-3xl"
                  >
                    {targetExample}
                  </p>
                  {exampleTranslation ? (
                    <p
                      lang={sourceLanguage}
                      className="mt-2 text-sm leading-relaxed text-ink-soft"
                    >
                      {exampleTranslation}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {item.card.usageNote ? (
                <p className="mt-4 border-t border-line pt-3 text-sm leading-relaxed text-ink-soft">
                  <span className="font-medium text-ink">
                    {tr("estudiar.usageNote")}
                  </span>
                  {item.card.usageNote}
                </p>
              ) : null}
            </div>
          </article>
        </div>
      </div>

      {!revealed ? (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button className="min-h-14 min-w-56 px-7" onClick={reveal}>
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
      ) : (
        <div className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl text-brand">
              {tr("estudiar.ratingQuestion")}
            </h2>
            <ButtonLink to="/ajustes/repaso" variant="ghost">
              <GearSixIcon aria-hidden size={17} />
              {tr("estudiar.changeIntervals")}
            </ButtonLink>
          </div>
          {activeLevels.length === 0 ? (
            <Alert variant="warning" title={tr("estudiar.noActiveLevels")}>
              <Link to="/ajustes/repaso" className="underline">
                {tr("estudiar.changeIntervals")}
              </Link>
            </Alert>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {activeLevels.map((level, levelIndex) => (
                <button
                  type="button"
                  key={level.id}
                  disabled={saving || isTransitioning || !revealed}
                  onClick={() => rate(level)}
                  aria-keyshortcuts={
                    levelIndex < 9 ? String(levelIndex + 1) : undefined
                  }
                  aria-label={`${levelIndex + 1}. ${levelName(level)}. ${intervalName(level)}`}
                  className={cx(
                    "flex min-h-20 items-center gap-3 rounded-xl border px-4 py-3 text-left transition-transform active:scale-[0.98] disabled:cursor-wait disabled:opacity-60",
                    LEVEL_STYLE[level.color] ?? LEVEL_STYLE.sand,
                  )}
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-paper/65 text-lg font-semibold">
                    {levelIndex + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold">
                      {levelName(level)}
                    </span>
                    <span className="mt-0.5 block text-sm opacity-80">
                      {intervalName(level)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
          {activeLevels.length > 0 ? (
            <p className="mt-3 text-right text-xs text-ink-faint">
              {tr("estudiar.ratingShortcutHint", {
                count: Math.min(activeLevels.length, 9),
              })}
            </p>
          ) : null}
          <p className="mt-3 text-right text-xs text-ink-faint">
            {tr("estudiar.retiredCanReturn")}
          </p>
          {error ? (
            <Alert variant="error" className="mt-4">
              <p>{tr("estudiar.saveFailed", { message: error })}</p>
              <p className="mt-1">{tr("estudiar.retrySameCard")}</p>
            </Alert>
          ) : null}
          {saving ? (
            <p role="status" className="mt-3 text-sm text-ink-soft">
              {tr("estudiar.savingProgress")}
            </p>
          ) : null}
          {notice ? (
            <p
              role="status"
              aria-live="polite"
              className="mt-3 text-sm text-brand"
            >
              {notice}
            </p>
          ) : null}
          {currentState ? (
            <span className="sr-only">
              {tr("estudiar.reviewedBefore", {
                count: currentState.review_count,
              })}
            </span>
          ) : null}
          {answeredCount > 0 ? (
            <span className="sr-only">
              {tr("estudiar.counter", {
                index: answeredCount,
                total: items.length,
              })}
            </span>
          ) : null}
        </div>
      )}
    </section>
  );
}

const DEFAULT_LEVEL_NAMES: Record<string, string> = {
  difficult: "Difícil",
  normal: "Normal",
  easy: "Fácil",
  very_easy: "Súper fácil",
};

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
  const targetLanguage = item.card.targetLanguage ?? "en";
  const targetExample =
    targetLanguage === "es" ? item.card.exampleEs : item.card.exampleEn;
  const sourceExample =
    targetLanguage === "es" ? item.card.exampleEn : item.card.exampleEs;

  return (
    <div>
      <p className="font-display text-2xl text-brand">{item.card.term}</p>
      <p className="mt-2 text-lg text-ink">{item.card.meaningEs}</p>

      {targetExample || sourceExample ? (
        <div className="mt-5 border-t border-line pt-4">
          {targetExample ? (
            <p lang={targetLanguage} className="text-ink">
              {targetExample}
            </p>
          ) : null}
          {sourceExample ? (
            <p lang={item.card.sourceLanguage} className="mt-1 text-ink-soft">
              {sourceExample}
            </p>
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
  const targetLanguage = item.card.targetLanguage ?? "en";
  const targetExample =
    targetLanguage === "es" ? item.card.exampleEs : item.card.exampleEn;
  const sourceExample =
    targetLanguage === "es" ? item.card.exampleEn : item.card.exampleEs;

  return (
    <div>
      <p className="font-display text-2xl text-brand">{item.card.term}</p>

      {revealed ? (
        <div className="mt-4 space-y-3">
          <p className="text-lg text-ink">{item.card.meaningEs}</p>
          {targetExample || sourceExample ? (
            <div className="border-t border-line pt-3">
              {targetExample ? (
                <p lang={targetLanguage} className="text-ink">
                  {targetExample}
                </p>
              ) : null}
              {sourceExample ? (
                <p
                  lang={item.card.sourceLanguage}
                  className="mt-1 text-ink-faint"
                >
                  {sourceExample}
                </p>
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
  const answerPlaceholder =
    item.card.targetLanguage === "es"
      ? tr("estudiar.answerPlaceholderSpanish")
      : tr("estudiar.answerPlaceholder");
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
          {submitted ? (isCorrect ? value.trim() : item.answer) : "________"}
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
          placeholder={answerPlaceholder}
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
