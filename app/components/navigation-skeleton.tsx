import {
  ArrowLeftIcon,
  BooksIcon,
  CalendarDotsIcon,
  MagnifyingGlassIcon,
  SparkleIcon,
  TranslateIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";
import { matchPath, useMatches } from "react-router";
import { buttonClass, Card, cx, Page, PageHeader, Tag } from "~/components/ui";
import { useAuth } from "~/lib/auth-context";
import { cardCountLabel } from "~/lib/format";
import { useT } from "~/lib/locale-context";
import type { Deck, DeckStudyMode } from "~/lib/types";

// Las listas conservan seis marcadores; su longitud real depende de los datos.
const ITEMS = ["one", "two", "three", "four", "five", "six"] as const;

function Placeholder({ className }: { className: string }) {
  return <div className={cx("skeleton-placeholder rounded-md", className)} />;
}

function TextLines() {
  return (
    <div className="space-y-2 py-1">
      <Placeholder className="h-3 w-full" />
      <Placeholder className="h-3 w-4/5" />
    </div>
  );
}

function Control({ className }: { className?: string }) {
  return (
    <div
      className={cx(
        "flex h-11.5 items-center rounded-lg border border-line-strong bg-paper-raised px-3",
        className,
      )}
    >
      <Placeholder className="h-4 w-2/3" />
    </div>
  );
}

function SkeletonButton({
  children,
  variant = "primary",
  className,
}: {
  children: ReactNode;
  variant?: Parameters<typeof buttonClass>[0];
  className?: string;
}) {
  return (
    <span className={cx(buttonClass(variant), "opacity-60", className)}>
      {children}
    </span>
  );
}

function SkeletonField({
  label,
  hint,
  multiline = false,
  required = false,
}: {
  label: string;
  hint?: string;
  multiline?: boolean;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-ink">
        {label}
        {required ? <span className="ml-1 text-accent">*</span> : null}
      </p>
      {hint ? <p className="text-xs text-ink-faint">{hint}</p> : null}
      {multiline ? (
        <div className="min-h-24 rounded-lg border border-line-strong bg-paper-raised px-3 py-2.5">
          <TextLines />
        </div>
      ) : (
        <Control />
      )}
    </div>
  );
}

function ModeOptions({ value }: { value?: DeckStudyMode }) {
  const tr = useT();
  return (
    <div>
      <p className="mb-3 text-sm font-medium text-ink">
        {tr("studyMode.label")}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {(["language", "general"] as const).map((mode) => {
          const Icon = mode === "language" ? TranslateIcon : BooksIcon;
          return (
            <div
              key={mode}
              className={cx(
                "flex items-start gap-3 rounded-card border p-4",
                value === mode
                  ? "border-brand bg-brand-muted/40"
                  : "border-line bg-paper-raised",
              )}
            >
              <Placeholder className="mt-1 size-4 shrink-0 rounded-full" />
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-medium text-brand">
                  <Icon size={20} />
                  {tr(`studyMode.${mode}`)}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  {tr(`studyMode.${mode}Hint`)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DeckTiles({ library = false }: { library?: boolean }) {
  const tr = useT();
  return (
    <ul
      className={
        library
          ? "grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
          : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      }
    >
      {ITEMS.map((item) => (
        <li key={item} className={cx("flex", library && "pt-2")}>
          <Card
            as="article"
            className="deck-stack-card flex h-full w-full flex-col gap-3 [--deck-tab-color:var(--color-paper-sunken)]"
          >
            <Placeholder className="my-0.5 h-5 w-3/4" />
            <TextLines />
            <div className="mt-auto flex flex-wrap gap-3 pt-1">
              <Placeholder className="h-3 w-16" />
              <Placeholder className="h-3 w-24" />
              <Placeholder className="h-3 w-20" />
            </div>
            {library ? (
              <div className="space-y-3 border-t border-line pt-3">
                <div className="flex flex-wrap gap-3">
                  {["due", "new", "scheduled"].map((stat) => (
                    <Placeholder key={stat} className="h-3 w-20" />
                  ))}
                </div>
                <Placeholder className="h-3 w-40" />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Placeholder className="h-11 w-36 rounded-lg" />
                  <div className="flex items-center gap-2">
                    <Placeholder className="h-6 w-16 rounded-full" />
                    <span className="inline-flex min-h-11 items-center px-2 text-sm text-brand">
                      {tr("biblioteca.edit")}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <Placeholder className="h-3 w-28" />
            )}
          </Card>
        </li>
      ))}
    </ul>
  );
}

function ExploreSkeleton({ search }: { search: string }) {
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

function LibrarySkeleton() {
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

function ProgressSkeleton() {
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

function PublicDeckSkeleton({ deck }: { deck?: Deck }) {
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

function StudySkeleton({
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

function AuthSkeleton({ kind }: { kind: "signIn" | "signUp" | "reset" }) {
  const tr = useT();
  const { status } = useAuth();
  const recovery = kind === "reset" && status === "authenticated";
  const title =
    kind === "reset"
      ? tr(recovery ? "reset.newTitle" : "reset.title")
      : tr(`${kind}.title`);
  const description =
    kind === "reset"
      ? tr(recovery ? "reset.newBody" : "reset.body")
      : tr(`${kind}.description`);
  return (
    <Page className="max-w-md">
      <h1 className="font-display text-3xl text-ink">{title}</h1>
      <p className="mt-2 text-ink-soft">{description}</p>
      <div className={cx("space-y-5", kind === "reset" ? "mt-6" : "mt-8")}>
        <SkeletonField
          label={tr(recovery ? "reset.fieldNewPassword" : "signIn.fieldEmail")}
          hint={recovery ? tr("signUp.passwordHint") : undefined}
          required
        />
        {kind !== "reset" ? (
          <SkeletonField
            label={tr("signIn.fieldPassword")}
            hint={kind === "signUp" ? tr("signUp.passwordHint") : undefined}
            required
          />
        ) : null}
        <SkeletonButton className="w-full">
          {kind === "reset"
            ? tr(recovery ? "reset.savePassword" : "reset.sendLink")
            : kind === "signUp"
              ? tr("signUp.submit")
              : title}
        </SkeletonButton>
      </div>
      {kind !== "reset" ? (
        <div className="mt-6">
          <div className="flex items-center gap-3 text-xs text-ink-faint">
            <span className="h-px flex-1 bg-line" />
            {tr("google.divider")}
            <span className="h-px flex-1 bg-line" />
          </div>
          <Placeholder className="mt-4 h-10 w-full rounded-lg" />
          <p className="mt-3 text-xs text-ink-faint">{tr("google.privacy")}</p>
        </div>
      ) : null}
      <div className="mt-6 space-y-2 text-sm text-ink-soft">
        {kind === "signIn" ? (
          <>
            <p className="text-brand">{tr("signIn.forgot")}</p>
            <p>
              {tr("signIn.noAccountYet")}{" "}
              <span className="text-brand">{tr("signIn.createOne")}</span>
            </p>
          </>
        ) : kind === "signUp" ? (
          <p>
            {tr("signUp.haveAccount")}{" "}
            <span className="text-brand">{tr("signUp.signInLink")}</span>
          </p>
        ) : (
          <p className="text-brand">{tr("reset.backToSignIn")}</p>
        )}
      </div>
    </Page>
  );
}

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

function DeckFormSkeleton({
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

function AiDeckSkeleton() {
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

function ReviewSettingsSkeleton() {
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

function AiSettingsSkeleton() {
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

/** El pathname llega sin basename, igual que los patrones de app/routes.ts. */
export function NavigationSkeleton({
  label,
  pathname,
  search = "",
}: {
  label: string;
  pathname: string;
  search?: string;
}) {
  const matches = useMatches();
  const publicMatch = matchPath("/mazos/:slug", pathname);
  const editMatch = matchPath("/biblioteca/mazos/:id/editar", pathname);
  const studyMatch = matchPath("/estudiar/:deckId?", pathname);
  const targetId = editMatch?.params.id ?? studyMatch?.params.deckId;
  const targetSlug = publicMatch?.params.slug;
  // Al venir de un listado o de un mazo, su cabecera ya se conoce. Reutilizar
  // esos datos también permite reservar los campos propios del modo general.
  const deck = matches
    .flatMap(({ loaderData }) => {
      const routeData = loaderData as
        | { deck?: Deck | null; decks?: Deck[] }
        | undefined;
      return routeData?.decks ?? (routeData?.deck ? [routeData.deck] : []);
    })
    .find((candidate) =>
      targetId
        ? candidate.id === targetId
        : Boolean(targetSlug) && candidate.slug === targetSlug,
    );
  let content: ReactNode;
  if (matchPath("/explorar", pathname))
    content = <ExploreSkeleton search={search} />;
  else if (matchPath("/biblioteca", pathname)) content = <LibrarySkeleton />;
  else if (matchPath("/progreso", pathname)) content = <ProgressSkeleton />;
  else if (publicMatch) content = <PublicDeckSkeleton deck={deck} />;
  else if (studyMatch)
    content = (
      <StudySkeleton
        deckSession={Boolean(studyMatch.params.deckId)}
        deck={deck}
      />
    );
  else if (matchPath("/biblioteca/mazos/nuevo", pathname))
    content = <DeckFormSkeleton />;
  else if (matchPath("/biblioteca/mazos/nuevo-ia", pathname))
    content = <AiDeckSkeleton />;
  else if (editMatch) content = <DeckFormSkeleton editing deck={deck} />;
  else if (matchPath("/ajustes/repaso", pathname))
    content = <ReviewSettingsSkeleton />;
  else if (matchPath("/ajustes/ia", pathname)) content = <AiSettingsSkeleton />;
  else {
    const authRoutes: Record<string, "signIn" | "signUp" | "reset"> = {
      "/iniciar-sesion": "signIn",
      "/crear-cuenta": "signUp",
      "/recuperar-contrasena": "reset",
    };
    const kind = authRoutes[pathname.replace(/\/$/, "")];
    content = kind ? (
      <AuthSkeleton kind={kind} />
    ) : (
      <Page>
        <Placeholder className="h-10 w-64 max-w-full" />
      </Page>
    );
  }

  return (
    <div role="status" aria-label={label}>
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">{content}</div>
    </div>
  );
}
