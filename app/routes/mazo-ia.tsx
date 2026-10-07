import { useCallback, useEffect, useRef, useState } from "react";
import { Link, redirect, useNavigate } from "react-router";
import {
  Alert,
  Button,
  Card,
  ConfigNotice,
  cx,
  Field,
  inputClass,
  Page,
  PageHeader,
  SectionTitle,
  Select,
  Textarea,
} from "~/components/ui";
import { DeckReview, type ReviewDeck } from "~/features/ai/deck-review";
import {
  type DeckDraft,
  DraftError,
  parseDeckDraft,
} from "~/features/ai/draft";
import {
  GenerationError,
  generateDeckDraft,
  isAbort,
} from "~/features/ai/generate";
import { hasKey } from "~/features/ai/keys";
import {
  listModels,
  type ModelInfo,
  ModelListError,
  searchModels,
} from "~/features/ai/models";
import { buildStandalonePrompt } from "~/features/ai/prompt";
import { PROVIDER } from "~/features/ai/providers";
import { StudyModeField } from "~/features/decks/study-mode-field";
import { deckLanguages } from "~/lib/languages";
import { type MessageKey, t } from "~/lib/locale";
import { useT } from "~/lib/locale-context";
import { getSession, loginPath } from "~/lib/session";
import type { DeckStudyMode } from "~/lib/types";
import type { Route } from "./+types/mazo-ia";

export function meta() {
  return [{ title: t("mazoIa.metaTitle") }];
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

/**
 * Niveles que se ofrecen al encargar un mazo.
 *
 * El `value` es lo que se guarda en la base de datos y va en el prompt, así que
 * es un código neutro y no el texto de la etiqueta. Si se guardara «Principiante»
 * o «Beginner», un mazo creado en una interfaz acabaría con un nivel en el otro
 * idioma, y el editor —que lo muestra tal cual— lo dejaría así.
 */
const LEVELS: { value: string; key: MessageKey }[] = [
  { value: "beginner", key: "level.beginner" },
  { value: "intermediate", key: "level.intermediate" },
  { value: "advanced", key: "level.advanced" },
  { value: "unspecified", key: "level.unspecified" },
];

/** Tope de la caja al pedir, para no gastar de más por un error de tecleo. */
const COUNT_MIN = 4;
const COUNT_MAX = 40;

/** Filas visibles del catálogo: con el filtro de arriba no hace falta más. */
const VISIBLE_MODELS = 40;

type Mode = "generar" | "importar";

export default function MazoIa({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const tr = useT();
  const languages = deckLanguages();

  const [mode, setMode] = useState<Mode>("generar");
  const [concept, setConcept] = useState("");
  const [studyMode, setStudyMode] = useState<DeckStudyMode>("language");
  const [cardCount, setCardCount] = useState(12);
  const [level, setLevel] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("es");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [withExtras, setWithExtras] = useState(true);
  const [visibility, setVisibility] = useState<"private" | "public">("private");

  // `PROVIDER` es `as const`, así que sin el tipo explícito el estado se
  // inferiría como el literal y luego no admitiría otro modelo.
  const [model, setModel] = useState<string>(PROVIDER.defaultModel);
  const [models, setModels] = useState<ModelInfo[] | null>(null);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelQuery, setModelQuery] = useState("");

  const [imported, setImported] = useState("");
  const [copied, setCopied] = useState(false);

  const [deck, setDeck] = useState<ReviewDeck | null>(null);
  const [dropped, setDropped] = useState<number[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  // Permite cancelar una generación en curso: son varios segundos de espera, y
  // no hay otra forma de recuperar ese dinero ni de salir de la espera.
  const controller = useRef<AbortController | null>(null);

  const loadModels = useCallback(async () => {
    setLoadingModels(true);
    setModelsError(null);
    try {
      setModels(await listModels());
    } catch (cause) {
      setModelsError(
        cause instanceof ModelListError
          ? cause.message
          : t("mazoIa.modelsLoadFailed"),
      );
    } finally {
      setLoadingModels(false);
    }
  }, []);

  // El catálogo no necesita clave, así que se pide siempre al abrir: le sirve
  // igual a quien va a importar y a quien va a generar, y son unos 460 modelos
  // que no tiene sentido mantener escritos en el código.
  useEffect(() => {
    void loadModels();
  }, [loadModels]);

  if (loaderData.status === "unconfigured") {
    return <ConfigNotice />;
  }

  const keyReady = hasKey();
  const selected = models?.find((item) => item.id === model) ?? null;
  const hasConcept = concept.trim().length >= 3;

  const request = {
    studyMode,
    concept,
    cardCount,
    sourceLanguage,
    targetLanguage,
    level,
    withExtras,
  };

  const canGenerate = hasConcept && model.trim() !== "" && keyReady && !busy;
  const canImport = imported.trim() !== "" && !busy;

  /**
   * Pasa un borrador a la pantalla de revisión.
   *
   * El identificador se asigna aquí y no donde nace la tarjeta porque las dos
   * vías de entrada producen el mismo `DeckDraft`, y duplicar el mapeo en las dos
   * es la forma segura de que se desincronicen.
   */
  function adopt(draft: DeckDraft) {
    setDeck({
      title: draft.title,
      description: draft.description,
      level: draft.level,
      cards: draft.cards.map((card, index) => ({ ...card, id: `c${index}` })),
    });
    setTitle(draft.title);
    setDescription(draft.description);
    setDropped([]);
    setError(null);
  }

  async function handleGenerate() {
    if (!canGenerate) {
      return;
    }

    setBusy(true);
    setError(null);
    const current = new AbortController();
    controller.current = current;

    try {
      const result = await generateDeckDraft({
        model,
        jsonMode: selected?.supportsJsonMode,
        signal: current.signal,
        request,
      });
      adopt(result);
    } catch (cause) {
      if (isAbort(cause)) {
        return;
      }
      setError(
        cause instanceof GenerationError || cause instanceof DraftError
          ? cause.message
          : t("mazoIa.generateFailed"),
      );
    } finally {
      setBusy(false);
      controller.current = null;
    }
  }

  function handleImport() {
    if (!canImport) {
      return;
    }

    try {
      // Se reutiliza el mismo lector que la llamada directa. El JSON que
      // devuelve una conversación casi nunca viene tan limpio como el de una
      // API, y tolerar la prosa y los bloques de código aquí evita hacerlo dos
      // veces.
      adopt(parseDeckDraft(imported, studyMode));
    } catch (cause) {
      setError(
        cause instanceof DraftError ? cause.message : t("mazoIa.importFailed"),
      );
    }
  }

  function discardDeck() {
    setDeck(null);
    setDropped([]);
    setError(null);
  }

  function toggleDrop(index: number) {
    setDropped((current) =>
      current.includes(index)
        ? current.filter((value) => value !== index)
        : [...current, index],
    );
  }

  const kept = deck
    ? deck.cards.filter((_, index) => !dropped.includes(index))
    : [];

  async function handleSave() {
    if (deck === null || kept.length === 0 || saving) {
      return;
    }

    if (title.trim() === "") {
      setError(t("mazoNuevo.titleRequired"));
      return;
    }

    setSaving(true);
    setError(null);

    const session = await getSession();
    if (session.status !== "ready") {
      setError(t("mazoNuevo.sessionExpired"));
      setSaving(false);
      return;
    }

    const { data: newDeck, error: deckError } = await session.supabase
      .from("decks")
      .insert({
        author_id: session.userId,
        title: title.trim(),
        description: description.trim(),
        study_mode: studyMode,
        level: deck.level,
        source_language: sourceLanguage,
        target_language:
          studyMode === "general" ? sourceLanguage : targetLanguage,
        visibility,
      })
      .select("id")
      .single();

    if (deckError || !newDeck) {
      setError(deckError?.message ?? t("mazoNuevo.createFailed"));
      setSaving(false);
      return;
    }

    const { error: cardsError } = await session.supabase.from("cards").insert(
      kept.map((card, index) => ({
        deck_id: newDeck.id,
        kind: card.kind,
        term: card.term,
        meaning_es: card.meaningEs,
        example_en: card.exampleEn,
        example_es: card.exampleEs,
        usage_note: card.usageNote,
        tags: card.tags,
        position: index + 1,
      })),
    );

    if (cardsError) {
      // Se deshace el mazo entero: si solo fallaran las tarjetas, reintentar
      // crearía un mazo duplicado en la biblioteca.
      await session.supabase.from("decks").delete().eq("id", newDeck.id);
      setError(t("mazoIa.cardsSaveFailed", { message: cardsError.message }));
      setSaving(false);
      return;
    }

    // `navigate` y no `throw redirect()`: esto corre en un manejador de evento, y
    // el enrutador solo captura el redirect de un loader o un action. Lanzado
    // aquí no navegaría y dejaría la página como si el guardado hubiera fallado.
    // Lo vigila `app/lib/navigation.test.ts`.
    navigate(`/biblioteca/mazos/${newDeck.id}/editar`);
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(buildStandalonePrompt(request));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError(t("mazoIa.clipboardFailed"));
    }
  }

  if (deck !== null) {
    return (
      <Page className="max-w-3xl">
        <PageHeader
          eyebrow={tr("mazoNuevo.eyebrow")}
          title={tr("mazoIa.reviewTitle")}
          description={tr("mazoIa.reviewDescription", {
            kept: kept.length,
            total: deck.cards.length,
          })}
        />
        <DeckReview
          studyMode={studyMode}
          deck={deck}
          kept={kept.length}
          dropped={dropped}
          onToggle={toggleDrop}
          title={title}
          onTitle={setTitle}
          description={description}
          onDescription={setDescription}
          visibility={visibility}
          onVisibility={setVisibility}
          error={error}
          saving={saving}
          busy={busy}
          onSave={handleSave}
          onDiscard={discardDeck}
          onRegenerate={handleGenerate}
          onCancel={() => controller.current?.abort()}
        />
      </Page>
    );
  }

  const visibleModels = searchModels(models ?? [], modelQuery).slice(
    0,
    VISIBLE_MODELS,
  );

  return (
    <Page className="max-w-3xl">
      <PageHeader
        eyebrow={tr("mazoNuevo.eyebrow")}
        title={tr("mazoIa.title")}
        description={tr("mazoIa.description")}
      />

      {error ? (
        <div className="mb-6">
          <Alert variant="error" title={tr("mazoIa.errorTitle")}>
            {error}
          </Alert>
        </div>
      ) : null}

      <div
        role="tablist"
        aria-label={tr("mazoIa.tabsLabel")}
        className="mb-6 flex flex-wrap gap-2"
      >
        <Button
          type="button"
          role="tab"
          aria-selected={mode === "generar"}
          variant={mode === "generar" ? "primary" : "secondary"}
          onClick={() => {
            setMode("generar");
            setError(null);
          }}
        >
          {tr("mazoIa.tabGenerate")}
        </Button>
        <Button
          type="button"
          role="tab"
          aria-selected={mode === "importar"}
          variant={mode === "importar" ? "primary" : "secondary"}
          onClick={() => {
            setMode("importar");
            setError(null);
          }}
        >
          {tr("mazoIa.tabImport")}
        </Button>
      </div>

      <div className="space-y-6">
        <Card as="section" className="space-y-5">
          <StudyModeField
            value={studyMode}
            onChange={setStudyMode}
            disabled={busy}
          />
          <div>
            <SectionTitle as="h3">{tr("mazoIa.stepConcept")}</SectionTitle>
            <p className="mt-1 text-sm text-ink-soft">
              {tr(
                studyMode === "general"
                  ? "general.aiConceptHint"
                  : "mazoIa.stepConceptBody",
              )}
            </p>
          </div>

          <Field
            label={tr("mazoIa.fieldConcept")}
            htmlFor="concept"
            required
            hint={tr("mazoIa.conceptHint")}
          >
            <Textarea
              id="concept"
              value={concept}
              onChange={(event) => setConcept(event.target.value)}
              placeholder={tr(
                studyMode === "general"
                  ? "general.aiConceptPlaceholder"
                  : "mazoIa.conceptPlaceholder",
              )}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label={tr("mazoIa.fieldCardCount")}
              htmlFor="cardCount"
              hint={tr("mazoIa.cardCountHint", {
                min: COUNT_MIN,
                max: COUNT_MAX,
              })}
            >
              <input
                id="cardCount"
                type="number"
                min={COUNT_MIN}
                max={COUNT_MAX}
                value={cardCount}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setCardCount(
                    Number.isFinite(next)
                      ? Math.min(COUNT_MAX, Math.max(COUNT_MIN, next))
                      : COUNT_MIN,
                  );
                }}
                className={inputClass}
              />
            </Field>

            <Field
              label={tr("mazoIa.fieldLevel")}
              htmlFor="level"
              hint={tr("mazoIa.levelHint")}
            >
              <Select
                id="level"
                value={level}
                onChange={(event) => setLevel(event.target.value)}
              >
                <option value="">{tr("mazoIa.levelUnspecified")}</option>
                {LEVELS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {tr(option.key)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label={tr(
                studyMode === "general"
                  ? "general.contentLanguage"
                  : "deckField.cardLanguage",
              )}
              htmlFor="source_language"
            >
              <Select
                id="source_language"
                value={sourceLanguage}
                onChange={(event) => setSourceLanguage(event.target.value)}
              >
                {languages.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.label}
                  </option>
                ))}
              </Select>
            </Field>

            {studyMode === "language" ? (
              <Field
                label={tr("deckField.translationLanguage")}
                htmlFor="target_language"
              >
                <Select
                  id="target_language"
                  value={targetLanguage}
                  onChange={(event) => setTargetLanguage(event.target.value)}
                >
                  {languages.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.label}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-paper-sunken px-4 py-3">
            <input
              type="checkbox"
              checked={withExtras}
              onChange={(event) => setWithExtras(event.target.checked)}
              className="mt-0.5 size-4 accent-[var(--brand)]"
            />
            <span className="text-sm text-ink">
              {tr(
                studyMode === "general"
                  ? "general.aiExtras"
                  : "mazoIa.extrasLabel",
              )}
              <span className="mt-0.5 block text-xs text-ink-faint">
                {tr("mazoIa.extrasHint")}
              </span>
            </span>
          </label>
        </Card>

        {mode === "generar" ? (
          <GeneratePanel
            model={model}
            onModel={setModel}
            models={models}
            modelsError={modelsError}
            loadingModels={loadingModels}
            onRetryModels={() => void loadModels()}
            modelQuery={modelQuery}
            onModelQuery={setModelQuery}
            visibleModels={visibleModels}
            keyReady={keyReady}
            busy={busy}
            canGenerate={canGenerate}
            onGenerate={handleGenerate}
            onCancel={() => controller.current?.abort()}
          />
        ) : (
          <ImportPanel
            concept={concept}
            hasConcept={hasConcept}
            prompt={buildStandalonePrompt(request)}
            copied={copied}
            onCopy={copyPrompt}
            imported={imported}
            onImported={setImported}
            canImport={canImport}
            onImport={handleImport}
          />
        )}
      </div>
    </Page>
  );
}

interface GeneratePanelProps {
  model: string;
  onModel: (value: string) => void;
  models: ModelInfo[] | null;
  modelsError: string | null;
  loadingModels: boolean;
  onRetryModels: () => void;
  modelQuery: string;
  onModelQuery: (value: string) => void;
  visibleModels: ModelInfo[];
  keyReady: boolean;
  busy: boolean;
  canGenerate: boolean;
  onGenerate: () => void;
  onCancel: () => void;
}

function GeneratePanel({
  model,
  onModel,
  models,
  modelsError,
  loadingModels,
  onRetryModels,
  modelQuery,
  onModelQuery,
  visibleModels,
  keyReady,
  busy,
  canGenerate,
  onGenerate,
  onCancel,
}: GeneratePanelProps) {
  const tr = useT();

  return (
    <Card as="section" className="space-y-5">
      <div>
        <SectionTitle as="h3">{tr("mazoIa.stepModel")}</SectionTitle>
        <p className="mt-1 text-sm text-ink-soft">
          {tr("mazoIa.stepModelBody")}
        </p>
      </div>

      <Field
        label={tr("mazoIa.fieldModel")}
        htmlFor="model"
        required
        hint={tr("mazoIa.modelHint")}
      >
        <input
          id="model"
          value={model}
          onChange={(event) => onModel(event.target.value)}
          className={inputClass}
          spellCheck={false}
          autoComplete="off"
        />
      </Field>

      {modelsError ? (
        <Alert variant="warning" title={tr("mazoIa.modelsErrorTitle")}>
          <p>{modelsError}</p>
          <p className="mt-1">
            <button
              type="button"
              onClick={onRetryModels}
              className="font-semibold underline"
            >
              {tr("mazoIa.retry")}
            </button>
          </p>
        </Alert>
      ) : null}

      {models !== null ? (
        <details className="rounded-lg border border-line bg-paper-sunken px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium text-ink">
            {tr("mazoIa.showModels", { count: models.length })}
          </summary>

          <div className="mt-3 space-y-2">
            <input
              type="search"
              value={modelQuery}
              onChange={(event) => onModelQuery(event.target.value)}
              placeholder={tr("mazoIa.filterModelsPlaceholder")}
              aria-label={tr("mazoIa.filterModelsLabel")}
              className={inputClass}
            />

            <ul className="max-h-64 space-y-0.5 overflow-y-auto">
              {visibleModels.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onModel(item.id);
                      onModelQuery("");
                    }}
                    className={cx(
                      "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm",
                      item.id === model
                        ? "bg-brand-muted font-medium text-brand-strong"
                        : "text-ink-soft hover:bg-paper-raised hover:text-ink",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {item.label}
                    </span>
                    {item.supportsJsonMode ? null : (
                      <span
                        className="shrink-0 text-[10px] text-ink-faint"
                        title={tr("mazoIa.noJsonTitle")}
                      >
                        {tr("mazoIa.noJson")}
                      </span>
                    )}
                  </button>
                </li>
              ))}

              {visibleModels.length === 0 ? (
                <li className="px-2.5 py-2 text-sm text-ink-faint">
                  {tr("mazoIa.noModelMatch", { query: modelQuery })}
                </li>
              ) : null}
            </ul>
          </div>
        </details>
      ) : loadingModels ? (
        <p className="text-sm text-ink-faint" role="status">
          {tr("mazoIa.loadingModels")}
        </p>
      ) : null}

      {!keyReady ? (
        <Alert variant="warning" title={tr("mazoIa.missingKeyTitle")}>
          <p>
            {tr("mazoIa.missingKeyBody")}{" "}
            <Link to="/ajustes/ia" className="font-semibold underline">
              {tr("mazoIa.addKey")}
            </Link>{" "}
            {tr("mazoIa.orGetIt")}{" "}
            <a
              href={PROVIDER.keyUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="font-semibold underline"
            >
              {tr("mazoIa.openRouterPanel")}
            </a>
            . {tr("mazoIa.importModeNote")}
          </p>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={onGenerate} disabled={!canGenerate}>
          {busy ? tr("mazoIa.generating") : tr("mazoIa.generateCards")}
        </Button>

        {busy ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {tr("common.cancel")}
          </Button>
        ) : null}

        {keyReady ? null : (
          <span className="text-sm text-ink-faint">
            {tr("mazoIa.hintAddKey")}
          </span>
        )}
      </div>

      {busy ? <Alert variant="info">{tr("mazoIa.busyNote")}</Alert> : null}
    </Card>
  );
}

interface ImportPanelProps {
  concept: string;
  hasConcept: boolean;
  prompt: string;
  copied: boolean;
  onCopy: () => void;
  imported: string;
  onImported: (value: string) => void;
  canImport: boolean;
  onImport: () => void;
}

function ImportPanel({
  hasConcept,
  prompt,
  copied,
  onCopy,
  imported,
  onImported,
  canImport,
  onImport,
}: ImportPanelProps) {
  const tr = useT();

  return (
    <Card as="section" className="space-y-5">
      <div>
        <SectionTitle as="h3">{tr("mazoIa.stepImport")}</SectionTitle>
        <p className="mt-1 text-sm text-ink-soft">
          {tr("mazoIa.stepImportBody")}
        </p>
      </div>

      <Alert variant="info">
        <ol className="list-decimal space-y-1 pl-4">
          <li>{tr("mazoIa.importStep1")}</li>
          <li>{tr("mazoIa.importStep2")}</li>
          {/* El tercer paso va en tres trozos porque lleva un `<strong>` en
              medio, y el marcado no se puede meter en una clave de traducción. */}
          <li>
            {tr("mazoIa.importStep3Lead")}{" "}
            <strong>{tr("mazoIa.importStep3Strong")}</strong>{" "}
            {tr("mazoIa.importStep3Tail")}
          </li>
        </ol>
      </Alert>

      <Textarea
        readOnly
        rows={10}
        aria-label={tr("mazoIa.promptLabel")}
        value={prompt}
        className="font-mono text-xs"
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" onClick={onCopy}>
          {copied ? tr("mazoIa.copied") : tr("mazoIa.copyPrompt")}
        </Button>
        {hasConcept ? null : (
          <span className="text-sm text-ink-faint">
            {tr("mazoIa.conceptNeeded")}
          </span>
        )}
      </div>

      <Field
        label={tr("mazoIa.fieldAssistant")}
        htmlFor="imported"
        hint={tr("mazoIa.fieldAssistantHint")}
      >
        <Textarea
          id="imported"
          value={imported}
          onChange={(event) => onImported(event.target.value)}
          placeholder='{ "title": "Reuniones de trabajo", "cards": [ … ] }'
          className="font-mono text-xs"
        />
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={onImport} disabled={!canImport}>
          {tr("mazoIa.readCards")}
        </Button>
        {imported.trim() !== "" ? (
          <Button type="button" variant="ghost" onClick={() => onImported("")}>
            {tr("explorar.clear")}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
