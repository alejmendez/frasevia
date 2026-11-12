import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { data, redirect } from "react-router";

import { ConfirmSubmit } from "~/components/confirm";
import {
  Alert,
  ButtonLink,
  buttonClass,
  Card,
  ConfigNotice,
  EmptyState,
  Page,
  PageHeader,
} from "~/components/ui";
import { deleteDeck, listMyTrashedDecks, restoreDeck } from "~/lib/decks";
import { cardCountLabel, formatDate } from "~/lib/format";
import { t } from "~/lib/locale";
import { useT } from "~/lib/locale-context";
import { ROUTE_PATTERNS } from "~/lib/routes-paths";
import { getSession, loginPath } from "~/lib/session";
import type { Route } from "./+types/biblioteca-papelera";

export function meta() {
  return [{ title: t("papelera.metaTitle") }];
}

/**
 * La papelera: los mazos que se mandaron a la papelera y se pueden devolver.
 *
 * Los mazos borrados siguen en la base con sus tarjetas y su progreso, así que
 * aquí se pueden devolver. También se pueden eliminar de verdad, y esa es la
 * única operación sin vuelta atrás de toda la aplicación: por eso tiene su
 * propia confirmación y su propio botón, y no es el mismo que el de la
 * biblioteca.
 */
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const session = await getSession();

  if (session.status === "unconfigured") {
    return { status: "unconfigured" as const, decks: [], error: null };
  }

  if (session.status === "anonymous") {
    throw redirect(loginPath(request));
  }

  const { decks, error } = await listMyTrashedDecks(
    session.supabase,
    session.userId,
  );

  return { status: "ready" as const, decks, error };
}

/**
 * Las acciones de la papelera.
 *
 * Devolver un mazo y borrarlo para siempre son dos decisiones distintas: la
 * primera lo deja como estaba, la segunda se lleva sus tarjetas y su progreso.
 * Las dos las resuelve la base, que es la que sabe de quién es cada mazo.
 */
export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  const session = await getSession();
  if (session.status === "unconfigured") {
    return data(
      { ok: false, message: t("common.noSupabaseEnv") },
      { status: 503 },
    );
  }
  if (session.status === "anonymous") {
    throw redirect(loginPath(request));
  }

  const deckId = String(formData.get("deckId") ?? "");

  switch (intent) {
    case "restore-deck": {
      const { error } = await restoreDeck(session.supabase, deckId);

      return error
        ? data({ ok: false, message: error }, { status: 400 })
        : data({ ok: true, message: t("papelera.deckRestored") });
    }
    case "delete-deck": {
      const { error } = await deleteDeck(session.supabase, deckId);

      return error
        ? data({ ok: false, message: error }, { status: 400 })
        : data({ ok: true, message: t("papelera.deckDeleted") });
    }
    default:
      return data({ ok: false, message: t("action.unknown") }, { status: 400 });
  }
}

export default function BibliotecaPapelera({
  loaderData,
}: Route.ComponentProps) {
  const tr = useT();

  if (loaderData.status === "unconfigured") {
    return <ConfigNotice />;
  }

  const { decks, error } = loaderData;

  return (
    <Page>
      <PageHeader
        eyebrow={tr("papelera.eyebrow")}
        title={tr("papelera.title")}
        description={tr("papelera.description")}
        actions={
          <ButtonLink to={ROUTE_PATTERNS.biblioteca} variant="ghost">
            <ArrowLeftIcon aria-hidden size={17} />
            {tr("papelera.back")}
          </ButtonLink>
        }
      />

      {error ? (
        <Alert
          variant="error"
          title={tr("papelera.loadErrorTitle")}
          className="mb-6"
        >
          {error}
        </Alert>
      ) : null}

      {decks.length === 0 && !error ? (
        <EmptyState
          title={tr("papelera.emptyTitle")}
          description={tr("papelera.emptyDescription")}
          action={
            <ButtonLink to={ROUTE_PATTERNS.biblioteca}>
              {tr("papelera.back")}
            </ButtonLink>
          }
        />
      ) : (
        <ul className="space-y-3">
          {decks.map((deck) => (
            <li key={deck.id}>
              <Card
                as="article"
                className="flex flex-wrap items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <h2 className="font-display text-lg text-ink">
                    {deck.title}
                  </h2>
                  <p className="mt-1 text-sm text-ink-soft">
                    {cardCountLabel(deck.card_count)} ·{" "}
                    {tr("papelera.deletedOn", {
                      date: formatDate(deck.deleted_at),
                    })}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <ConfirmSubmit
                    intent="restore-deck"
                    fields={{ deckId: deck.id }}
                    title={tr("papelera.restoreTitle", { title: deck.title })}
                    description={tr("papelera.restoreBody")}
                    confirmLabel={tr("papelera.restoreConfirm")}
                    triggerClassName={`${buttonClass("secondary")} min-h-11`}
                  >
                    {tr("papelera.restore")}
                  </ConfirmSubmit>

                  <ConfirmSubmit
                    intent="delete-deck"
                    fields={{ deckId: deck.id }}
                    title={tr("papelera.deleteForeverTitle", {
                      title: deck.title,
                    })}
                    description={tr("papelera.deleteForeverBody")}
                    confirmLabel={tr("papelera.deleteForeverConfirm")}
                    triggerClassName={`${buttonClass("danger")} min-h-11`}
                  >
                    {tr("papelera.deleteForever")}
                  </ConfirmSubmit>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
