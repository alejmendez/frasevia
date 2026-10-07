import {
  ArrowRightIcon,
  ArrowsClockwiseIcon,
  CalendarDotsIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { Button, ButtonLink, Card } from "~/components/ui";
import { useAuth } from "~/lib/auth-context";
import { t } from "~/lib/locale";
import { useT } from "~/lib/locale-context";
import type { DeckStudyMode } from "~/lib/types";

const STEPS = [
  { number: "01", title: "inicio.stepRemember", icon: "card" },
  { number: "02", title: "inicio.stepFlip", icon: "flip" },
  { number: "03", title: "inicio.stepSchedule", icon: "calendar" },
] as const;

export function meta() {
  return [
    { title: t("inicio.metaTitle") },
    { name: "description", content: t("inicio.metaDescription") },
  ];
}

export default function Inicio() {
  const tr = useT();
  const { status } = useAuth();
  const [revealed, setRevealed] = useState(false);
  const [demoMode, setDemoMode] = useState<DeckStudyMode>("language");
  const general = demoMode === "general";

  return (
    <div>
      <section className="mx-auto grid w-full max-w-7xl items-center gap-14 px-5 py-12 sm:px-8 sm:py-20 lg:grid-cols-[0.82fr_1.18fr] lg:gap-10">
        <div className="max-w-xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
            {tr("inicio.eyebrow")}
          </p>
          <h1 className="mt-5 font-display text-6xl leading-[0.98] tracking-tight text-brand sm:text-7xl lg:text-8xl">
            {tr("inicio.titleLead")}
            <span className="text-accent">{tr("inicio.titleAccent")}</span>.
          </h1>
          <p className="mt-7 max-w-lg text-lg leading-relaxed text-ink-soft sm:text-xl">
            {tr("inicio.body")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {status === "authenticated" ? (
              <ButtonLink to="/biblioteca">
                {tr("inicio.ctaLibrary")}
              </ButtonLink>
            ) : (
              <Button onClick={() => setRevealed((value) => !value)}>
                <ArrowsClockwiseIcon aria-hidden size={19} weight="bold" />
                {tr(revealed ? "inicio.ctaFront" : "inicio.ctaTry")}
              </Button>
            )}
            <ButtonLink to="/explorar" variant="secondary">
              {tr("inicio.ctaExplore")}
            </ButtonLink>
          </div>
          <p className="mt-3 text-sm text-ink-faint">
            {tr("inicio.noStreaks")}
          </p>
        </div>

        <div className="relative px-2 py-5 sm:px-8 sm:py-10">
          <fieldset className="relative z-10 mb-5 flex justify-center gap-2">
            <legend className="sr-only">{tr("studyMode.label")}</legend>
            {(["language", "general"] as const).map((mode) => (
              <Button
                key={mode}
                type="button"
                variant={demoMode === mode ? "primary" : "secondary"}
                aria-pressed={demoMode === mode}
                onClick={() => {
                  setDemoMode(mode);
                  setRevealed(false);
                }}
              >
                {tr(`studyMode.${mode}`)}
              </Button>
            ))}
          </fieldset>
          <div
            aria-hidden="true"
            className="absolute inset-8 -rotate-3 rounded-[42%] bg-brand-muted/80"
          />
          <article
            className="paper-card relative mx-auto min-h-[23rem] max-w-2xl -rotate-2 p-7 transition-transform duration-500 sm:min-h-[28rem] sm:p-10"
            aria-live="polite"
          >
            <span aria-hidden="true" className="paper-tape" />
            <div className="paper-card__margin min-h-[21rem] pl-6 sm:min-h-[26rem] sm:pl-9">
              {revealed ? (
                <div className="flex min-h-[21rem] flex-col justify-center sm:min-h-[26rem]">
                  <p className="text-xs font-bold tracking-[0.16em] text-brand uppercase">
                    {tr("inicio.demoAnswerLabel")}
                  </p>
                  <p className="handwritten mt-4 text-6xl leading-tight text-brand sm:text-8xl">
                    {general ? tr("inicio.demoGeneralBack") : "base salary"}
                  </p>
                  <p className="handwritten mt-1 text-3xl text-ink-soft sm:text-4xl">
                    {general ? tr("inicio.demoGeneralFront") : "sueldo base"}
                  </p>
                  <div className="mt-6 border-t border-line pt-5">
                    <p className="handwritten text-2xl leading-snug text-brand sm:text-3xl">
                      {general
                        ? tr("inicio.demoGeneralContext")
                        : "What is the base salary for this role?"}
                    </p>
                    {general ? null : (
                      <p className="mt-3 text-sm text-ink-soft">
                        {tr("inicio.demoMeaning")}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[21rem] flex-col justify-center sm:min-h-[26rem]">
                  <p className="text-xs font-bold tracking-[0.16em] text-brand uppercase">
                    {tr(general ? "studyMode.general" : "inicio.demoDirection")}
                  </p>
                  <p
                    className={`handwritten mt-5 leading-tight text-brand ${general ? "text-4xl sm:text-5xl" : "text-6xl sm:text-8xl"}`}
                  >
                    {general ? tr("inicio.demoGeneralFront") : "sueldo base"}
                  </p>
                  <p className="handwritten mt-8 text-xl text-ink-soft sm:text-2xl">
                    {tr("inicio.demoHint")}
                  </p>
                </div>
              )}
            </div>
          </article>
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            className="relative mx-auto mt-8 flex min-h-12 items-center gap-3 rounded-xl bg-brand-solid px-6 py-3 font-medium text-on-solid transition-transform hover:bg-brand-solid-hover active:scale-[0.98]"
            aria-label={tr(revealed ? "inicio.ctaFront" : "inicio.ctaTurn")}
          >
            <ArrowsClockwiseIcon aria-hidden size={20} weight="bold" />
            {tr(revealed ? "inicio.ctaFront" : "inicio.ctaTurn")}
          </button>
        </div>
      </section>

      <section className="border-y border-line bg-paper-raised/60">
        <div className="mx-auto grid w-full max-w-7xl gap-5 px-5 py-8 sm:px-8 md:grid-cols-3 md:py-10">
          {STEPS.map((step) => (
            <div key={step.number} className="flex items-start gap-4 px-2 py-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-muted font-semibold text-brand">
                {step.number}
              </span>
              <div>
                <h2 className="font-display text-xl text-brand">
                  {tr(step.title)}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  {tr(`${step.title}Body`)}
                </p>
              </div>
              {step.icon === "flip" ? (
                <ArrowsClockwiseIcon
                  className="ml-auto mt-1 text-accent"
                  aria-hidden
                  size={25}
                />
              ) : step.icon === "calendar" ? (
                <CalendarDotsIcon
                  className="ml-auto mt-1 text-brand"
                  aria-hidden
                  size={25}
                />
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <h2 className="font-display text-3xl leading-tight text-brand sm:text-4xl">
            {tr("inicio.startTitle")}
          </h2>
          <p className="mt-3 max-w-lg leading-relaxed text-ink-soft">
            {tr("inicio.startBody")}
          </p>
          <ButtonLink to="/explorar" variant="secondary" className="mt-5">
            {tr("inicio.seeCatalog")}
            <ArrowRightIcon aria-hidden size={17} />
          </ButtonLink>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card
            as="article"
            className="paper-card flex flex-col justify-between p-6"
          >
            <div>
              <p className="text-xs font-semibold tracking-[0.12em] text-accent uppercase">
                {tr("inicio.deckBasicsLabel")}
              </p>
              <h3 className="mt-3 font-display text-2xl text-brand">
                {tr("inicio.tagBasics")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {tr("inicio.deckBasicsBody")}
              </p>
            </div>
            <ButtonLink
              to="/mazos/ingles-desde-las-bases"
              variant="ghost"
              className="mt-5 justify-start px-0"
            >
              {tr("inicio.openDeck")}
              <ArrowRightIcon aria-hidden size={17} />
            </ButtonLink>
          </Card>
          <Card
            as="article"
            className="paper-card flex flex-col justify-between p-6"
          >
            <div>
              <p className="text-xs font-semibold tracking-[0.12em] text-accent uppercase">
                {tr("inicio.deckDevsLabel")}
              </p>
              <h3 className="mt-3 font-display text-2xl text-brand">
                {tr("inicio.tagDevs")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {tr("inicio.deckDevsBody")}
              </p>
            </div>
            <ButtonLink
              to="/mazos/ingles-para-desarrolladores"
              variant="ghost"
              className="mt-5 justify-start px-0"
            >
              {tr("inicio.openDeck")}
              <ArrowRightIcon aria-hidden size={17} />
            </ButtonLink>
          </Card>
        </div>
      </section>
    </div>
  );
}
