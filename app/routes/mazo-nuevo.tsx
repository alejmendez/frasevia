import { useState } from "react";
import { redirect, useNavigate } from "react-router";
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
  textareaClass,
} from "~/components/ui";
import { slugPreview } from "~/features/decks/slug";
import { getSession, loginPath } from "~/lib/session";
import type { Route } from "./+types/mazo-nuevo";

export function meta() {
  return [{ title: "Crear un mazo — Frasevia" }];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const session = await getSession();

  if (session.status === "unconfigured") {
    return { status: "unconfigured" as const };
  }

  if (session.status === "anonymous") {
    throw redirect(loginPath(request));
  }

  return { status: "ready" as const, userId: session.userId };
}

interface Errors {
  title?: string;
  description?: string;
  cards?: string;
}

const LANGUAGES = [
  { code: "es", label: "Español" },
  { code: "en", label: "Inglés" },
  { code: "pt", label: "Portugués" },
  { code: "fr", label: "Francés" },
  { code: "de", label: "Alemán" },
];

export default function MazoNuevo({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("es");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [seedText, setSeedText] = useState("");

  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (loaderData.status === "unconfigured") {
    return <ConfigNotice />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError(null);

    if (title.trim().length === 0) {
      setErrors({ title: "Ponle un título al mazo." });
      return;
    }

    setPending(true);
    const session = await getSession();
    if (session.status !== "ready") {
      setFormError("Tu sesión expiró. Vuelve a iniciar sesión.");
      setPending(false);
      return;
    }

    const { data: deck, error } = await session.supabase
      .from("decks")
      .insert({
        author_id: session.userId,
        title: title.trim(),
        description: description.trim(),
        level: level.trim() || null,
        source_language: sourceLanguage,
        target_language: targetLanguage,
        visibility,
      })
      .select("id")
      .single();

    if (error || !deck) {
      setFormError(error?.message ?? "No se pudo crear el mazo.");
      setPending(false);
      return;
    }

    // Si la persona pegó contenido de entrada, se crea una tarjeta por línea.
    const lines = seedText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length > 0) {
      const { error: cardsError } = await session.supabase
        .from("cards")
        .insert(
          lines.map((line, index) => parseSeedLine(line, deck.id, index)),
        );

      if (cardsError) {
        // Se deshace el mazo para no dejar uno a medio crear: si solo fallaran
        // las tarjetas, reintentar crearía un mazo duplicado.
        await session.supabase.from("decks").delete().eq("id", deck.id);
        setFormError(
          `No se pudieron crear las tarjetas iniciales (${cardsError.message}). ` +
            "El mazo no se guardó, así que puedes corregir el texto e intentarlo de nuevo.",
        );
        setPending(false);
        return;
      }
    }

    // `navigate` y no `throw redirect()`: esto corre en el `onSubmit` de un
    // formulario, y el enrutador solo captura el redirect de un loader o un
    // action. Lanzado desde aquí no navegaría: el mazo se crearía, la pantalla
    // se quedaría como si nada, y pulsar «Crear» otra vez dejaría un duplicado
    // en la biblioteca. Lo vigila `app/lib/navigation.test.ts`.
    navigate(`/biblioteca/mazos/${deck.id}/editar`);
  }

  return (
    <Page className="max-w-2xl">
      <PageHeader
        eyebrow="Biblioteca"
        title="Crear un mazo"
        description="Un mazo reúne tarjetas de un tema: palabras, frases o reglas. Puedes editarlo y publicarlo cuando quieras."
        // La vía con IA está en la cabecera y no solo al final del formulario:
        // quien llega aquí queriendo IA es el caso más común de entrada
        // equivocada, y casi nunca ha desplazado la página hasta el enlace.
        actions={
          <ButtonLink to="/biblioteca/mazos/nuevo-ia" variant="secondary">
            Crear con IA
          </ButtonLink>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {formError ? <Alert variant="error">{formError}</Alert> : null}

        <Field label="Título" htmlFor="title" required error={errors.title}>
          <input
            id="title"
            name="title"
            required
            maxLength={120}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Inglés para reuniones de trabajo"
            className={inputClass}
          />
          {title.trim() ? (
            <p className="text-xs text-ink-faint">
              Dirección: /mazos/{slugPreview(title)}
            </p>
          ) : null}
        </Field>

        <Field
          label="Descripción"
          htmlFor="description"
          hint="Cuenta de qué trata el mazo. Aparece en el catálogo."
        >
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={textareaClass}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Idioma de origen" htmlFor="source_language">
            <Select
              id="source_language"
              value={sourceLanguage}
              onChange={(event) => setSourceLanguage(event.target.value)}
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
              value={targetLanguage}
              onChange={(event) => setTargetLanguage(event.target.value)}
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
              value={level}
              onChange={(event) => setLevel(event.target.value)}
              placeholder="Principiante"
              className={inputClass}
            />
          </Field>

          <Field label="Visibilidad" htmlFor="visibility">
            <Select
              id="visibility"
              value={visibility}
              onChange={(event) =>
                setVisibility(event.target.value as "private" | "public")
              }
            >
              <option value="private">Privado, solo yo</option>
              <option value="public">Público, aparece en explorar</option>
            </Select>
          </Field>
        </div>

        <Field
          label="Primera tanda de tarjetas (opcional)"
          htmlFor="seed"
          hint="Una tarjeta por línea, con el formato: término | significado en español | ejemplo en inglés | traducción del ejemplo"
        >
          <textarea
            id="seed"
            value={seedText}
            onChange={(event) => setSeedText(event.target.value)}
            placeholder={
              "to push back a meeting | aplazar una reunión | Let's push back the meeting to Friday. | Aplacemos la reunión hasta el viernes."
            }
            className={textareaClass}
          />
        </Field>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Creando…" : "Crear el mazo"}
          </Button>

          <ButtonLink to="/biblioteca/mazos/nuevo-ia" variant="secondary">
            O créalo con IA a partir de un concepto
          </ButtonLink>
        </div>
      </form>
    </Page>
  );
}

/**
 * Interpreta una línea de la tanda inicial.
 *
 * Si faltan partes se guardan igual: es preferible una tarjeta incompleta que se
 * puede completar después en el editor, que rechazar el mazo entero.
 */
function parseSeedLine(line: string, deckId: string, index: number) {
  const [term = "", meaning = "", exampleEn = "", exampleEs = ""] = line
    .split("|")
    .map((part) => part.trim());

  return {
    deck_id: deckId,
    kind: "word" as const,
    term,
    meaning_es: meaning,
    example_en: exampleEn || null,
    example_es: exampleEs || null,
    position: index + 1,
  };
}
