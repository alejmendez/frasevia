import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { useAuth } from "~/lib/auth-context";
import { cardCountLabel } from "~/lib/format";
import { useT } from "~/lib/locale-context";
import type { Deck } from "~/lib/types";
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
 * El esqueleto de la página de un mazo público.
 */

export function PublicDeckSkeleton({ deck }: { deck?: Deck }) {
  const tr = useT();
  const { status } = useAuth();
  return (
    <Page>
      <p className="mb-4 text-sm text-ink-soft">
        {tr("mazoPublico.backToExplore")}
      </p>
      <header>
        <div className="mb-2 flex flex-wrap gap-2">
          {deck ? (
            <>
              {deck.is_official ? (
                <Tag tone="brand">{tr("biblioteca.official")}</Tag>
              ) : null}
              {deck.level ? <Tag tone="accent">{deck.level}</Tag> : null}
              <Tag>{tr(`studyMode.${deck.study_mode}`)}</Tag>
              {deck.study_mode === "language" ? (
                <Tag>
                  {deck.source_language} → {deck.target_language}
                </Tag>
              ) : null}
            </>
          ) : (
            <>
              <Placeholder className="h-6 w-20 rounded-full" />
              <Placeholder className="h-6 w-14 rounded-full" />
              <Placeholder className="h-6 w-28 rounded-full" />
            </>
          )}
        </div>
        {deck ? (
          <>
            <h1 className="font-display text-3xl leading-tight text-ink sm:text-4xl">
              {deck.title}
            </h1>
            {deck.description ? (
              <p className="mt-3 max-w-2xl text-ink-soft">{deck.description}</p>
            ) : null}
            <p className="mt-3 text-sm text-ink-faint">
              {cardCountLabel(deck.card_count)}
            </p>
          </>
        ) : (
          <>
            <Placeholder className="h-9 w-96 max-w-full sm:h-11" />
            <div className="mt-3 max-w-2xl">
              <TextLines />
            </div>
            <Placeholder className="mt-3 h-5 w-48" />
          </>
        )}
      </header>
      <div className="mt-8 flex flex-wrap items-center gap-3 border-y border-line py-6">
        {status === "anonymous" ? (
          <>
            <p className="text-sm text-ink-soft">
              {tr("mazoPublico.createPrompt")}
            </p>
            <SkeletonButton>{tr("mazoPublico.createAccount")}</SkeletonButton>
            <SkeletonButton variant="ghost">
              {tr("mazoPublico.alreadyAccount")}
            </SkeletonButton>
          </>
        ) : (
          <>
            <SkeletonButton>{tr("mazoPublico.copyToLibrary")}</SkeletonButton>
            <SkeletonButton variant="secondary">
              {tr("mazoPublico.studyNow")}
            </SkeletonButton>
            <p className="text-xs text-ink-faint">
              {tr("mazoPublico.copyNote")}
            </p>
          </>
        )}
      </div>
      <section className="mt-10">
        <h2 className="font-display text-xl text-ink">
          {tr("mazoPublico.previewTitle")}
        </h2>
        <ul className="mt-5 grid gap-4 md:grid-cols-2">
          {ITEMS.map((item) => (
            <li key={item}>
              <Card className="h-full">
                <Placeholder className="mb-2 h-4 w-20" />
                <Placeholder className="h-7 w-2/3" />
                <Placeholder className="mt-1.5 h-6 w-4/5" />
                <div className="mt-3 border-t border-line pt-3">
                  <TextLines />
                </div>
                <Placeholder className="mt-3 h-4 w-3/4" />
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </Page>
  );
}
