import { useT } from "~/lib/locale-context";
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
 * Los esqueletos de las dos pantallas de ajustes.
 *
 * Son casi el mismo formulario —una lista de filas con un par de campos cada una—
 * y por eso comparten las piezas de arriba.
 */

export function ReviewSettingsSkeleton() {
  const tr = useT();
  return (
    <Page>
      <PageHeader
        eyebrow={tr("ajustesRepaso.eyebrow")}
        title={tr("ajustesRepaso.title")}
        description={tr("ajustesRepaso.description")}
        actions={
          <SkeletonButton variant="secondary">
            {tr("ajustesRepaso.backLibrary")}
          </SkeletonButton>
        }
      />
      <div className="grid items-start gap-6 xl:grid-cols-[1.65fr_0.85fr]">
        <Card as="section" className="p-5 sm:p-7">
          <div className="mb-5 border-b border-line pb-4">
            <h2 className="font-display text-2xl text-brand">
              {tr("ajustesRepaso.levelsTitle")}
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              {tr("ajustesRepaso.levelsHint")}
            </p>
          </div>
          <ol className="divide-y divide-line">
            {ITEMS.map((item) => (
              <li
                key={item}
                className="grid gap-4 py-5 lg:grid-cols-[auto_1fr_1fr_auto] lg:items-start"
              >
                <div className="flex items-center gap-2 lg:pt-7">
                  <Placeholder className="size-7 rounded-full" />
                  <Placeholder className="h-18 w-9" />
                </div>
                <div className="space-y-4">
                  <SkeletonField label={tr("ajustesRepaso.name")} />
                  <SkeletonField label={tr("ajustesRepaso.action")} />
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-[minmax(5rem,0.55fr)_1fr] gap-2">
                    <SkeletonField label={tr("ajustesRepaso.amount")} />
                    <SkeletonField label={tr("ajustesRepaso.unit")} />
                  </div>
                  <SkeletonField label={tr("ajustesRepaso.color")} />
                </div>
                <Placeholder className="h-11 w-24 lg:mt-7" />
              </li>
            ))}
          </ol>
          <div className="mt-5 border-t border-line pt-5">
            <SkeletonButton variant="secondary" className="min-h-11">
              {tr("ajustesRepaso.addLevel")}
            </SkeletonButton>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <SkeletonButton className="min-h-12">
              {tr("ajustesRepaso.save")}
            </SkeletonButton>
            <SkeletonButton variant="secondary" className="min-h-12">
              {tr("ajustesRepaso.reset")}
            </SkeletonButton>
          </div>
        </Card>
        <div className="space-y-6">
          <Card as="section" className="paper-card p-5 sm:p-6">
            <span className="paper-tape" />
            <h2 className="font-display text-2xl text-brand">
              {tr("ajustesRepaso.previewTitle")}
            </h2>
            <div className="mt-4 space-y-2.5">
              {ITEMS.map((item) => (
                <div
                  key={item}
                  className="flex min-h-14 items-center gap-3 rounded-xl border border-line px-4 py-2"
                >
                  <Placeholder className="size-6 rounded-full" />
                  <Placeholder className="h-4 w-24" />
                  <Placeholder className="ml-auto h-4 w-16" />
                </div>
              ))}
            </div>
          </Card>
          <Card as="section" className="p-5 sm:p-6">
            <h2 className="font-display text-2xl text-brand">
              {tr("ajustesRepaso.retiredTitle")}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              {tr("ajustesRepaso.retiredDescription")}
            </p>
            <div className="mt-4">
              <TextLines />
            </div>
          </Card>
        </div>
      </div>
    </Page>
  );
}

export function AiSettingsSkeleton() {
  const tr = useT();
  return (
    <Page className="max-w-2xl">
      <PageHeader
        eyebrow={tr("ajustesIa.eyebrow")}
        title={tr("ajustesIa.title")}
        description={tr("ajustesIa.description")}
      />
      <div className="rounded-lg border border-brand/25 bg-brand-muted p-4">
        <p className="font-medium text-brand-strong">
          {tr("ajustesIa.noKeyTitle")}
        </p>
        <div className="mt-1">
          <TextLines />
        </div>
      </div>
      <Card as="section" className="mt-8 space-y-4">
        <div>
          <h3 className="font-display text-xl text-ink">OpenRouter</h3>
          <p className="mt-1 text-sm text-ink-soft">{tr("provider.blurb")}</p>
        </div>
        <SkeletonField
          label={tr("provider.keyName")}
          hint={tr("ajustesIa.keyHint")}
        />
        <div className="flex flex-wrap items-center gap-2">
          <SkeletonButton variant="secondary">
            {tr("ajustesIa.forget")}
          </SkeletonButton>
          <span className="text-sm text-brand">{tr("ajustesIa.getKey")}</span>
        </div>
        <p className="rounded-lg bg-paper-sunken px-3 py-2.5 text-xs leading-relaxed text-ink-soft">
          <strong className="font-semibold text-ink">
            {tr("ajustesIa.scopingTitle")}
          </strong>{" "}
          {tr("provider.scoping")}
        </p>
      </Card>
      <div className="mt-6 rounded-card border border-line bg-paper-sunken px-5 py-5">
        <h3 className="font-display text-xl text-ink">
          {tr("ajustesIa.eraseTitle")}
        </h3>
        <Placeholder className="mt-2 h-4 w-4/5 bg-line" />
        <div className="mt-4">
          <SkeletonButton variant="secondary">
            {tr("ajustesIa.forgetKey")}
          </SkeletonButton>
        </div>
      </div>
      <div className="mt-6 rounded-lg border border-accent/25 bg-accent-muted p-4">
        <p className="font-medium text-accent">{tr("ajustesIa.whyTitle")}</p>
        <div className="mt-2 space-y-2">
          <TextLines />
          <TextLines />
        </div>
      </div>
    </Page>
  );
}
