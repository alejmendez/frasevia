import {
  data,
  Form,
  Link,
  redirect,
  useLocation,
  useNavigation,
} from "react-router";
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  ConfigNotice,
  Page,
  Tag,
} from "~/components/ui";
import { useAuth } from "~/lib/auth-context";
import { getPublicDeckBySlug } from "~/lib/decks.server";
import { CARD_KIND_LABEL, cardCountLabel } from "~/lib/format";
import { getSupabaseBrowser } from "~/lib/supabase";
import type { Card as DeckCard } from "~/lib/types";
import type { Route } from "./+types/mazo-publico";

export function meta({ loaderData }: Route.MetaArgs) {
  const deck = loaderData?.deck;
  return [
    { title: deck ? `${deck.title} — Frasevia` : "Mazo — Frasevia" },
    {
      name: "description",
      content: deck?.description || "Vista previa de un mazo de Frasevia.",
    },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  return getPublicDeckBySlug(params.slug);
}

/**
 * Copia el mazo a la biblioteca de la persona.
 *
 * Va como `clientAction` porque necesita la sesión, que solo existe en el
 * navegador. La copia la hace la función SQL `copy_deck`, que valida `auth.uid()`
 * y crea filas nuevas: editar la copia nunca toca el mazo original.
 */
export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const sourceDeckId = formData.get("sourceDeckId");

  if (intent !== "copy" || typeof sourceDeckId !== "string") {
    return data({ error: "Solicitud no reconocida." }, { status: 400 });
  }

  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return data(
      { error: "Falta configurar Supabase en tus variables de entorno." },
      { status: 503 },
    );
  }

  const { data: authData } = await supabase.auth.getSession();
  if (!authData.session) {
    return redirect("/iniciar-sesion");
  }

  const { data: copy, error } = await supabase.rpc("copy_deck", {
    p_source_deck_id: sourceDeckId,
  });

  if (error) {
    return data({ error: translateCopyError(error.message) }, { status: 400 });
  }

  const newDeck = Array.isArray(copy) ? copy[0] : copy;
  return redirect(`/biblioteca/mazos/${newDeck?.id}/editar`);
}

function translateCopyError(message: string): string {
  if (message.includes("ya está en tu biblioteca")) {
    return "Este mazo ya es tuyo. Ábrelo desde tu biblioteca.";
  }
  if (message.includes("Solo puedes copiar mazos públicos")) {
    return "Ese mazo no es público, así que no se puede copiar.";
  }
  if (message.includes("no existe")) {
    return "El mazo ya no está disponible.";
  }
  return "No se pudo copiar el mazo. Inténtalo de nuevo.";
}

const PREVIEW_LIMIT = 12;

export default function MazoPublico({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { deck, cards, error, status } = loaderData;
  const { status: authStatus } = useAuth();
  const navigation = useNavigation();
  const location = useLocation();
  const isCopying = navigation.state === "submitting";

  if (status === "unconfigured") {
    return <ConfigNotice />;
  }

  if (status === "error") {
    return (
      <Page>
        <Alert variant="error" title="No se pudo cargar el mazo">
          {error}
        </Alert>
      </Page>
    );
  }

  if (status === "not-found" || !deck) {
    return (
      <Page>
        <Alert variant="error" title="Mazo no encontrado">
          <p>
            Puede que el mazo sea privado o que la dirección esté mal escrita.
          </p>
          <p className="mt-2">
            <Link className="underline" to="/explorar">
              Volver al catálogo
            </Link>
          </p>
        </Alert>
      </Page>
    );
  }

  const preview = cards.slice(0, PREVIEW_LIMIT);
  const hidden = Math.max(0, deck.card_count - preview.length);

  return (
    <Page>
      <p className="mb-4 text-sm">
        <Link to="/explorar" className="text-ink-soft hover:text-ink">
          ← Explorar
        </Link>
      </p>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {deck.is_official ? <Tag tone="brand">Oficial</Tag> : null}
            {deck.level ? <Tag tone="accent">{deck.level}</Tag> : null}
            <Tag>
              {deck.source_language} → {deck.target_language}
            </Tag>
          </div>
          <h1 className="font-display text-3xl leading-tight text-ink sm:text-4xl">
            {deck.title}
          </h1>
          {deck.description ? (
            <p className="mt-3 max-w-2xl text-ink-soft">{deck.description}</p>
          ) : null}
          <p className="mt-3 text-sm text-ink-faint">
            {cardCountLabel(deck.card_count)}
            {deck.author_name ? ` · Por ${deck.author_name}` : ""}
          </p>
        </div>
      </header>

      {/* Acción principal: copiar o estudiar si ya es tuyo ------------------ */}
      <div className="mt-8 border-y border-line py-6">
        {actionData?.error ? (
          <Alert variant="error" className="mb-4">
            {actionData.error}
          </Alert>
        ) : null}

        {authStatus === "unconfigured" ? (
          <Alert variant="warning" title="Sin conexión a Supabase">
            Necesitas configurar Supabase para copiar o estudiar este mazo.
          </Alert>
        ) : authStatus === "loading" ? (
          <p className="text-sm text-ink-faint" role="status">
            Comprobando tu sesión…
          </p>
        ) : authStatus === "anonymous" ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-ink-soft">
              Crea una cuenta para copiar este mazo a tu biblioteca y registrar
              tu progreso.
            </p>
            <ButtonLink
              to={`/crear-cuenta?redirectTo=${encodeURIComponent(`${location.pathname}${location.search}`)}`}
            >
              Crear una cuenta
            </ButtonLink>
            <ButtonLink to="/iniciar-sesion" variant="ghost">
              Ya tengo cuenta
            </ButtonLink>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Form method="post">
              <input type="hidden" name="intent" value="copy" />
              <input type="hidden" name="sourceDeckId" value={deck.id} />
              <Button type="submit" disabled={isCopying}>
                {isCopying ? "Copiando…" : "Copiar a mi biblioteca"}
              </Button>
            </Form>
            <ButtonLink to={`/estudiar/${deck.id}`} variant="secondary">
              Estudiar ahora
            </ButtonLink>
            <p className="text-xs text-ink-faint">
              La copia es independiente: puedes editarla sin cambiar este mazo.
            </p>
          </div>
        )}
      </div>

      {/* Vista previa del contenido ---------------------------------------- */}
      <section className="mt-10">
        <h2 className="font-display text-xl text-ink">Vista previa</h2>

        {preview.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">
            Este mazo todavía no tiene tarjetas.
          </p>
        ) : (
          <ul className="mt-5 grid gap-4 md:grid-cols-2">
            {preview.map((card: DeckCard) => (
              <li key={card.id}>
                <Card className="h-full">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-ink-faint">
                      {CARD_KIND_LABEL[card.kind]}
                    </span>
                  </div>
                  <p className="font-display text-lg text-brand">{card.term}</p>
                  <p className="mt-1.5 text-ink">{card.meaning_es}</p>
                  {card.example_en ? (
                    <div className="mt-3 border-t border-line pt-3 text-sm">
                      <p className="text-ink">{card.example_en}</p>
                      {card.example_es ? (
                        <p className="mt-1 text-ink-faint">{card.example_es}</p>
                      ) : null}
                    </div>
                  ) : null}
                  {card.usage_note ? (
                    <p className="mt-3 text-xs text-ink-faint">
                      <span className="font-medium text-ink-soft">Nota: </span>
                      {card.usage_note}
                    </p>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        )}

        {hidden > 0 ? (
          <p className="mt-5 text-sm text-ink-soft">
            Y {hidden} {hidden === 1 ? "tarjeta más" : "tarjetas más"}. Crea una
            cuenta o inicia sesión para verlas todas y estudiarlas.
          </p>
        ) : null}
      </section>
    </Page>
  );
}
