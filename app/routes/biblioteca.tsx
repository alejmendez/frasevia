import { Link, redirect } from "react-router";
import {
  Alert,
  ButtonLink,
  ConfigNotice,
  EmptyState,
  LoadingState,
  Page,
  PageHeader,
  ProgressBar,
  Tag,
} from "~/components/ui";
import { DeckTile } from "~/features/decks/deck-tile";
import type { LibraryDeck } from "~/lib/decks";
import { listMyDecks } from "~/lib/decks";
import { formatRelativeTime, PROGRESS_LABEL } from "~/lib/format";
import { getSession, loginPath } from "~/lib/session";
import type { Route } from "./+types/biblioteca";

export function meta() {
  return [{ title: "Mi biblioteca — Frasevia" }];
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

export function HydrateFallback() {
  return <LoadingState label="Abriendo tu biblioteca…" />;
}

/** Barra de avance con lo aprendido sobre el total de tarjetas del mazo. */
function DeckProgress({ deck }: { deck: LibraryDeck }) {
  const learned = deck.progress?.mastered_count ?? 0;
  const practicing = deck.progress?.learning_count ?? 0;
  const studied = learned + practicing;

  if (studied === 0) {
    return (
      <p className="text-xs text-ink-faint">
        {deck.card_count === 0
          ? "Sin tarjetas todavía"
          : "Sin practicar todavía"}
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      <ProgressBar
        value={learned}
        total={deck.card_count}
        label={`${learned} de ${deck.card_count} tarjetas aprendidas en ${deck.title}`}
      />
      <p className="text-xs text-ink-faint">
        {learned} aprendida{learned === 1 ? "" : "s"} · {practicing}{" "}
        {PROGRESS_LABEL.learning.toLowerCase()}
        {deck.progress?.last_studied_at
          ? ` · ${formatRelativeTime(deck.progress.last_studied_at)}`
          : ""}
      </p>
    </div>
  );
}

export default function Biblioteca({ loaderData }: Route.ComponentProps) {
  if (loaderData.status === "unconfigured") {
    return <ConfigNotice />;
  }

  const { decks, error } = loaderData;

  return (
    <Page>
      <PageHeader
        eyebrow="Tu espacio"
        title="Mi biblioteca"
        description="Los mazos que creaste y las copias que hiciste de mazos públicos."
        actions={
          <ButtonLink to="/biblioteca/mazos/nuevo">Crear un mazo</ButtonLink>
        }
      />

      {error ? (
        <div className="mb-6">
          <Alert variant="error" title="No se pudo cargar tu biblioteca">
            {error}
          </Alert>
        </div>
      ) : null}

      {decks.length === 0 && !error ? (
        <EmptyState
          title="Tu biblioteca está vacía"
          description="Crea un mazo con tus propias palabras y frases, o copia uno de los mazos públicos para modificarlo a tu gusto."
          action={
            <>
              <ButtonLink to="/biblioteca/mazos/nuevo">
                Crear un mazo
              </ButtonLink>
              <ButtonLink to="/explorar" variant="secondary">
                Explorar mazos
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
                        <Tag tone="brand">Oficial</Tag>
                      ) : (
                        <Tag
                          tone={
                            deck.visibility === "public" ? "accent" : "neutral"
                          }
                        >
                          {deck.visibility === "public"
                            ? "Publicado"
                            : "Privado"}
                        </Tag>
                      )}
                      {deck.source_deck_id ? <Tag>Copiado</Tag> : null}
                      <Link
                        to={`/biblioteca/mazos/${deck.id}/editar`}
                        className="text-xs text-brand hover:underline"
                      >
                        Editar
                      </Link>
                      <Link
                        to={`/estudiar/${deck.id}`}
                        className="text-xs text-brand hover:underline"
                      >
                        Estudiar
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
