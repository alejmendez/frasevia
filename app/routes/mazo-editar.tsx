import type { SupabaseClient } from "@supabase/supabase-js";
import { useState } from "react";
import { data, Form, redirect } from "react-router";
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
  Select,
  Tag,
  textareaClass,
} from "~/components/ui";
import { slugPreview } from "~/features/decks/slug";
import { getMyDeck } from "~/lib/decks";
import { cardKindLabel, formatDate } from "~/lib/format";
import { deckLanguages } from "~/lib/languages";
import { t } from "~/lib/locale";
import { useT } from "~/lib/locale-context";
import { getSession, loginPath } from "~/lib/session";
import type { Card } from "~/lib/types";
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

const CARD_PREFIX = "card:";

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
      const title = String(formData.get("title") ?? "").trim();
      if (!title) {
        return actionFail(t("mazoEditar.titleRequired"));
      }

      const { error } = await session.supabase
        .from("decks")
        .update({
          title,
          description: String(formData.get("description") ?? "").trim(),
          level: String(formData.get("level") ?? "").trim() || null,
          source_language: String(formData.get("source_language") ?? "es"),
          target_language: String(formData.get("target_language") ?? "en"),
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
      return saveCards(session.supabase, deckId, formData);
    }

    case "add-card": {
      const term = String(formData.get("term") ?? "").trim();
      const meaning = String(formData.get("meaning_es") ?? "").trim();

      if (!term || !meaning) {
        return actionFail(t("mazoEditar.cardNeedsFields"));
      }

      const { data: last } = await session.supabase
        .from("cards")
        .select("position")
        .eq("deck_id", deckId)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { error } = await session.supabase.from("cards").insert({
        deck_id: deckId,
        kind: normalizeKind(formData.get("kind")),
        term,
        meaning_es: meaning,
        example_en: nullable(formData.get("example_en")),
        example_es: nullable(formData.get("example_es")),
        usage_note: nullable(formData.get("usage_note")),
        tags: parseTags(formData.get("tags")),
        position: ((last?.position as number | undefined) ?? 0) + 1,
      });

      if (error) {
        return actionFail(error.message);
      }

      return actionOk(t("mazoEditar.cardAdded"));
    }

    case "delete-card": {
      const cardId = String(formData.get("cardId") ?? "");
      const { error } = await session.supabase
        .from("cards")
        .delete()
        .eq("id", cardId)
        .eq("deck_id", deckId);

      if (error) {
        return actionFail(error.message);
      }

      return actionOk(t("mazoEditar.cardDeleted"));
    }

    case "delete-deck": {
      const { error } = await session.supabase
        .from("decks")
        .delete()
        .eq("id", deckId);

      if (error) {
        return actionFail(error.message);
      }

      // Las tarjetas caen en cascada y el progreso asociado también.
      return redirect("/biblioteca");
    }

    default:
      return actionFail(t("mazoEditar.unknownAction"));
  }
}

function nullable(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text === "" ? null : text;
}

function normalizeKind(value: FormDataEntryValue | null) {
  return value === "phrase" || value === "question" || value === "rule"
    ? value
    : "word";
}

/** "saludos, vida diaria" → ["saludos", "vida diaria"] */
function parseTags(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

/**
 * Guarda todas las tarjetas de un solo envío.
 *
 * El formulario contiene un fieldset por tarjeta con nombres `card:<id>:<campo>`,
 * así que un solo "Guardar tarjetas" persiste toda la edición pendiente.
 */
async function saveCards(
  supabase: SupabaseClient,
  deckId: string,
  formData: FormData,
): Promise<ReturnType<typeof actionOk>> {
  const updates = new Map<
    string,
    {
      term: string;
      meaning_es: string;
      example_en: string | null;
      example_es: string | null;
      usage_note: string | null;
      tags: string[];
      kind: "word" | "phrase" | "question" | "rule";
    }
  >();

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith(CARD_PREFIX)) {
      continue;
    }

    const [, cardId, field] = key.split(":");
    if (!cardId || !field) {
      continue;
    }

    const entry = updates.get(cardId) ?? {
      term: "",
      meaning_es: "",
      example_en: null,
      example_es: null,
      usage_note: null,
      tags: [],
      kind: "word" as const,
    };

    const text = String(value).trim();

    switch (field) {
      case "term":
        entry.term = text;
        break;
      case "meaning_es":
        entry.meaning_es = text;
        break;
      case "example_en":
        entry.example_en = text || null;
        break;
      case "example_es":
        entry.example_es = text || null;
        break;
      case "usage_note":
        entry.usage_note = text || null;
        break;
      case "tags":
        entry.tags = parseTags(value);
        break;
      case "kind":
        entry.kind = normalizeKind(value);
        break;
      default:
        break;
    }

    updates.set(cardId, entry);
  }

  if (updates.size === 0) {
    return actionOk(t("mazoEditar.nothingToSave"));
  }

  const invalid = [...updates.entries()].find(
    ([, card]) => !card.term || !card.meaning_es,
  );
  if (invalid) {
    return actionFail(t("mazoEditar.cardsNeedFields"));
  }

  // RLS impide tocar tarjetas de mazos ajenos, así que si algo falla es porque
  // ese id no es editable; se informa sin exponer más detalles.
  const results = await Promise.all(
    [...updates.entries()].map(([cardId, card]) =>
      supabase
        .from("cards")
        .update(card)
        .eq("id", cardId)
        .eq("deck_id", deckId),
    ),
  );

  const failure = results.find((result) => result.error);
  if (failure?.error) {
    return actionFail(failure.error.message);
  }

  return actionOk(t("mazoEditar.cardsSaved"));
}

export default function MazoEditar({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const tr = useT();
  const [isPublic, setIsPublic] = useState(
    loaderData.deck?.visibility === "public",
  );
  const languages = deckLanguages();

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
            <a href="/mazos/ingles-desde-las-bases" className="underline">
              {tr("mazoEditar.makeCopy")}
            </a>{" "}
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
              <Field
                label={tr("deckField.sourceLanguage")}
                htmlFor="source_language"
              >
                <Select
                  id="source_language"
                  name="source_language"
                  defaultValue={deck.source_language}
                >
                  {languages.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label={tr("deckField.targetLanguage")}
                htmlFor="target_language"
              >
                <Select
                  id="target_language"
                  name="target_language"
                  defaultValue={deck.target_language}
                >
                  {languages.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label={tr("deckField.level")}
                htmlFor="level"
                hint={tr("deckField.levelHint")}
              >
                <input
                  id="level"
                  name="level"
                  defaultValue={deck.level ?? ""}
                  placeholder={tr("mazoNuevo.levelPlaceholder")}
                  className={inputClass}
                />
              </Field>

              <Field label={tr("deckField.visibility")} htmlFor="visibility">
                <Select
                  id="visibility"
                  name="visibility"
                  value={isPublic ? "public" : "private"}
                  onChange={(event) =>
                    setIsPublic(event.target.value === "public")
                  }
                >
                  <option value="private">
                    {tr("visibility.option.private")}
                  </option>
                  <option value="public">
                    {tr("visibility.option.public")}
                  </option>
                </Select>
              </Field>
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
              <AddCardForm />

              {cards.length > 0 ? (
                <Form method="post" className="mt-6 space-y-4">
                  <input type="hidden" name="intent" value="save-cards" />
                  {cards.map((card) => (
                    <CardEditor key={card.id} card={card} />
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

function AddCardForm() {
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

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label={tr("mazoEditar.fieldTerm")} htmlFor="new-term" required>
          <input id="new-term" name="term" required className={inputClass} />
        </Field>

        <Field
          label={tr("mazoEditar.fieldMeaning")}
          htmlFor="new-meaning"
          required
        >
          <input
            id="new-meaning"
            name="meaning_es"
            required
            className={inputClass}
          />
        </Field>

        <Field label={tr("mazoEditar.fieldKind")} htmlFor="new-kind">
          <Select id="new-kind" name="kind" defaultValue="word">
            <option value="word">{cardKindLabel("word")}</option>
            <option value="phrase">{cardKindLabel("phrase")}</option>
            <option value="question">{cardKindLabel("question")}</option>
            <option value="rule">{cardKindLabel("rule")}</option>
          </Select>
        </Field>

        <Field
          label={tr("mazoEditar.fieldTags")}
          htmlFor="new-tags"
          hint={tr("mazoEditar.tagsHint")}
        >
          <input id="new-tags" name="tags" className={inputClass} />
        </Field>
      </div>

      <div className="mt-4 grid gap-4">
        <Field label={tr("mazoEditar.fieldExampleEn")} htmlFor="new-example-en">
          <input id="new-example-en" name="example_en" className={inputClass} />
        </Field>
        <Field label={tr("mazoEditar.fieldExampleEs")} htmlFor="new-example-es">
          <input id="new-example-es" name="example_es" className={inputClass} />
        </Field>
        <Field label={tr("mazoEditar.fieldUsageNote")} htmlFor="new-usage-note">
          <input id="new-usage-note" name="usage_note" className={inputClass} />
        </Field>
      </div>

      <div className="mt-4">
        <Button type="submit">{tr("mazoEditar.addCardSubmit")}</Button>
      </div>
    </Form>
  );
}

function CardEditor({ card }: { card: Card }) {
  const prefix = `card:${card.id}`;
  const tr = useT();

  return (
    <fieldset className="rounded-card border border-line bg-paper-raised p-5">
      <legend className="px-1 text-xs text-ink-faint">
        {tr("mazoEditar.createdOn", { date: formatDate(card.created_at) })}
      </legend>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={tr("mazoEditar.fieldTerm")}
          htmlFor={`${prefix}-term`}
          required
        >
          <input
            id={`${prefix}-term`}
            name={`${prefix}:term`}
            defaultValue={card.term}
            required
            className={inputClass}
          />
        </Field>

        <Field
          label={tr("mazoEditar.fieldMeaning")}
          htmlFor={`${prefix}-meaning`}
          required
        >
          <input
            id={`${prefix}-meaning`}
            name={`${prefix}:meaning_es`}
            defaultValue={card.meaning_es}
            required
            className={inputClass}
          />
        </Field>

        <Field label={tr("mazoEditar.fieldKind")} htmlFor={`${prefix}-kind`}>
          <Select
            id={`${prefix}-kind`}
            name={`${prefix}:kind`}
            defaultValue={card.kind}
          >
            <option value="word">{cardKindLabel("word")}</option>
            <option value="phrase">{cardKindLabel("phrase")}</option>
            <option value="question">{cardKindLabel("question")}</option>
            <option value="rule">{cardKindLabel("rule")}</option>
          </Select>
        </Field>

        <Field
          label={tr("mazoEditar.fieldTags")}
          htmlFor={`${prefix}-tags`}
          hint={tr("mazoEditar.tagsHint")}
        >
          <input
            id={`${prefix}-tags`}
            name={`${prefix}:tags`}
            defaultValue={card.tags.join(", ")}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="mt-4 grid gap-4">
        <Field
          label={tr("mazoEditar.fieldExampleEn")}
          htmlFor={`${prefix}-example-en`}
        >
          <input
            id={`${prefix}-example-en`}
            name={`${prefix}:example_en`}
            defaultValue={card.example_en ?? ""}
            className={inputClass}
          />
        </Field>
        <Field
          label={tr("mazoEditar.fieldExampleEs")}
          htmlFor={`${prefix}-example-es`}
        >
          <input
            id={`${prefix}-example-es`}
            name={`${prefix}:example_es`}
            defaultValue={card.example_es ?? ""}
            className={inputClass}
          />
        </Field>
        <Field
          label={tr("mazoEditar.fieldUsageNote")}
          htmlFor={`${prefix}-usage-note`}
        >
          <input
            id={`${prefix}-usage-note`}
            name={`${prefix}:usage_note`}
            defaultValue={card.usage_note ?? ""}
            className={inputClass}
          />
        </Field>
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
