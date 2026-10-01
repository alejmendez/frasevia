import { Link, redirect } from "react-router";
import {
  Alert,
  ButtonLink,
  Card,
  ConfigNotice,
  EmptyState,
  LoadingState,
  Page,
  PageHeader,
  ProgressBar,
  Tag,
} from "~/components/ui";
import { listMyProgress } from "~/lib/decks";
import { formatRelativeTime, PROGRESS_LABEL } from "~/lib/format";
import { getSession, loginPath } from "~/lib/session";
import type { ProgressDetail, ProgressState } from "~/lib/types";
import type { Route } from "./+types/progreso";

export function meta() {
  return [{ title: "Mi progreso — Frasevia" }];
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

export function HydrateFallback() {
  return <LoadingState label="Leyendo tu progreso…" />;
}

const STATE_TONE: Record<ProgressState, "neutral" | "brand" | "accent"> = {
  new: "neutral",
  learning: "accent",
  mastered: "brand",
};

export default function Progreso({ loaderData }: Route.ComponentProps) {
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
        eyebrow="Tu avance"
        title="Mi progreso"
        description="Lo que has practicado hasta ahora. No hay rachas ni plazos: la idea es ver qué ya se te queda y qué conviene repasar."
        actions={<ButtonLink to="/biblioteca">Ir a la biblioteca</ButtonLink>}
      />

      {error ? (
        <div className="mb-6">
          <Alert variant="error" title="No se pudo cargar tu progreso">
            {error}
          </Alert>
        </div>
      ) : null}

      {totals.total === 0 && !error ? (
        <EmptyState
          title="Todavía no hay progreso registrado"
          description="Cuando practiques un mazo, aquí verás cuántas tarjetas tienes aprendidas, cuáles sigues practicando y cuándo fue la última sesión."
          action={<ButtonLink to="/biblioteca">Elegir un mazo</ButtonLink>}
        />
      ) : (
        <div className="space-y-8">
          <Card>
            <dl className="grid gap-5 sm:grid-cols-4">
              <div>
                <dt className="text-xs tracking-wide text-ink-faint uppercase">
                  Practicadas
                </dt>
                <dd className="font-display text-3xl text-ink">
                  {totals.total}
                </dd>
              </div>
              <div>
                <dt className="text-xs tracking-wide text-ink-faint uppercase">
                  Aprendidas
                </dt>
                <dd className="font-display text-3xl text-brand">
                  {totals.mastered}
                </dd>
              </div>
              <div>
                <dt className="text-xs tracking-wide text-ink-faint uppercase">
                  Practicando
                </dt>
                <dd className="font-display text-3xl text-accent">
                  {totals.learning}
                </dd>
              </div>
              <div>
                <dt className="text-xs tracking-wide text-ink-faint uppercase">
                  Última sesión
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
                label={`${totals.mastered} tarjetas aprendidas de ${totals.total}`}
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
                    Seguir practicando
                  </Link>
                </div>

                <div className="mb-4">
                  <ProgressBar
                    value={learned}
                    total={deckRows.length}
                    label={`${learned} de ${deckRows.length} tarjetas aprendidas en ${deckRows[0].deck_title}`}
                  />
                  <p className="mt-1.5 text-xs text-ink-faint">
                    {learned} aprendida{learned === 1 ? "" : "s"} de{" "}
                    {deckRows.length} practicada
                    {deckRows.length === 1 ? "" : "s"}
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
                            {row.correct_count}/{row.attempts} aciertos
                          </span>
                          <span>{formatRelativeTime(row.last_studied_at)}</span>
                          <Tag tone={STATE_TONE[row.state]}>
                            {PROGRESS_LABEL[row.state]}
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
