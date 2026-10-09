import { useT } from "~/lib/locale-context";
import type { Deck, DeckStudyMode } from "~/lib/types";
import {
  buttonClass,
  Card,
  Control,
  cx,
  DeckTiles,
  ITEMS,
  ModeOptions,
  Page,
  PageHeader,
  Placeholder,
  SkeletonButton,
  SkeletonField,
  Tag,
  TextLines,
} from "./primitives";

/**
 * Los esqueletos de los tres formularios de mazo: crear, editar y generar con IA.
 *
 * Los tres piden casi lo mismo, y el que genera con IA además enseña un selector
 * de modelo. Compartir el bloque de los campos de una tarjeta es lo que hace que
 * los tres formularios se parezcan de verdad, que es el objetivo: el esqueleto
 * tiene que parecerse a lo que va a aparecer.
 */

function DeckFields({
  editing = false,
  studyMode,
}: {
  editing?: boolean;
  studyMode?: DeckStudyMode;
}) {
  const tr = useT();
  const general = studyMode === "general";
  return (
    <>
      <ModeOptions value={studyMode} />
      <div>
        <SkeletonField label={tr("deckField.title")} required />
        {editing ? <Placeholder className="mt-1.5 h-4 w-56" /> : null}
      </div>
      <SkeletonField
        label={tr("deckField.description")}
        hint={tr(
          editing
            ? "deckField.descriptionHintPublic"
            : "deckField.descriptionHint",
        )}
        multiline
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <SkeletonField
          label={tr(
            general ? "general.contentLanguage" : "deckField.sourceLanguage",
          )}
        />
        {general ? null : (
          <SkeletonField label={tr("deckField.targetLanguage")} />
        )}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <SkeletonField
          label={tr("deckField.level")}
          hint={tr(general ? "general.levelHint" : "deckField.levelHint")}
        />
        <SkeletonField label={tr("deckField.visibility")} />
      </div>
    </>
  );
}

export function DeckFormSkeleton({
  editing = false,
  deck,
}: {
  editing?: boolean;
  deck?: Deck;
}) {
  const tr = useT();
  const studyMode = editing ? deck?.study_mode : "language";
  const general = studyMode === "general";
  return (
    <Page className={editing ? undefined : "max-w-2xl"}>
      <PageHeader
        eyebrow={tr("mazoNuevo.eyebrow")}
        title={
          deck ? (
            deck.title
          ) : editing ? (
            <Placeholder className="h-9 w-80 max-w-full sm:h-11" />
          ) : (
            tr("mazoNuevo.title")
          )
        }
        description={
          deck ? (
            <span className="text-sm">/mazos/{deck.slug}</span>
          ) : editing ? (
            <Placeholder className="h-5 w-56" />
          ) : (
            tr("mazoNuevo.description")
          )
        }
        actions={
          <>
            <SkeletonButton variant="secondary">
              {tr(editing ? "biblioteca.study" : "biblioteca.createWithAi")}
            </SkeletonButton>
            {editing && deck?.visibility === "public" ? (
              <SkeletonButton variant="ghost">
                {tr("mazoEditar.publicPage")}
              </SkeletonButton>
            ) : null}
          </>
        }
      />
      {editing ? (
        <h2 className="font-display text-xl text-ink">
          {tr("mazoEditar.deckData")}
        </h2>
      ) : null}
      <div className={editing ? "mt-4 space-y-5" : "space-y-6"}>
        <DeckFields editing={editing} studyMode={studyMode} />
        {editing ? null : (
          <SkeletonField
            label={tr("deckField.seed")}
            hint={tr("deckField.seedHint")}
            multiline
          />
        )}
        <div className="flex flex-wrap items-center gap-3">
          <SkeletonButton>
            {tr(editing ? "mazoEditar.saveDeck" : "mazoNuevo.submit")}
          </SkeletonButton>
          {editing ? null : (
            <SkeletonButton variant="secondary">
              {tr("mazoNuevo.orCreateWithAi")}
            </SkeletonButton>
          )}
        </div>
      </div>
      {editing && !deck?.is_official ? (
        <section className="mt-10">
          <Placeholder className="h-7 w-40" />
          <div className="mt-4 rounded-card border border-line bg-paper-sunken/50 p-5">
            <h3 className="text-sm font-semibold text-ink">
              {tr("mazoEditar.addCardTitle")}
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <SkeletonField
                label={tr(general ? "general.front" : "mazoEditar.fieldTerm")}
                required
                multiline
              />
              <SkeletonField
                label={tr(general ? "general.back" : "mazoEditar.fieldMeaning")}
                required
                multiline
              />
              <SkeletonField label={tr("mazoEditar.fieldKind")} />
              <SkeletonField
                label={tr("mazoEditar.fieldTags")}
                hint={tr("mazoEditar.tagsHint")}
              />
            </div>
            <div className="mt-4 grid gap-4">
              <SkeletonField
                label={tr(
                  general ? "general.example" : "mazoEditar.fieldExampleEn",
                )}
              />
              {general ? null : (
                <SkeletonField label={tr("mazoEditar.fieldExampleEs")} />
              )}
              <SkeletonField
                label={tr(
                  general ? "general.note" : "mazoEditar.fieldUsageNote",
                )}
              />
            </div>
            <div className="mt-4">
              <SkeletonButton>{tr("mazoEditar.addCardSubmit")}</SkeletonButton>
            </div>
          </div>
        </section>
      ) : null}
    </Page>
  );
}

export function AiDeckSkeleton() {
  const tr = useT();
  return (
    <Page className="max-w-3xl">
      <PageHeader
        eyebrow={tr("mazoNuevo.eyebrow")}
        title={tr("mazoIa.title")}
        description={tr("mazoIa.description")}
      />
      <div className="mb-6 flex flex-wrap gap-2">
        <SkeletonButton>{tr("mazoIa.tabGenerate")}</SkeletonButton>
        <SkeletonButton variant="secondary">
          {tr("mazoIa.tabImport")}
        </SkeletonButton>
      </div>
      <div className="space-y-6">
        <Card as="section" className="space-y-5">
          <ModeOptions value="language" />
          <div>
            <h3 className="font-display text-xl text-ink">
              {tr("mazoIa.stepConcept")}
            </h3>
            <p className="mt-1 text-sm text-ink-soft">
              {tr("mazoIa.stepConceptBody")}
            </p>
          </div>
          <SkeletonField
            label={tr("mazoIa.fieldConcept")}
            hint={tr("mazoIa.conceptHint")}
            required
            multiline
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <SkeletonField
              label={tr("mazoIa.fieldCardCount")}
              hint={tr("mazoIa.cardCountHint", { min: 4, max: 40 })}
            />
            <SkeletonField
              label={tr("mazoIa.fieldLevel")}
              hint={tr("mazoIa.levelHint")}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <SkeletonField label={tr("deckField.cardLanguage")} />
            <SkeletonField label={tr("deckField.translationLanguage")} />
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-line bg-paper-sunken px-4 py-3">
            <Placeholder className="mt-0.5 size-4 shrink-0 bg-line-strong" />
            <div className="text-sm text-ink">
              {tr("mazoIa.extrasLabel")}
              <p className="mt-0.5 text-xs text-ink-faint">
                {tr("mazoIa.extrasHint")}
              </p>
            </div>
          </div>
        </Card>
        <Card as="section" className="space-y-5">
          <div>
            <h3 className="font-display text-xl text-ink">
              {tr("mazoIa.stepModel")}
            </h3>
            <p className="mt-1 text-sm text-ink-soft">
              {tr("mazoIa.stepModelBody")}
            </p>
          </div>
          <SkeletonField
            label={tr("mazoIa.fieldModel")}
            hint={tr("mazoIa.modelHint")}
            required
          />
        </Card>
      </div>
    </Page>
  );
}
