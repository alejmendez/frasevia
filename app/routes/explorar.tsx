import { Form, useSearchParams } from "react-router";
import {
  Alert,
  ButtonLink,
  EmptyState,
  inputClass,
  Page,
  PageHeader,
} from "~/components/ui";
import { DeckTile } from "~/features/decks/deck-tile";
import { listPublicDecks } from "~/lib/decks";
import { t } from "~/lib/locale";
import { useT } from "~/lib/locale-context";
import type { Route } from "./+types/explorar";

export function meta() {
  return [
    { title: t("explorar.metaTitle") },
    {
      name: "description",
      content: t("explorar.metaDescription"),
    },
  ];
}

/**
 * El catálogo se lee desde el navegador.
 *
 * La lectura es pública (RLS, clave publicable) y no hay render en servidor, así
 * que no hay motivo para pedirlo por otra vía.
 */
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const search = new URL(request.url).searchParams.get("q") ?? "";

  const result = await listPublicDecks({ search });
  return {
    ...result,
    query: search,
    configured: result.error !== "unconfigured",
  };
}

export default function Explorar({ loaderData }: Route.ComponentProps) {
  const tr = useT();
  const { decks, error, query, configured } = loaderData;
  const [searchParams] = useSearchParams();

  return (
    <Page>
      <PageHeader
        eyebrow={tr("explorar.eyebrow")}
        title={tr("explorar.title")}
        description={tr("explorar.description")}
      />

      {/* El buscador usa GET, así que la búsqueda queda en la URL y se puede
          compartir o marcar como favorita. */}
      <Form method="get" role="search" className="mb-8 flex gap-2">
        <label htmlFor="q" className="sr-only">
          {tr("explorar.searchLabel")}
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={query}
          placeholder={tr("explorar.searchPlaceholder")}
          className={inputClass}
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-brand-solid px-4 py-2.5 text-sm font-medium text-on-solid hover:bg-brand-solid-hover"
        >
          {tr("explorar.searchButton")}
        </button>
        {searchParams.has("q") ? (
          <ButtonLink to="/explorar" variant="ghost">
            {tr("explorar.clear")}
          </ButtonLink>
        ) : null}
      </Form>

      {!configured ? (
        <Alert variant="warning" title={tr("explorar.noSupabaseTitle")}>
          <p>{tr("explorar.noSupabaseBody")}</p>
        </Alert>
      ) : error ? (
        <Alert variant="error" title={tr("explorar.loadErrorTitle")}>
          {error}
        </Alert>
      ) : decks.length === 0 ? (
        <EmptyState
          title={
            query
              ? tr("explorar.emptyResultsTitle")
              : tr("explorar.emptyNoDecksTitle")
          }
          description={
            query
              ? tr("explorar.emptyResultsBody", { query })
              : tr("explorar.emptyNoDecksBody")
          }
          action={
            query ? (
              <ButtonLink to="/explorar" variant="secondary">
                {tr("explorar.seeAll")}
              </ButtonLink>
            ) : (
              <ButtonLink to="/crear-cuenta">
                {tr("explorar.createFirst")}
              </ButtonLink>
            )
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <li key={deck.id} className="flex">
              <DeckTile
                deck={deck}
                authorName={deck.author_name}
                className="flex-1"
              />
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
