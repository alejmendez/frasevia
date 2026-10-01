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
import { getSession, loginPath } from "~/lib/session";
import type { Card } from "~/lib/types";
import type { Route } from "./+types/mazo-editar";

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    {
      title: loaderData?.deck
        ? `Editar ${loaderData.deck.title}`
        : "Editar mazo",
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
    throw data({ message: "Mazo no encontrado" }, { status: 404 });
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
    return actionFail("Falta configurar Supabase.", 503);
  }
  if (session.status === "anonymous") {
    throw redirect(loginPath(request));
  }

  const deckId = params.id;

  switch (intent) {
    case "save-deck": {
      const title = String(formData.get("title") ?? "").trim();
      if (!title) {
        return actionFail("El título no puede quedar vacío.");
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

      return actionOk("Mazo guardado.");
    }

    case "save-cards": {
      return saveCards(session.supabase, deckId, formData);
    }

    case "add-card": {
      const term = String(formData.get("term") ?? "").trim();
      const meaning = String(formData.get("meaning_es") ?? "").trim();

      if (!term || !meaning) {
        return actionFail("La tarjeta necesita un término y su significado.");
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

      return actionOk("Tarjeta agregada.");
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

      return actionOk("Tarjeta eliminada.");
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
      return actionFail("Acción no reconocida.");
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
    return actionOk("No había cambios que guardar.");
  }

  const invalid = [...updates.entries()].find(
    ([, card]) => !card.term || !card.meaning_es,
  );
  if (invalid) {
    return actionFail("Cada tarjeta necesita un término y su significado.");
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

  return actionOk("Tarjetas guardadas.");
}

const LANGUAGES = [
  { code: "es", label: "Español" },
  { code: "en", label: "Inglés" },
  { code: "pt", label: "Portugués" },
  { code: "fr", label: "Francés" },
  { code: "de", label: "Alemán" },
];

export default function MazoEditar({
  loaderData,
  actionData,
}: Route.ComponentProps) {
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
        eyebrow="Biblioteca"
        title={deck.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {deck.is_official ? <Tag tone="brand">Oficial</Tag> : null}
            {deck.source_deck_id ? <Tag>Copia</Tag> : null}
            <span className="text-sm">/mazos/{deck.slug}</span>
          </span>
        }
        actions={
          <>
            <ButtonLink to={`/estudiar/${deck.id}`} variant="secondary">
              Estudiar
            </ButtonLink>
            {deck.visibility === "public" ? (
              <ButtonLink to={`/mazos/${deck.slug}`} variant="ghost">
                Ver página pública
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
          <Alert variant="info" title="Mazo oficial de solo lectura">
            El contenido oficial lo mantiene el equipo de Frasevia. Si quieres
            cambiarlo,{" "}
            <a href="/mazos/ingles-desde-las-bases" className="underline">
              haz una copia
            </a>{" "}
            y edítala en tu biblioteca.
          </Alert>
        </div>
      ) : null}

      <div className="space-y-10">
        {/* -------------------------------------------------------------- */}
        {/* Datos del mazo                                                  */}
        {/* -------------------------------------------------------------- */}
        <section>
          <h2 className="font-display text-xl text-ink">Datos del mazo</h2>
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

            <Field label="Título" htmlFor="title" required>
              <input
                id="title"
                name="title"
                required
                defaultValue={deck.title}
                maxLength={120}
                className={inputClass}
              />
              <p className="text-xs text-ink-faint">
                Dirección: /mazos/{slugPreview(deck.title)}
              </p>
            </Field>

            <Field
              label="Descripción"
              htmlFor="description"
              hint="Aparece en el catálogo cuando el mazo es público."
            >
              <textarea
                id="description"
                name="description"
                defaultValue={deck.description}
                className={textareaClass}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Idioma de origen" htmlFor="source_language">
                <Select
                  id="source_language"
                  name="source_language"
                  defaultValue={deck.source_language}
                >
                  {LANGUAGES.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Idioma que se aprende" htmlFor="target_language">
                <Select
                  id="target_language"
                  name="target_language"
                  defaultValue={deck.target_language}
                >
                  {LANGUAGES.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Nivel aproximado"
                htmlFor="level"
                hint="Una idea orientativa, no una certificación."
              >
                <input
                  id="level"
                  name="level"
                  defaultValue={deck.level ?? ""}
                  placeholder="Principiante"
                  className={inputClass}
                />
              </Field>

              <Field label="Visibilidad" htmlFor="visibility">
                <Select
                  id="visibility"
                  name="visibility"
                  value={isPublic ? "public" : "private"}
                  onChange={(event) =>
                    setIsPublic(event.target.value === "public")
                  }
                >
                  <option value="private">Privado, solo yo</option>
                  <option value="public">Público, aparece en explorar</option>
                </Select>
              </Field>
            </div>

            {isPublic ? (
              <Alert variant="info">
                Mientras sea público, cualquiera con el enlace puede leerlo y
                copiarlo a su biblioteca.
              </Alert>
            ) : null}

            <Button type="submit">Guardar mazo</Button>
          </Form>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* Tarjetas                                                        */}
        {/* -------------------------------------------------------------- */}
        <section>
          <h2 className="font-display text-xl text-ink">
            Tarjetas ({cards.length})
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
                  <Button type="submit">Guardar tarjetas</Button>
                </Form>
              ) : (
                <p className="mt-4 text-sm text-ink-soft">
                  Este mazo todavía no tiene tarjetas. Agrega la primera con el
                  formulario de arriba.
                </p>
              )}

              <div className="mt-8 border-t border-line pt-6">
                <ConfirmSubmit
                  intent="delete-deck"
                  title={`¿Eliminar «${deck.title}»?`}
                  description="Se borra el mazo, sus tarjetas y el progreso que registraste en ellas. No se puede deshacer."
                  confirmLabel="Eliminar el mazo"
                  triggerClassName="text-sm text-danger hover:underline"
                >
                  Eliminar este mazo
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
  return (
    <Form
      method="post"
      className="mt-4 rounded-card border border-line bg-paper-sunken/50 p-5"
    >
      <input type="hidden" name="intent" value="add-card" />
      <h3 className="text-sm font-semibold text-ink">Agregar una tarjeta</h3>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Término en inglés" htmlFor="new-term" required>
          <input id="new-term" name="term" required className={inputClass} />
        </Field>

        <Field label="Significado en español" htmlFor="new-meaning" required>
          <input
            id="new-meaning"
            name="meaning_es"
            required
            className={inputClass}
          />
        </Field>

        <Field label="Tipo" htmlFor="new-kind">
          <Select id="new-kind" name="kind" defaultValue="word">
            <option value="word">Palabra</option>
            <option value="phrase">Frase</option>
            <option value="question">Pregunta</option>
            <option value="rule">Regla</option>
          </Select>
        </Field>

        <Field label="Etiquetas" htmlFor="new-tags" hint="Separadas por comas.">
          <input id="new-tags" name="tags" className={inputClass} />
        </Field>
      </div>

      <div className="mt-4 grid gap-4">
        <Field label="Ejemplo en inglés" htmlFor="new-example-en">
          <input id="new-example-en" name="example_en" className={inputClass} />
        </Field>
        <Field label="Traducción del ejemplo" htmlFor="new-example-es">
          <input id="new-example-es" name="example_es" className={inputClass} />
        </Field>
        <Field label="Nota de uso" htmlFor="new-usage-note">
          <input id="new-usage-note" name="usage_note" className={inputClass} />
        </Field>
      </div>

      <div className="mt-4">
        <Button type="submit">Agregar tarjeta</Button>
      </div>
    </Form>
  );
}

function CardEditor({ card }: { card: Card }) {
  const prefix = `card:${card.id}`;

  return (
    <fieldset className="rounded-card border border-line bg-paper-raised p-5">
      <legend className="px-1 text-xs text-ink-faint">
        Tarjeta creada el{" "}
        {new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(
          new Date(card.created_at),
        )}
      </legend>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Término en inglés" htmlFor={`${prefix}-term`} required>
          <input
            id={`${prefix}-term`}
            name={`${prefix}:term`}
            defaultValue={card.term}
            required
            className={inputClass}
          />
        </Field>

        <Field
          label="Significado en español"
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

        <Field label="Tipo" htmlFor={`${prefix}-kind`}>
          <Select
            id={`${prefix}-kind`}
            name={`${prefix}:kind`}
            defaultValue={card.kind}
          >
            <option value="word">Palabra</option>
            <option value="phrase">Frase</option>
            <option value="question">Pregunta</option>
            <option value="rule">Regla</option>
          </Select>
        </Field>

        <Field
          label="Etiquetas"
          htmlFor={`${prefix}-tags`}
          hint="Separadas por comas."
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
        <Field label="Ejemplo en inglés" htmlFor={`${prefix}-example-en`}>
          <input
            id={`${prefix}-example-en`}
            name={`${prefix}:example_en`}
            defaultValue={card.example_en ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Traducción del ejemplo" htmlFor={`${prefix}-example-es`}>
          <input
            id={`${prefix}-example-es`}
            name={`${prefix}:example_es`}
            defaultValue={card.example_es ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Nota de uso" htmlFor={`${prefix}-usage-note`}>
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
          title="¿Eliminar esta tarjeta?"
          description="Se borra la tarjeta y el progreso que registraste en ella."
          confirmLabel="Eliminar"
          triggerClassName="text-sm text-danger hover:underline"
        >
          Eliminar esta tarjeta
        </ConfirmSubmit>
      </div>
    </fieldset>
  );
}
