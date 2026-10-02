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
import { getPublicDeckBySlug } from "~/lib/decks";
import { cardCountLabel, cardKindLabel } from "~/lib/format";
import { t } from "~/lib/locale";
import { useT } from "~/lib/locale-context";
import { getSupabaseBrowser } from "~/lib/supabase";
import type { Card as DeckCard } from "~/lib/types";
import type { Route } from "./+types/mazo-publico";

export function meta({ loaderData }: Route.MetaArgs) {
  const deck = loaderData?.deck;
  return [
    { title: deck ? `${deck.title} — Frasevia` : t("mazoPublico.metaTitle") },
    {
      name: "description",
      content: deck?.description || t("mazoPublico.metaDescription"),
    },
  ];
}

/**
 * El mazo se lee desde el navegador.
 *
 * La lectura es pública (RLS, clave publicable) y no hay render en servidor, así
 * que no hay motivo para pedirlo por otra vía.
 */
export async function clientLoader({ params }: Route.ClientLoaderArgs) {
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
    return data({ error: t("mazoPublico.badRequest") }, { status: 400 });
  }

  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return data({ error: t("common.noSupabaseEnv") }, { status: 503 });
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

/**
 * Los errores de `copy_deck` llegan como texto de la función SQL, en el idioma
 * en que se escribió esa función. Se comparan ahí para poder elegir el mensaje
 * en el idioma de quien está leyendo, y lo que no se reconoce se devuelve tal
 * cual: es texto de la base de datos y traducirlo sería inventarse lo que dice.
 */
function translateCopyError(message: string): string {
  if (message.includes("ya está en tu biblioteca")) {
    return t("mazoPublico.copyAlreadyYours");
  }
  if (message.includes("Solo puedes copiar mazos públicos")) {
    return t("mazoPublico.copyNotPublic");
  }
  if (message.includes("no existe")) {
    return t("mazoPublico.copyGone");
  }
  return t("mazoPublico.copyFailed");
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
  const tr = useT();
  const isCopying = navigation.state === "submitting";

  if (status === "unconfigured") {
    return <ConfigNotice />;
  }

  if (status === "error") {
    return (
      <Page>
        <Alert variant="error" title={tr("mazoPublico.loadErrorTitle")}>
          {error}
        </Alert>
      </Page>
    );
  }

  if (status === "not-found" || !deck) {
    return (
      <Page>
        <Alert variant="error" title={tr("mazoPublico.notFoundTitle")}>
          <p>{tr("mazoPublico.notFoundBody")}</p>
          <p className="mt-2">
            <Link className="underline" to="/explorar">
              {tr("mazoPublico.backToCatalog")}
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
          {tr("mazoPublico.backToExplore")}
        </Link>
      </p>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {deck.is_official ? (
              <Tag tone="brand">{tr("biblioteca.official")}</Tag>
            ) : null}
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
            {deck.author_name
              ? ` · ${tr("deck.by", { author: deck.author_name })}`
              : ""}
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
          <Alert variant="warning" title={tr("explorar.noSupabaseTitle")}>
            {tr("mazoPublico.needsSupabase")}
          </Alert>
        ) : authStatus === "loading" ? (
          <p className="text-sm text-ink-faint" role="status">
            {tr("mazoPublico.checkingSession")}
          </p>
        ) : authStatus === "anonymous" ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-ink-soft">
              {tr("mazoPublico.createPrompt")}
            </p>
            <ButtonLink
              to={`/crear-cuenta?redirectTo=${encodeURIComponent(`${location.pathname}${location.search}`)}`}
            >
              {tr("mazoPublico.createAccount")}
            </ButtonLink>
            <ButtonLink to="/iniciar-sesion" variant="ghost">
              {tr("mazoPublico.alreadyAccount")}
            </ButtonLink>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Form method="post">
              <input type="hidden" name="intent" value="copy" />
              <input type="hidden" name="sourceDeckId" value={deck.id} />
              <Button type="submit" disabled={isCopying}>
                {isCopying
                  ? tr("mazoPublico.copying")
                  : tr("mazoPublico.copyToLibrary")}
              </Button>
            </Form>
            <ButtonLink to={`/estudiar/${deck.id}`} variant="secondary">
              {tr("mazoPublico.studyNow")}
            </ButtonLink>
            <p className="text-xs text-ink-faint">
              {tr("mazoPublico.copyNote")}
            </p>
          </div>
        )}
      </div>

      {/* Vista previa del contenido ---------------------------------------- */}
      <section className="mt-10">
        <h2 className="font-display text-xl text-ink">
          {tr("mazoPublico.previewTitle")}
        </h2>

        {preview.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">
            {tr("mazoPublico.noCards")}
          </p>
        ) : (
          <ul className="mt-5 grid gap-4 md:grid-cols-2">
            {preview.map((card: DeckCard) => (
              <li key={card.id}>
                <Card className="h-full">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-ink-faint">
                      {cardKindLabel(card.kind)}
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
                      <span className="font-medium text-ink-soft">
                        {tr("mazoPublico.note")}
                      </span>
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
            {tr("mazoPublico.hiddenCards", { count: hidden })}
          </p>
        ) : null}
      </section>
    </Page>
  );
}
