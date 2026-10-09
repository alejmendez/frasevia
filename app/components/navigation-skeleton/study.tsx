import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { useT } from "~/lib/locale-context";
import type { Deck } from "~/lib/types";
import {
  Control,
  cx,
  ITEMS,
  Page,
  Placeholder,
  SkeletonButton,
} from "./primitives";

/**
 * El esqueleto de la pantalla de estudio.
 *
 * Con identificador de mazo la sesión es de ese mazo; sin él, es la cola global,
 * que enseña los niveles de puntuación y nada más. La diferencia se nota, así que
 * no se puede enseñar lo mismo en los dos casos.
 */

export function StudySkeleton({
  deckSession,
  deck,
}: {
  deckSession: boolean;
  deck?: Deck;
}) {
  const tr = useT();
  const general = deck?.study_mode === "general";
  return (
    <Page>
      <p className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm text-brand">
        <ArrowLeftIcon size={18} />
        {tr("estudiar.backLibrary")}
      </p>
      <header className="mb-7">
        {deck ? (
          <p className="text-sm font-medium text-ink-soft">{deck.title}</p>
        ) : deckSession ? (
          <Placeholder className="h-5 w-56" />
        ) : (
          <p className="text-sm font-medium text-ink-soft">
            {tr("estudiar.pendingTitle")}
          </p>
        )}
        <h1 className="mt-2 font-display text-4xl leading-tight text-brand sm:text-5xl">
          {tr("estudiar.recallTitle")}
        </h1>
        <p className="mt-2 text-ink-soft">{tr("estudiar.recallSubtitle")}</p>
      </header>
      <section className="mx-auto max-w-6xl">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="order-2 min-w-0 lg:order-1">
            <div className="mb-3 flex items-center justify-between gap-4">
              <Placeholder className="h-5 w-24" />
              <Placeholder className="h-5 w-20" />
            </div>
            <Placeholder className="h-1.5 w-full rounded-full" />
            <div className="paper-card mt-7 p-7 sm:p-10">
              <span className="paper-tape" />
              <div className="paper-card__margin min-h-80 pl-6 sm:pl-9">
                <Placeholder className="h-4 w-24" />
                <Placeholder
                  className={cx(
                    "mt-8 w-4/5",
                    general ? "h-9 sm:h-14" : "h-14 sm:h-20",
                  )}
                />
                {general ? null : (
                  <div className="mt-3 flex gap-2">
                    <Placeholder className="h-10 w-28" />
                    <Placeholder className="h-10 w-24" />
                  </div>
                )}
                <p className="handwritten mt-8 text-xl text-ink-soft sm:text-2xl">
                  {tr(general ? "general.recallHint" : "estudiar.recallHint")}
                </p>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <SkeletonButton className="min-h-14 min-w-56 px-7">
                {tr("estudiar.reveal")}
              </SkeletonButton>
              <span className="text-sm text-ink-faint">
                <kbd className="rounded border border-line-strong bg-paper-raised px-2 py-1 font-sans text-xs">
                  Space
                </kbd>{" "}
                {tr("estudiar.toFlip")}
              </span>
            </div>
          </div>
          <aside className="order-1 rounded-card border border-line bg-paper-raised/80 p-4 lg:order-2">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-xl text-brand">
                {tr(
                  deckSession
                    ? "estudiar.deckQueueTitle"
                    : "estudiar.queueTitle",
                )}
              </h2>
              <Placeholder className="h-3 w-8" />
            </div>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">
              {tr(
                deckSession ? "estudiar.deckQueueHint" : "estudiar.queueHint",
              )}
            </p>
            <ol className="mt-3 max-h-60 space-y-1 overflow-hidden pr-1 lg:max-h-none">
              {ITEMS.map((item) => (
                <li
                  key={item}
                  className="flex min-h-14 items-center gap-2 rounded-lg border border-line px-2 py-2"
                >
                  <Placeholder className="h-3 w-6 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Placeholder className="h-3 w-full" />
                    <Placeholder className="h-3 w-2/3" />
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </div>
        <div className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-brand">
                {tr("estudiar.ratingQuestion")}
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                {tr("estudiar.ratingTimingHint")}
              </p>
            </div>
            <span className="text-sm text-ink-soft">
              {tr("biblioteca.reviewSettings")}
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ITEMS.slice(0, 4).map((item) => (
              <Control key={item} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    </Page>
  );
}
