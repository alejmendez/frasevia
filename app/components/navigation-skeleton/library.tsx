import {
  CalendarDotsIcon,
  MagnifyingGlassIcon,
  SparkleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useT } from "~/lib/locale-context";
import {
  Card,
  Control,
  cx,
  DeckTiles,
  ITEMS,
  Page,
  PageHeader,
  Placeholder,
  SkeletonButton,
} from "./primitives";

/**
 * Los esqueletos de las tres pantallas de listado: explorar, la biblioteca y el
 * progreso.
 *
 * Los tres se parecen mucho: una cabecera, un filtro o un resumen y una rejilla de
 * tarjetas. Por eso van juntos y no en tres archivos de veinte líneas cada uno.
 */

export function ExploreSkeleton({ search }: { search: string }) {
  const tr = useT();
  const params = new URLSearchParams(search);
  return (
    <Page>
      <PageHeader
        eyebrow={tr("explorar.eyebrow")}
        title={tr("explorar.title")}
        description={tr("explorar.description")}
      />
      <div className="mb-8 flex flex-wrap gap-2">
        <Control className="w-40" />
        <Control className="min-w-40 flex-1" />
        <SkeletonButton>{tr("explorar.searchButton")}</SkeletonButton>
        {params.has("q") || params.has("tipo") ? (
          <SkeletonButton variant="ghost">
            {tr("explorar.clear")}
          </SkeletonButton>
        ) : null}
      </div>
      <DeckTiles />
    </Page>
  );
}

export function LibrarySkeleton() {
  const tr = useT();
  return (
    <Page>
      <PageHeader
        eyebrow={tr("biblioteca.eyebrow")}
        title={tr("biblioteca.title")}
        description={tr("biblioteca.description")}
        actions={
          <>
            <SkeletonButton variant="secondary">
              <SparkleIcon size={17} />
              {tr("biblioteca.createWithAi")}
            </SkeletonButton>
            <SkeletonButton>{tr("biblioteca.createDeck")}</SkeletonButton>
          </>
        }
      />
      <section className="mb-10 grid gap-4 lg:grid-cols-[1.55fr_0.95fr]">
        <div className="relative overflow-hidden rounded-2xl bg-brand px-6 py-7 text-on-solid shadow-[0_20px_38px_-28px_var(--color-brand)] sm:px-9 sm:py-9">
          <p className="text-xs font-semibold tracking-[0.17em] text-[#f3bba4] uppercase">
            {tr("biblioteca.todayReview")}
          </p>
          <Placeholder className="mt-3 h-9 w-4/5 bg-on-solid/20 sm:h-11" />
          <div className="mt-2 max-w-xl space-y-2 py-1">
            <Placeholder className="h-4 w-full bg-on-solid/20" />
            <Placeholder className="h-4 w-2/3 bg-on-solid/20" />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Placeholder className="h-12 w-44 bg-on-solid/20" />
            <SkeletonButton variant="ghost" className="min-h-12 text-on-solid">
              {tr("biblioteca.reviewSettings")}
            </SkeletonButton>
          </div>
        </div>
        <Card as="section" className="p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <CalendarDotsIcon size={21} className="text-brand" />
            <h2 className="font-display text-2xl text-brand">
              {tr("biblioteca.upcomingReviews")}
            </h2>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {ITEMS.slice(0, 3).map((item) => (
              <li key={item} className="flex min-h-14 items-center gap-3 py-2">
                <Placeholder className="size-9 shrink-0 rounded-full" />
                <Placeholder className="h-4 w-24" />
                <Placeholder className="ml-auto h-3 w-16" />
              </li>
            ))}
          </ul>
        </Card>
      </section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-brand">
            {tr("biblioteca.myDecks")}
          </h2>
          <Placeholder className="mt-2 h-3 w-28" />
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <Control className="w-40" />
          <div className="relative min-w-56 flex-1 sm:w-64 sm:flex-none">
            <MagnifyingGlassIcon
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <Control className="pl-10" />
          </div>
          <div className="flex flex-wrap gap-1 rounded-xl border border-line p-1">
            {(["all", "private", "public"] as const).map((filter) => (
              <span
                key={filter}
                className="flex min-h-9 items-center px-3 text-sm text-ink-soft"
              >
                {tr(`biblioteca.filter.${filter}`)}
              </span>
            ))}
          </div>
        </div>
      </div>
      <DeckTiles library />
      <p className="mt-10 border-t border-line pt-5 text-sm text-brand">
        {tr("biblioteca.exploreCommunity")}
      </p>
    </Page>
  );
}

export function ProgressSkeleton() {
  const tr = useT();
  const stats = [
    "progreso.statPracticed",
    "progreso.statLearned",
    "progreso.statLearning",
    "progreso.statLastSession",
  ] as const;
  return (
    <Page>
      <PageHeader
        eyebrow={tr("progreso.eyebrow")}
        title={tr("progreso.title")}
        description={tr("progreso.description")}
        actions={<SkeletonButton>{tr("progreso.goLibrary")}</SkeletonButton>}
      />
      <div className="space-y-8">
        <Card>
          <dl className="grid gap-5 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat}>
                <dt className="text-xs tracking-wide text-ink-faint uppercase">
                  {tr(stat)}
                </dt>
                <dd>
                  <Placeholder
                    className={cx(
                      "mt-1",
                      stat === "progreso.statLastSession"
                        ? "h-6 w-32"
                        : "h-8 w-12",
                    )}
                  />
                </dd>
              </div>
            ))}
          </dl>
          <Placeholder className="mt-6 h-1.5 w-full rounded-full" />
        </Card>
        <section>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <Placeholder className="h-7 w-56" />
            <span className="text-sm text-brand">
              {tr("progreso.keepPracticing")}
            </span>
          </div>
          <div className="mb-4">
            <Placeholder className="h-1.5 w-full rounded-full" />
            <Placeholder className="mt-1.5 h-4 w-40" />
          </div>
          <ul className="space-y-2">
            {ITEMS.map((item) => (
              <li key={item}>
                <Card className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="space-y-2 py-1">
                    <Placeholder className="h-4 w-48" />
                    <Placeholder className="h-3 w-36" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Placeholder className="h-3 w-12" />
                    <Placeholder className="h-3 w-24" />
                    <Placeholder className="h-6 w-20 rounded-full" />
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Page>
  );
}
