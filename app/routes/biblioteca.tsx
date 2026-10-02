import { Link, redirect } from "react-router";
import {
  Alert,
  ButtonLink,
  ConfigNotice,
  EmptyState,
  Page,
  PageHeader,
  ProgressBar,
  Tag,
} from "~/components/ui";
import { DeckTile } from "~/features/decks/deck-tile";
import type { LibraryDeck } from "~/lib/decks";
import { listMyDecks } from "~/lib/decks";
import { formatRelativeTime } from "~/lib/format";
import { t } from "~/lib/locale";
import { useT } from "~/lib/locale-context";
import { getSession, loginPath } from "~/lib/session";
import type { Route } from "./+types/biblioteca";

export function meta() {
  return [{ title: t("biblioteca.metaTitle") }];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const session = await getSession();

  if (session.status === "unconfigured") {
    return { status: "unconfigured" as const, decks: [], error: null };
  }

  if (session.status === "anonymous") {
    throw redirect(loginPath(request));
  }

  const { decks, error } = await listMyDecks(session.supabase, session.userId);
  return { status: "ready" as const, decks, error };
}

/** Barra de avance con lo aprendido sobre el total de tarjetas del mazo. */
function DeckProgress({ deck }: { deck: LibraryDeck }) {
  const tr = useT();
  const learned = deck.progress?.mastered_count ?? 0;
  const practicing = deck.progress?.learning_count ?? 0;
  const studied = learned + practicing;

  if (studied === 0) {
    return (
      <p className="text-xs text-ink-faint">
        {deck.card_count === 0
          ? tr("biblioteca.noCards")
          : tr("biblioteca.notPracticed")}
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      <ProgressBar
        value={learned}
        total={deck.card_count}
        label={tr("biblioteca.progressAria", {
          learned,
          total: deck.card_count,
          deck: deck.title,
        })}
      />
      <p className="text-xs text-ink-faint">
        {tr("biblioteca.progressLine", { learned, learning: practicing })}
        {deck.progress?.last_studied_at
          ? ` · ${formatRelativeTime(deck.progress.last_studied_at)}`
          : ""}
      </p>
    </div>
  );
}

export default function Biblioteca({ loaderData }: Route.ComponentProps) {
  const tr = useT();

  if (loaderData.status === "unconfigured") {
    return <ConfigNotice />;
  }

  const { decks, error } = loaderData;

  return (
    <Page>
      <PageHeader
        eyebrow={tr("biblioteca.eyebrow")}
        title={tr("biblioteca.title")}
        description={tr("biblioteca.description")}
        actions={
          <>
            <ButtonLink to="/biblioteca/mazos/nuevo-ia" variant="secondary">
              {tr("biblioteca.createWithAi")}
            </ButtonLink>
            <ButtonLink to="/biblioteca/mazos/nuevo">
              {tr("biblioteca.createDeck")}
            </ButtonLink>
          </>
        }
      />

      {error ? (
        <div className="mb-6">
          <Alert variant="error" title={tr("biblioteca.loadErrorTitle")}>
            {error}
          </Alert>
        </div>
      ) : null}

      {decks.length === 0 && !error ? (
        <EmptyState
          title={tr("biblioteca.emptyTitle")}
          description={tr("biblioteca.emptyDescription")}
          action={
            <>
              <ButtonLink to="/biblioteca/mazos/nuevo-ia">
                {tr("biblioteca.createWithAiLong")}
              </ButtonLink>
              <ButtonLink to="/biblioteca/mazos/nuevo" variant="secondary">
                {tr("biblioteca.createManual")}
              </ButtonLink>
              <ButtonLink to="/explorar" variant="ghost">
                {tr("inicio.ctaExplore")}
              </ButtonLink>
            </>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <li key={deck.id} className="flex">
              <DeckTile
                deck={deck}
                // Un mazo privado no tiene página pública visible: el título
                // lleva al editor, que es adonde quiere ir quien está en su
                // propia biblioteca.
                href={
                  deck.visibility === "public"
                    ? `/mazos/${deck.slug}`
                    : `/biblioteca/mazos/${deck.id}/editar`
                }
                footer={
                  <div className="space-y-3 border-t border-line pt-3">
                    <DeckProgress deck={deck} />
                    <div className="flex flex-wrap items-center gap-2">
                      {deck.is_official ? (
                        <Tag tone="brand">{tr("biblioteca.official")}</Tag>
                      ) : (
                        <Tag
                          tone={
                            deck.visibility === "public" ? "accent" : "neutral"
                          }
                        >
                          {deck.visibility === "public"
                            ? tr("biblioteca.published")
                            : tr("biblioteca.private")}
                        </Tag>
                      )}
                      {deck.source_deck_id ? (
                        <Tag>{tr("biblioteca.copied")}</Tag>
                      ) : null}
                      <Link
                        to={`/biblioteca/mazos/${deck.id}/editar`}
                        className="text-xs text-brand hover:underline"
                      >
                        {tr("biblioteca.edit")}
                      </Link>
                      <Link
                        to={`/estudiar/${deck.id}`}
                        className="text-xs text-brand hover:underline"
                      >
                        {tr("biblioteca.study")}
                      </Link>
                    </div>
                  </div>
                }
              />
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
