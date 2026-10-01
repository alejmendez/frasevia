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
import { listPublicDecks } from "~/lib/decks.server";
import type { Route } from "./+types/explorar";

export function meta() {
  return [
    { title: "Explorar mazos — Frasevia" },
    {
      name: "description",
      content:
        "Mazos públicos de inglés con ejemplos y traducciones al español.",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const search = new URL(request.url).searchParams.get("q") ?? "";

  const result = await listPublicDecks({ search });
  return {
    ...result,
    query: search,
    configured: result.error !== "unconfigured",
  };
}

export default function Explorar({ loaderData }: Route.ComponentProps) {
  const { decks, error, query, configured } = loaderData;
  const [searchParams] = useSearchParams();

  return (
    <Page>
      <PageHeader
        eyebrow="Catálogo público"
        title="Explorar mazos"
        description="Mazos de otras personas y los mazos oficiales de Frasevia. Puedes copiar los que te gusten a tu propia biblioteca."
      />

      {/* El buscador usa GET, así que la búsqueda queda en la URL y se puede
          compartir o marcar como favorita. */}
      <Form method="get" role="search" className="mb-8 flex gap-2">
        <label htmlFor="q" className="sr-only">
          Buscar mazos
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Busca por título o descripción"
          className={inputClass}
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-strong"
        >
          Buscar
        </button>
        {searchParams.has("q") ? (
          <ButtonLink to="/explorar" variant="ghost">
            Limpiar
          </ButtonLink>
        ) : null}
      </Form>

      {!configured ? (
        <Alert variant="warning" title="Sin conexión a Supabase">
          <p>
            No se pudo leer el catálogo porque falta configurar{" "}
            <code className="font-mono">VITE_SUPABASE_URL</code> y{" "}
            <code className="font-mono">VITE_SUPABASE_PUBLISHABLE_KEY</code> en
            tu <code className="font-mono">.env</code>.
          </p>
        </Alert>
      ) : error ? (
        <Alert variant="error" title="No se pudo cargar el catálogo">
          {error}
        </Alert>
      ) : decks.length === 0 ? (
        <EmptyState
          title={query ? "Sin resultados" : "Todavía no hay mazos públicos"}
          description={
            query
              ? `Ningún mazo coincide con “${query}”. Prueba con otra palabra.`
              : "Sé la primera persona en compartir un mazo: crea el tuyo y publícalo."
          }
          action={
            query ? (
              <ButtonLink to="/explorar" variant="secondary">
                Ver todos
              </ButtonLink>
            ) : (
              <ButtonLink to="/crear-cuenta">Crear mi primer mazo</ButtonLink>
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
