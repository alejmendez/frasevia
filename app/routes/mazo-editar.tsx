import { useState } from "react";
import { data, Form, Link, redirect } from "react-router";
import { ConfirmSubmit } from "~/components/confirm";
import {
  Alert,
  Button,
  ButtonLink,
  ConfigNotice,
  Field,
  inputClass,
  Page,
  PageHeader,
  Tag,
  textareaClass,
} from "~/components/ui";
import { CardFields } from "~/features/decks/form/card-fields";
import {
  LanguageFields,
  LevelField,
  VisibilityField,
} from "~/features/decks/form/deck-fields";
import {
  normalizeKind,
  optional,
  parseCardForm,
  parseTags,
} from "~/features/decks/parse-card-form";
import { slugPreview } from "~/features/decks/slug";
import { StudyModeField } from "~/features/decks/study-mode-field";
import {
  appendCard,
  type CardDraft,
  deleteCard,
  deleteDeck,
  getMyDeck,
  updateDeckCards,
} from "~/lib/decks";
import { formatDate } from "~/lib/format";
import { t } from "~/lib/locale";
import { useT } from "~/lib/locale-context";
import { getSession, loginPath } from "~/lib/session";
import type { Card, DeckStudyMode } from "~/lib/types";
import type { Route } from "./+types/mazo-editar";

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    {
      title: loaderData?.deck
        ? t("mazoEditar.metaDeck", { deck: loaderData.deck.title })
        : t("mazoEditar.metaTitle"),
    },
  ];
}

export async function clientLoader({
  request,
  params,
}: Route.ClientLoaderArgs) {
  const session = await getSession();

  if (session.status === "unconfigured") {
    return { status: "unconfigured" as const, deck: null, cards: [] };
  }

  if (session.status === "anonymous") {
    throw redirect(loginPath(request));
  }

  const { deck, cards, error } = await getMyDeck(session.supabase, params.id);

  if (error) {
    throw data({ message: error }, { status: 500 });
  }

  if (!deck) {
    // RLS oculta los mazos ajenos: no revelamos si el id existe o no.
    throw data({ message: t("estudiar.deckNotFound") }, { status: 404 });
  }

  return { status: "ready" as const, deck, cards };
}

type ActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

/**
 * Ambos envoltorios devuelven el mismo tipo (`DataWithResponseInit<ActionResult>`),
 * así que la unión de todas las ramas del action se mantiene simple y el
 * componente puede leer `actionData.ok` sin castear.
 */
function actionOk(message: string) {
  return data<ActionResult>({ ok: true, message });
}

function actionFail(message: string, status = 400) {
  return data<ActionResult>({ ok: false, message }, { status });
}

/**
 * Acciones del editor.
 *
 * Todas llegan por `clientAction` porque dependen de la sesión. Los `intent`
 * separan operaciones para que un mismo formulario no pueda hacer de más.
 */
export async function clientAction({
  request,
  params,
}: Route.ClientActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  const session = await getSession();
  if (session.status === "unconfigured") {
    return actionFail(t("mazoEditar.noSupabaseShort"), 503);
  }
  if (session.status === "anonymous") {
    throw redirect(loginPath(request));
  }

  const deckId = params.id;

  switch (intent) {
    case "save-deck": {
      const studyMode =
        formData.get("study_mode") === "general" ? "general" : "language";
      const title = String(formData.get("title") ?? "").trim();
      if (!title) {
        return actionFail(t("mazoEditar.titleRequired"));
      }

      const { error } = await session.supabase
        .from("decks")
        .update({
          title,
          study_mode: studyMode,
          description: String(formData.get("description") ?? "").trim(),
          level: String(formData.get("level") ?? "").trim() || null,
          source_language: String(formData.get("source_language") ?? "es"),
          target_language: String(
            formData.get(
              studyMode === "general" ? "source_language" : "target_language",
            ) ?? "en",
          ),
          visibility:
            formData.get("visibility") === "public" ? "public" : "private",
        })
        .eq("id", deckId);

      if (error) {
        return actionFail(error.message);
      }

      return actionOk(t("mazoEditar.deckSaved"));
    }

    case "save-cards": {
      const parsed = parseCardForm(formData);

      if (!parsed.ok) {
        return actionFail(
          parsed.reason === "empty"
            ? t("mazoEditar.nothingToSave")
            : t("mazoEditar.cardsNeedFields"),
        );
      }

      const { error } = await updateDeckCards(
        session.supabase,
        deckId,
        parsed.cards,
      );

      return error ? actionFail(error) : actionOk(t("mazoEditar.cardsSaved"));
    }

    case "add-card": {
      const card: CardDraft = {
        term: String(formData.get("term") ?? ""),
        meaningEs: String(formData.get("meaning_es") ?? ""),
        kind: normalizeKind(formData.get("kind")),
        exampleEn: optional(formData.get("example_en")),
        exampleEs: optional(formData.get("example_es")),
        usageNote: optional(formData.get("usage_note")),
        tags: parseTags(formData.get("tags")),
      };

      if (card.term === "" || card.meaningEs === "") {
        return actionFail(t("mazoEditar.cardNeedsFields"));
      }

      const { error } = await appendCard(session.supabase, deckId, card);

      return error ? actionFail(error) : actionOk(t("mazoEditar.cardAdded"));
    }

    case "delete-card": {
      const { error } = await deleteCard(
        session.supabase,
        deckId,
        String(formData.get("cardId") ?? ""),
      );

      return error ? actionFail(error) : actionOk(t("mazoEditar.cardDeleted"));
    }

    case "delete-deck": {
      const { error } = await deleteDeck(session.supabase, deckId);

      if (error) {
        return actionFail(error);
      }

      // Las tarjetas caen en cascada y el progreso asociado también.
      return redirect("/biblioteca");
    }

    default:
      return actionFail(t("mazoEditar.unknownAction"));
  }
}

export default function MazoEditar({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const tr = useT();
  const [studyMode, setStudyMode] = useState<DeckStudyMode>(
    loaderData.deck?.study_mode ?? "language",
  );
  const [isPublic, setIsPublic] = useState(
    loaderData.deck?.visibility === "public",
  );

  if (loaderData.status === "unconfigured") {
    return <ConfigNotice />;
  }

  const { deck, cards } = loaderData;
  if (!deck) {
    return null;
  }

  const message = actionData ?? null;

  return (
    <Page>
      <PageHeader
        eyebrow={tr("mazoNuevo.eyebrow")}
        title={deck.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {deck.is_official ? (
              <Tag tone="brand">{tr("biblioteca.official")}</Tag>
            ) : null}
            {deck.source_deck_id ? <Tag>{tr("mazoEditar.copyTag")}</Tag> : null}
            <span className="text-sm">/mazos/{deck.slug}</span>
          </span>
        }
        actions={
          <>
            <ButtonLink to={`/estudiar/${deck.id}`} variant="secondary">
              {tr("biblioteca.study")}
            </ButtonLink>
            {deck.visibility === "public" ? (
              <ButtonLink to={`/mazos/${deck.slug}`} variant="ghost">
                {tr("mazoEditar.publicPage")}
              </ButtonLink>
            ) : null}
          </>
        }
      />

      {message ? (
        <div className="mb-6">
          <Alert variant={message.ok ? "success" : "error"}>
            {message.message}
          </Alert>
        </div>
      ) : null}

      {deck.is_official ? (
        <div className="mb-6">
          <Alert variant="info" title={tr("mazoEditar.officialTitle")}>
            {tr("mazoEditar.officialBody")}{" "}
            <Link to="/mazos/ingles-desde-las-bases" className="underline">
              {tr("mazoEditar.makeCopy")}
            </Link>{" "}
            {tr("mazoEditar.officialTail")}
          </Alert>
        </div>
      ) : null}

      <div className="space-y-10">
        {/* -------------------------------------------------------------- */}
        {/* Datos del mazo                                                  */}
        {/* -------------------------------------------------------------- */}
        <section>
          <h2 className="font-display text-xl text-ink">
            {tr("mazoEditar.deckData")}
          </h2>
          <Form
            method="post"
            className="mt-4 space-y-5"
            onChange={(event) => {
              if (event.target.name === "visibility") {
                setIsPublic(event.target.value === "public");
              }
            }}
          >
            <input type="hidden" name="intent" value="save-deck" />
            <StudyModeField value={studyMode} onChange={setStudyMode} />

            <Field label={tr("deckField.title")} htmlFor="title" required>
              <input
                id="title"
                name="title"
                required
                defaultValue={deck.title}
                maxLength={120}
                className={inputClass}
              />
              <p className="text-xs text-ink-faint">
                {tr("mazoNuevo.url", { slug: slugPreview(deck.title) })}
              </p>
            </Field>

            <Field
              label={tr("deckField.description")}
              htmlFor="description"
              hint={tr("deckField.descriptionHintPublic")}
            >
              <textarea
                id="description"
                name="description"
                defaultValue={deck.description}
                className={textareaClass}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <LanguageFields
                names={{ source: "source_language", target: "target_language" }}
                labels={{
                  source: "deckField.sourceLanguage",
                  target: "deckField.targetLanguage",
                }}
                source={deck.source_language}
                target={deck.target_language}
                studyMode={studyMode}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <LevelField
                name="level"
                value={deck.level}
                studyMode={studyMode}
              />
              <VisibilityField
                name="visibility"
                value={isPublic ? "public" : "private"}
                onChange={(value) => setIsPublic(value === "public")}
              />
            </div>

            {isPublic ? (
              <Alert variant="info">{tr("mazoEditar.publicNotice")}</Alert>
            ) : null}

            <Button type="submit">{tr("mazoEditar.saveDeck")}</Button>
          </Form>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* Tarjetas                                                        */}
        {/* -------------------------------------------------------------- */}
        <section>
          <h2 className="font-display text-xl text-ink">
            {tr("mazoEditar.cardsHeading", { count: cards.length })}
          </h2>

          {deck.is_official ? null : (
            <>
              <AddCardForm studyMode={deck.study_mode} />

              {cards.length > 0 ? (
                <Form method="post" className="mt-6 space-y-4">
                  <input type="hidden" name="intent" value="save-cards" />
                  {cards.map((card) => (
                    <CardEditor
                      key={card.id}
                      card={card}
                      studyMode={deck.study_mode}
                    />
                  ))}
                  <Button type="submit">{tr("mazoEditar.saveCards")}</Button>
                </Form>
              ) : (
                <p className="mt-4 text-sm text-ink-soft">
                  {tr("mazoEditar.noCardsYet")}
                </p>
              )}

              <div className="mt-8 border-t border-line pt-6">
                <ConfirmSubmit
                  intent="delete-deck"
                  title={tr("mazoEditar.deleteDeckTitle", {
                    title: deck.title,
                  })}
                  description={tr("mazoEditar.deleteDeckBody")}
                  confirmLabel={tr("mazoEditar.deleteDeckConfirm")}
                  triggerClassName="text-sm text-danger hover:underline"
                >
                  {tr("mazoEditar.deleteDeckTrigger")}
                </ConfirmSubmit>
              </div>
            </>
          )}
        </section>
      </div>
    </Page>
  );
}

/** El formulario de una tarjeta nueva. */
function AddCardForm({ studyMode }: { studyMode: DeckStudyMode }) {
  const tr = useT();

  return (
    <Form
      method="post"
      className="mt-4 rounded-card border border-line bg-paper-sunken/50 p-5"
    >
      <input type="hidden" name="intent" value="add-card" />
      <h3 className="text-sm font-semibold text-ink">
        {tr("mazoEditar.addCardTitle")}
      </h3>

      <div className="mt-4">
        <CardFields prefix="" studyMode={studyMode} />
      </div>

      <div className="mt-4">
        <Button type="submit">{tr("mazoEditar.addCardSubmit")}</Button>
      </div>
    </Form>
  );
}

/** Una tarjeta que ya está guardada, con su campo y su botón de borrar. */
function CardEditor({
  card,
  studyMode,
}: {
  card: Card;
  studyMode: DeckStudyMode;
}) {
  const tr = useT();

  return (
    <fieldset className="rounded-card border border-line bg-paper-raised p-5">
      <legend className="px-1 text-xs text-ink-faint">
        {tr("mazoEditar.createdOn", { date: formatDate(card.created_at) })}
      </legend>

      <div className="mt-2">
        <CardFields
          prefix={`card:${card.id}`}
          studyMode={studyMode}
          card={card}
        />
      </div>

      <div className="mt-4">
        <ConfirmSubmit
          intent="delete-card"
          fields={{ cardId: card.id }}
          title={tr("mazoEditar.deleteCardTitle")}
          description={tr("mazoEditar.deleteCardBody")}
          confirmLabel={tr("common.delete")}
          triggerClassName="text-sm text-danger hover:underline"
        >
          {tr("mazoEditar.deleteCardTrigger")}
        </ConfirmSubmit>
      </div>
    </fieldset>
  );
}
