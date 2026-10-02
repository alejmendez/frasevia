import { Link, redirect } from "react-router";
import {
  Alert,
  ButtonLink,
  Card,
  ConfigNotice,
  EmptyState,
  Page,
  PageHeader,
  ProgressBar,
  Tag,
} from "~/components/ui";
import { listMyProgress } from "~/lib/decks";
import { formatRelativeTime, progressLabel } from "~/lib/format";
import { t } from "~/lib/locale";
import { useT } from "~/lib/locale-context";
import { getSession, loginPath } from "~/lib/session";
import type { ProgressDetail, ProgressState } from "~/lib/types";
import type { Route } from "./+types/progreso";

export function meta() {
  return [{ title: t("progreso.metaTitle") }];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const session = await getSession();

  if (session.status === "unconfigured") {
    return { status: "unconfigured" as const, rows: [], error: null };
  }

  if (session.status === "anonymous") {
    throw redirect(loginPath(request));
  }

  const { rows, error } = await listMyProgress(session.supabase);
  return { status: "ready" as const, rows, error };
}

const STATE_TONE: Record<ProgressState, "neutral" | "brand" | "accent"> = {
  new: "neutral",
  learning: "accent",
  mastered: "brand",
};

export default function Progreso({ loaderData }: Route.ComponentProps) {
  const tr = useT();

  if (loaderData.status === "unconfigured") {
    return <ConfigNotice />;
  }

  const { rows, error } = loaderData;

  const totals = rows.reduce(
    (acc, row) => {
      acc.total += 1;
      acc[row.state] += 1;
      return acc;
    },
    { total: 0, new: 0, learning: 0, mastered: 0 },
  );

  const byDeck = new Map<string, ProgressDetail[]>();
  for (const row of rows) {
    const list = byDeck.get(row.deck_id) ?? [];
    list.push(row);
    byDeck.set(row.deck_id, list);
  }

  const lastStudied = rows
    .map((row) => row.last_studied_at)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);

  return (
    <Page>
      <PageHeader
        eyebrow={tr("progreso.eyebrow")}
        title={tr("progreso.title")}
        description={tr("progreso.description")}
        actions={
          <ButtonLink to="/biblioteca">{tr("progreso.goLibrary")}</ButtonLink>
        }
      />

      {error ? (
        <div className="mb-6">
          <Alert variant="error" title={tr("progreso.loadErrorTitle")}>
            {error}
          </Alert>
        </div>
      ) : null}

      {totals.total === 0 && !error ? (
        <EmptyState
          title={tr("progreso.emptyTitle")}
          description={tr("progreso.emptyDescription")}
          action={
            <ButtonLink to="/biblioteca">
              {tr("progreso.chooseDeck")}
            </ButtonLink>
          }
        />
      ) : (
        <div className="space-y-8">
          <Card>
            <dl className="grid gap-5 sm:grid-cols-4">
              <div>
                <dt className="text-xs tracking-wide text-ink-faint uppercase">
                  {tr("progreso.statPracticed")}
                </dt>
                <dd className="font-display text-3xl text-ink">
                  {totals.total}
                </dd>
              </div>
              <div>
                <dt className="text-xs tracking-wide text-ink-faint uppercase">
                  {tr("progreso.statLearned")}
                </dt>
                <dd className="font-display text-3xl text-brand">
                  {totals.mastered}
                </dd>
              </div>
              <div>
                <dt className="text-xs tracking-wide text-ink-faint uppercase">
                  {tr("progreso.statLearning")}
                </dt>
                <dd className="font-display text-3xl text-accent">
                  {totals.learning}
                </dd>
              </div>
              <div>
                <dt className="text-xs tracking-wide text-ink-faint uppercase">
                  {tr("progreso.statLastSession")}
                </dt>
                <dd className="font-display text-lg text-ink">
                  {formatRelativeTime(lastStudied ?? null)}
                </dd>
              </div>
            </dl>

            <div className="mt-6">
              <ProgressBar
                value={totals.mastered}
                total={totals.total}
                label={tr("progreso.totalAria", {
                  learned: totals.mastered,
                  total: totals.total,
                })}
              />
            </div>
          </Card>

          {[...byDeck.entries()].map(([deckId, deckRows]) => {
            const learned = deckRows.filter(
              (row) => row.state === "mastered",
            ).length;

            return (
              <section key={deckId}>
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-xl text-ink">
                    {deckRows[0].deck_title}
                  </h2>
                  <Link
                    to={`/estudiar/${deckId}`}
                    className="text-sm text-brand hover:underline"
                  >
                    {tr("progreso.keepPracticing")}
                  </Link>
                </div>

                <div className="mb-4">
                  <ProgressBar
                    value={learned}
                    total={deckRows.length}
                    label={tr("biblioteca.progressAria", {
                      learned,
                      total: deckRows.length,
                      deck: deckRows[0].deck_title,
                    })}
                  />
                  <p className="mt-1.5 text-xs text-ink-faint">
                    {tr("progreso.deckLine", {
                      learned,
                      total: deckRows.length,
                    })}
                  </p>
                </div>

                <ul className="space-y-2">
                  {deckRows.map((row) => (
                    <li key={row.card_id}>
                      <Card className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="text-brand">{row.term}</p>
                          <p className="text-sm text-ink-soft">
                            {row.meaning_es}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-ink-faint">
                          <span>
                            {tr("progreso.score", {
                              correct: row.correct_count,
                              attempts: row.attempts,
                            })}
                          </span>
                          <span>{formatRelativeTime(row.last_studied_at)}</span>
                          <Tag tone={STATE_TONE[row.state]}>
                            {progressLabel(row.state)}
                          </Tag>
                        </div>
                      </Card>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </Page>
  );
}
