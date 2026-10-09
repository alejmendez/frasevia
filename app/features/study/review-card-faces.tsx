import type { RefObject } from "react";
import { cx } from "~/components/ui";
import { useT } from "~/lib/locale-context";
import type { StudyCard } from "~/lib/types";

import { PronunciationControls } from "./pronunciation-controls";
import { orientReviewCard } from "./schedule";
import { reviewCardSpeechLanguages } from "./speech";

/** Qué idioma se pronuncia en cada cara. */
function frontSpeechLanguage(direction: string): string {
  return reviewCardSpeechLanguages(direction).front;
}

function answerSpeechLanguage(direction: string): string {
  return reviewCardSpeechLanguages(direction).answer;
}

/**
 * La tarjeta de repaso: la cara que se ve y la que sale al voltearla.
 *
 * Son dos `<article>` apilados y el que está detrás se gira con una clase. El giro
 * lo hace CSS —`review-card-rotator` en `app.css`— y no un estado: así la
 * transición no depende de que React vuelva a renderizar.
 *
 * Un mazo de repaso general no tiene dos lados que traducir: muestra la pregunta
 * y, al voltear, la respuesta. Por eso no lleva pronunciación —el contenido está
 * en un solo idioma y no hay nada que pronunciar en el otro— y por eso los dos
 * lados usan el mismo tamaño de letra.
 */
export function ReviewCardFaces({
  card,
  direction,
  revealed,
  frontHeadingRef,
  backHeadingRef,
}: {
  card: StudyCard;
  direction: string;
  revealed: boolean;
  frontHeadingRef: RefObject<HTMLHeadingElement | null>;
  backHeadingRef: RefObject<HTMLHeadingElement | null>;
}) {
  const tr = useT();
  const general = card.studyMode === "general";
  const { sourceLanguage, targetLanguage, sourceText, targetText } =
    orientReviewCard(card, direction);

  const targetExample = general
    ? card.exampleEn
    : targetLanguage === "en"
      ? card.exampleEn
      : card.exampleEs;

  const exampleTranslation = general
    ? null
    : sourceLanguage === "en"
      ? card.exampleEn
      : card.exampleEs;

  return (
    <div className="review-card-perspective mt-7">
      <div className={cx("review-card-rotator", revealed && "is-revealed")}>
        <article
          aria-hidden={revealed}
          className="paper-card review-card-face p-7 sm:p-10"
        >
          <span aria-hidden="true" className="paper-tape" />
          <div className="paper-card__margin min-h-80 pl-6 sm:pl-9">
            <p className="text-xs font-bold tracking-[0.16em] text-brand uppercase">
              {general
                ? tr("studyMode.general")
                : tr("estudiar.direction", {
                    source: sourceLanguage.toUpperCase(),
                    target: targetLanguage.toUpperCase(),
                  })}
            </p>
            {card.deckTitle ? (
              <p className="mt-2 text-xs text-ink-faint">{card.deckTitle}</p>
            ) : null}
            <h2
              ref={frontHeadingRef}
              tabIndex={-1}
              lang={general ? sourceLanguage : frontSpeechLanguage(direction)}
              className={cx(
                "handwritten mt-8 break-words leading-tight text-brand outline-none",
                general ? "text-3xl sm:text-5xl" : "text-5xl sm:text-7xl",
              )}
            >
              {sourceText}
            </h2>
            {general ? null : (
              <PronunciationControls
                key={`${card.id}:${direction}:front`}
                text={sourceText}
                language={frontSpeechLanguage(direction)}
              />
            )}
            <p className="handwritten mt-8 text-xl text-ink-soft sm:text-2xl">
              {tr(general ? "general.recallHint" : "estudiar.recallHint")}
            </p>
          </div>
        </article>

        <article
          aria-hidden={!revealed}
          className="paper-card review-card-face review-card-face--back p-7 sm:p-10"
        >
          <span aria-hidden="true" className="paper-tape" />
          <div className="paper-card__margin pl-6 sm:pl-9">
            <p className="text-xs font-bold tracking-[0.16em] text-brand uppercase">
              {tr("estudiar.responseLabel")}
            </p>
            <h2
              ref={backHeadingRef}
              tabIndex={revealed ? -1 : undefined}
              lang={general ? sourceLanguage : answerSpeechLanguage(direction)}
              className={cx(
                "handwritten mt-3 break-words leading-tight text-brand outline-none",
                general ? "text-3xl sm:text-5xl" : "text-5xl sm:text-7xl",
              )}
            >
              {targetText}
            </h2>
            {general ? null : (
              <PronunciationControls
                key={`${card.id}:${direction}:answer`}
                text={targetText}
                language={answerSpeechLanguage(direction)}
              />
            )}
            <p
              lang={general ? sourceLanguage : frontSpeechLanguage(direction)}
              className="handwritten mt-1 text-2xl text-ink-soft sm:text-3xl"
            >
              {sourceText}
            </p>
            {targetExample ? (
              <div className="mt-6 border-t border-line pt-5">
                <p
                  lang={targetLanguage}
                  className="handwritten break-words text-2xl leading-snug text-brand sm:text-3xl"
                >
                  {targetExample}
                </p>
                {general ? null : (
                  <PronunciationControls
                    key={`${card.id}:${direction}:example`}
                    text={targetExample}
                    language={targetLanguage}
                  />
                )}
                {exampleTranslation ? (
                  <p
                    lang={sourceLanguage}
                    className="mt-2 text-sm leading-relaxed text-ink-soft"
                  >
                    {exampleTranslation}
                  </p>
                ) : null}
              </div>
            ) : null}
            {card.usageNote ? (
              <p className="mt-4 border-t border-line pt-3 text-sm leading-relaxed text-ink-soft">
                <span className="font-medium text-ink">
                  {tr(general ? "general.notePrefix" : "estudiar.usageNote")}
                </span>
                {card.usageNote}
              </p>
            ) : null}
          </div>
        </article>
      </div>
    </div>
  );
}
