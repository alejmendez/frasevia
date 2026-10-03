import {
  ArrowRightIcon,
  CalendarDotsIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  SparkleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useEffect, useMemo, useState } from "react";
import { Link, redirect, useRevalidator } from "react-router";
import {
  Alert,
  ButtonLink,
  Card,
  ConfigNotice,
  EmptyState,
  inputClass,
  Page,
  PageHeader,
  Tag,
} from "~/components/ui";
import { DeckTile } from "~/features/decks/deck-tile";
import type { LibraryDeck } from "~/lib/decks";
import { listMyDecks } from "~/lib/decks";
import { formatRelativeTime } from "~/lib/format";
import { t } from "~/lib/locale";
import { useLocale, useT } from "~/lib/locale-context";
import {
  countPendingReviewCards,
  listScheduledReviewDates,
  type ScheduledReviewDate,
} from "~/lib/reviews";
import { getSession, loginPath } from "~/lib/session";
import type { Route } from "./+types/biblioteca";

type VisibilityFilter = "all" | "private" | "public";

interface UpcomingGroup {
  date: Date;
  count: number;
}

export function meta() {
  return [{ title: t("biblioteca.metaTitle") }];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const session = await getSession();

  if (session.status === "unconfigured") {
    return {
      status: "unconfigured" as const,
      decks: [],
      upcoming: [],
      pendingCount: 0,
      error: null,
      deckError: null,
      reviewError: null,
      scheduleError: null,
      pendingError: null,
    };
  }

  if (session.status === "anonymous") {
    throw redirect(loginPath(request));
  }

  const [deckResult, scheduleResult, pendingResult] = await Promise.all([
    listMyDecks(session.supabase, session.userId),
    listScheduledReviewDates(session.supabase),
    countPendingReviewCards(session.supabase),
  ]);
  return {
    status: "ready" as const,
    decks: deckResult.decks,
    upcoming: scheduleResult.dates,
    pendingCount: pendingResult.count,
    error: deckResult.error ?? scheduleResult.error ?? pendingResult.error,
    deckError: deckResult.deckError,
    reviewError: deckResult.reviewError,
    scheduleError: scheduleResult.error,
    pendingError: pendingResult.error,
  };
}

function groupUpcoming(schedule: ScheduledReviewDate[]): UpcomingGroup[] {
  const groups = new Map<string, UpcomingGroup>();
  for (const item of schedule) {
    const date = new Date(item.next_review_at);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      groups.set(key, { date, count: 1 });
    }
  }
  return [...groups.values()].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
}

function localDayDistance(date: Date, now: Date) {
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function upcomingLabel(
  date: Date,
  locale: string,
  tr: ReturnType<typeof useT>,
) {
  const distance = localDayDistance(date, new Date());
  if (distance === 0) return tr("biblioteca.today");
  if (distance === 1) return tr("biblioteca.tomorrow");
  return new Intl.DateTimeFormat(locale === "es" ? "es-CL" : "en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

function ReviewStats({ deck }: { deck: LibraryDeck }) {
  const tr = useT();
  const review = deck.review;
  if (!review) {
    return (
      <p className="text-xs text-ink-faint">
        {tr("biblioteca.reviewStatsUnavailable")}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-soft">
      <span className="inline-flex items-center gap-1.5">
        <i aria-hidden className="size-2.5 rounded-full bg-accent" />
        {tr("biblioteca.dueCount", { count: review.due_count })}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <i aria-hidden className="size-2.5 rounded-full bg-lime" />
        {tr("biblioteca.newCount", { count: review.new_count })}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <i aria-hidden className="size-2.5 rounded-full bg-brand/40" />
        {tr("biblioteca.scheduledCount", { count: review.scheduled_count })}
      </span>
    </div>
  );
}

function DeckReviewFooter({ deck }: { deck: LibraryDeck }) {
  const tr = useT();
  const due = deck.review?.due_count ?? 0;
  const fresh = deck.review?.new_count ?? deck.card_count;
  const destination =
    deck.visibility === "public"
      ? `/mazos/${deck.slug}`
      : `/biblioteca/mazos/${deck.id}/editar`;

  let action: React.ReactNode;
  if (deck.card_count === 0) {
    action = (
      <ButtonLink
        to={`/biblioteca/mazos/${deck.id}/editar`}
        className="min-h-11"
      >
        {tr("biblioteca.addCards")}
        <ArrowRightIcon aria-hidden size={17} />
      </ButtonLink>
    );
  } else if (!deck.review) {
    action = (
      <ButtonLink to={destination} variant="secondary" className="min-h-11">
        {tr("biblioteca.viewDeck")}
      </ButtonLink>
    );
  } else if (due > 0) {
    action = (
      <ButtonLink to={`/estudiar/${deck.id}`} className="min-h-11">
        {tr("biblioteca.reviewDeck", { count: due })}
        <ArrowRightIcon aria-hidden size={17} />
      </ButtonLink>
    );
  } else if (fresh > 0) {
    action = (
      <ButtonLink to={`/estudiar/${deck.id}`} className="min-h-11">
        {tr("biblioteca.learnNew", { count: fresh })}
        <ArrowRightIcon aria-hidden size={17} />
      </ButtonLink>
    );
  } else {
    action = (
      <ButtonLink to={destination} variant="secondary" className="min-h-11">
        {tr("biblioteca.viewDeck")}
      </ButtonLink>
    );
  }

  return (
    <div className="space-y-3 border-t border-line pt-3">
      <ReviewStats deck={deck} />
      {deck.review?.last_reviewed_at ? (
        <p className="text-xs text-ink-faint">
          {tr("biblioteca.lastReview", {
            date: formatRelativeTime(deck.review.last_reviewed_at),
          })}
        </p>
      ) : deck.progress?.last_studied_at ? (
        <p className="text-xs text-ink-faint">
          {tr("biblioteca.lastPractice", {
            date: formatRelativeTime(deck.progress.last_studied_at),
          })}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {action}
        <div className="flex flex-wrap items-center gap-2">
          {deck.is_official ? (
            <Tag tone="brand">{tr("biblioteca.official")}</Tag>
          ) : (
            <Tag tone={deck.visibility === "public" ? "accent" : "neutral"}>
              {deck.visibility === "public"
                ? tr("biblioteca.published")
                : tr("biblioteca.private")}
            </Tag>
          )}
          <Link
            to={`/biblioteca/mazos/${deck.id}/editar`}
            className="inline-flex min-h-11 items-center px-2 text-sm text-brand hover:underline"
          >
            {tr("biblioteca.edit")}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Biblioteca({ loaderData }: Route.ComponentProps) {
  const tr = useT();
  const { locale } = useLocale();
  const { revalidate } = useRevalidator();
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState<VisibilityFilter>("all");

  useEffect(() => {
    let lastRefresh = 0;
    const refreshWhenVisible = () => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastRefresh > 15_000
      ) {
        lastRefresh = Date.now();
        revalidate();
      }
    };
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [revalidate]);

  const decks = loaderData.status === "ready" ? loaderData.decks : [];
  const error = loaderData.status === "ready" ? loaderData.error : null;
  const upcoming = loaderData.status === "ready" ? loaderData.upcoming : [];
  const pendingCount =
    loaderData.status === "ready" ? loaderData.pendingCount : 0;
  const deckError = loaderData.status === "ready" ? loaderData.deckError : null;
  const reviewError =
    loaderData.status === "ready" ? loaderData.reviewError : null;
  const scheduleError =
    loaderData.status === "ready" ? loaderData.scheduleError : null;
  const pendingError =
    loaderData.status === "ready" ? loaderData.pendingError : null;
  const reviewStatsAvailable =
    pendingError === null &&
    reviewError === null &&
    decks.every((deck) => deck.review !== null);
  const newCount = decks.reduce(
    (total, deck) => total + (deck.review?.new_count ?? 0),
    0,
  );
  const nextReview = upcoming[0];
  const nextNewDeck = reviewStatsAvailable
    ? decks.find((deck) => (deck.review?.new_count ?? 0) > 0)
    : undefined;
  const groups = useMemo(() => groupUpcoming(upcoming), [upcoming]);
  const filteredDecks = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase(locale);
    return decks.filter((deck) => {
      const matchesText =
        needle === "" ||
        `${deck.title} ${deck.description}`
          .toLocaleLowerCase(locale)
          .includes(needle);
      const matchesVisibility =
        visibility === "all" || deck.visibility === visibility;
      return matchesText && matchesVisibility;
    });
  }, [decks, locale, search, visibility]);

  useEffect(() => {
    const next = upcoming[0];
    if (!next) return;

    // Los temporizadores del navegador tienen un máximo práctico cercano a 24
    // días. Al vencer ese tramo, la revalidación vuelve a calcular la fecha.
    const remaining = Math.max(
      0,
      Date.parse(next.next_review_at) - Date.now() + 250,
    );
    const timeout = window.setTimeout(
      revalidate,
      Math.min(remaining, 2_147_000_000),
    );
    return () => window.clearTimeout(timeout);
  }, [upcoming, revalidate]);

  if (loaderData.status === "unconfigured") return <ConfigNotice />;

  return (
    <Page className="max-w-7xl">
      <PageHeader
        eyebrow={tr("biblioteca.eyebrow")}
        title={tr("biblioteca.title")}
        description={tr("biblioteca.description")}
        actions={
          <>
            <ButtonLink to="/biblioteca/mazos/nuevo-ia" variant="secondary">
              <SparkleIcon aria-hidden size={17} />
              {tr("biblioteca.createWithAi")}
            </ButtonLink>
            <ButtonLink to="/biblioteca/mazos/nuevo">
              {tr("biblioteca.createDeck")}
            </ButtonLink>
          </>
        }
      />

      {error ? (
        <Alert
          variant="error"
          title={tr("biblioteca.loadErrorTitle")}
          className="mb-6"
        >
          {error}
        </Alert>
      ) : null}

      <section className="mb-10 grid gap-4 lg:grid-cols-[1.55fr_0.95fr]">
        <div className="relative overflow-hidden rounded-2xl bg-brand px-6 py-7 text-on-solid shadow-[0_20px_38px_-28px_var(--color-brand)] sm:px-9 sm:py-9">
          <p className="text-xs font-semibold tracking-[0.17em] text-[#f3bba4] uppercase">
            {tr("biblioteca.todayReview")}
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl leading-tight sm:text-4xl">
            {reviewStatsAvailable
              ? pendingCount > 0
                ? tr("biblioteca.pendingHeadline", { count: pendingCount })
                : tr("biblioteca.noPendingHeadline")
              : tr("biblioteca.reviewStatsUnavailable")}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-on-solid/80 sm:text-base">
            {reviewStatsAvailable
              ? pendingCount > 0
                ? tr("biblioteca.pendingDescription")
                : nextReview
                  ? tr("biblioteca.nextReviewSummary", {
                      date: new Date(nextReview.next_review_at).toLocaleString(
                        locale === "es" ? "es-CL" : "en-US",
                        { dateStyle: "medium", timeStyle: "short" },
                      ),
                    })
                  : tr("biblioteca.noPendingDescription", { count: newCount })
              : tr("biblioteca.reviewStatsUnavailableBody")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {reviewStatsAvailable && pendingCount > 0 ? (
              <ButtonLink to="/estudiar" variant="subtle" className="min-h-12">
                {tr("biblioteca.reviewPending")}
                <ArrowRightIcon aria-hidden size={18} />
              </ButtonLink>
            ) : reviewStatsAvailable && nextNewDeck ? (
              <ButtonLink
                to={`/estudiar/${nextNewDeck.id}`}
                variant="subtle"
                className="min-h-12"
              >
                {tr("biblioteca.learnNew", {
                  count:
                    nextNewDeck.review?.new_count ?? nextNewDeck.card_count,
                })}
                <ArrowRightIcon aria-hidden size={18} />
              </ButtonLink>
            ) : null}
            <ButtonLink
              to="/ajustes/repaso"
              variant="ghost"
              className="min-h-12 text-on-solid hover:bg-white/10 hover:text-white"
            >
              {tr("biblioteca.reviewSettings")}
            </ButtonLink>
          </div>
        </div>

        <Card as="section" className="p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <CalendarDotsIcon aria-hidden size={21} className="text-brand" />
            <h2 className="font-display text-2xl text-brand">
              {tr("biblioteca.upcomingReviews")}
            </h2>
          </div>
          {scheduleError ? (
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              {tr("biblioteca.upcomingUnavailable")}
            </p>
          ) : groups.length === 0 ? (
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              {tr("biblioteca.noUpcoming")}
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {groups.slice(0, 3).map((group) => (
                <li
                  key={group.date.toISOString()}
                  className="flex min-h-14 items-center gap-3 py-2"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand">
                    {localDayDistance(group.date, new Date()) <= 1 ? (
                      <ClockIcon aria-hidden size={19} />
                    ) : (
                      <CalendarDotsIcon aria-hidden size={19} />
                    )}
                  </span>
                  <span className="font-medium text-ink">
                    {upcomingLabel(group.date, locale, tr)}
                  </span>
                  <span className="ml-auto text-sm text-ink-faint">
                    {tr("biblioteca.cardCount", { count: group.count })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-brand">
            {tr("biblioteca.myDecks")}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            {tr("biblioteca.deckCount", { count: decks.length })}
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <label className="relative min-w-56 flex-1 sm:w-64 sm:flex-none">
            <span className="sr-only">{tr("biblioteca.searchLabel")}</span>
            <MagnifyingGlassIcon
              aria-hidden
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <input
              className={`${inputClass} min-h-11 pl-10`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={tr("biblioteca.searchPlaceholder")}
            />
          </label>
          <fieldset
            className="flex flex-wrap gap-1 rounded-xl border border-line p-1"
            aria-label={tr("biblioteca.filtersLabel")}
          >
            <legend className="sr-only">{tr("biblioteca.filtersLabel")}</legend>
            {(["all", "private", "public"] as const).map((filter) => (
              <button
                type="button"
                key={filter}
                aria-pressed={visibility === filter}
                onClick={() => setVisibility(filter)}
                className={`min-h-9 rounded-lg px-3 text-sm transition-colors ${visibility === filter ? "bg-lime-muted font-medium text-brand-strong" : "text-ink-soft hover:bg-paper-sunken"}`}
              >
                {tr(`biblioteca.filter.${filter}`)}
              </button>
            ))}
          </fieldset>
        </div>
      </div>

      {decks.length === 0 && !deckError ? (
        <EmptyState
          title={tr("biblioteca.emptyTitle")}
          description={tr("biblioteca.emptyDescription")}
          action={
            <>
              <ButtonLink to="/biblioteca/mazos/nuevo">
                {tr("biblioteca.createManual")}
              </ButtonLink>
              <ButtonLink to="/explorar" variant="secondary">
                {tr("inicio.ctaExplore")}
              </ButtonLink>
            </>
          }
        />
      ) : deckError ? null : filteredDecks.length === 0 ? (
        <EmptyState
          title={tr("biblioteca.noSearchResults")}
          description={tr("biblioteca.noSearchResultsHint")}
          action={
            <ButtonLink to="/biblioteca/mazos/nuevo" variant="secondary">
              {tr("biblioteca.createDeck")}
            </ButtonLink>
          }
        />
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredDecks.map((deck) => (
            <li key={deck.id} className="flex pt-2">
              <DeckTile
                deck={deck}
                href={
                  deck.visibility === "public"
                    ? `/mazos/${deck.slug}`
                    : `/biblioteca/mazos/${deck.id}/editar`
                }
                descriptionAction={
                  <Link
                    to={`/biblioteca/mazos/${deck.id}/editar`}
                    className="text-xs font-medium text-brand underline"
                  >
                    {tr("biblioteca.completeDescription")}
                  </Link>
                }
                footer={<DeckReviewFooter deck={deck} />}
              />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10 border-t border-line pt-5">
        <Link
          to="/explorar"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-brand hover:underline"
        >
          {tr("biblioteca.exploreCommunity")}
          <ArrowRightIcon aria-hidden size={17} />
        </Link>
      </div>
    </Page>
  );
}
