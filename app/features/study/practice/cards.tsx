import { useState } from "react";

import { Alert, Button, inputClass } from "~/components/ui";
import { useT } from "~/lib/locale-context";
import { checkTypedAnswer, type PracticeItem } from "../engine";
import { practiceExample } from "./practice-example";

/**
 * Las cuatro formas de practicar, una tarjeta cada una.
 *
 * Viven juntas porque comparten todo menos el estado: el ejemplo, la nota y el
 * significado sale de `practice-example.ts`, y lo único que cambia entre las cuatro
 * es lo que le preguntan a la persona y qué botones hay. Separarlas en archivos
 * obligaría a saltar para ver qué tienen en común.
 *
 * Todas reciben lo mismo y hacen lo mismo: decir cómo terminó la tarjeta.
 */

/** Avisa de una respuesta, y de si la persona la evaluó a sí misma. */
export type AnswerHandler = (correct: boolean, selfAssessed: boolean) => void;

type Practice<K extends PracticeItem["kind"]> = Extract<
  PracticeItem,
  { kind: K }
>;

/** Explorar: enseña la tarjeta entera y pide seguir. */
export function Explore({
  item,
  onAnswer,
}: {
  item: Practice<"explorar">;
  onAnswer: AnswerHandler;
}) {
  const tr = useT();
  const { target, translation } = practiceExample(item.card);

  return (
    <div>
      <p className="font-display text-2xl text-brand">{item.card.term}</p>
      <p className="mt-2 text-lg text-ink">{item.card.meaningEs}</p>

      {target || translation ? (
        <div className="mt-5 border-t border-line pt-4">
          {target ? (
            <p lang={item.card.targetLanguage ?? "en"} className="text-ink">
              {target}
            </p>
          ) : null}
          {translation ? (
            <p lang={item.card.sourceLanguage} className="mt-1 text-ink-soft">
              {translation}
            </p>
          ) : null}
        </div>
      ) : null}

      {item.card.usageNote ? <UsageNote card={item.card} /> : null}

      <div className="mt-6">
        <Button onClick={() => onAnswer(true, true)}>
          {tr("estudiar.continue")}
        </Button>
      </div>
    </div>
  );
}

/** Repasar: destapa la respuesta y quien decide cómo le fue. */
export function Review({
  item,
  onAnswer,
}: {
  item: Practice<"revisar">;
  onAnswer: AnswerHandler;
}) {
  const tr = useT();
  const [revealed, setRevealed] = useState(false);
  const { target, translation } = practiceExample(item.card);
  const general = item.card.studyMode === "general";

  return (
    <div>
      <p className="font-display text-2xl text-brand">{item.card.term}</p>

      {revealed ? (
        <div className="mt-4 space-y-3">
          <p className="text-lg text-ink">{item.card.meaningEs}</p>
          {target || translation ? (
            <div className="border-t border-line pt-3">
              {target ? (
                <p lang={item.card.targetLanguage ?? "en"} className="text-ink">
                  {target}
                </p>
              ) : null}
              {translation ? (
                <p
                  lang={item.card.sourceLanguage}
                  className="mt-1 text-ink-faint"
                >
                  {translation}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink-faint">
          {tr(general ? "general.reviewHint" : "estudiar.reviewHint")}
        </p>
      )}

      {revealed ? (
        <SelfAssessment onAnswer={onAnswer} />
      ) : (
        <div className="mt-6">
          <Button onClick={() => setRevealed(true)}>
            {tr("estudiar.reveal")}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Los tres botones de «¿te sabías esto?».
 *
 * «Casi» y «no» cuentan igual en el progreso y se distinguen solo por el color: la
 * diferencia entre los dos es lo que la persona recuerda, no lo que la base
 * guarda. Por eso son el mismo `onAnswer(false, true)`.
 */
function SelfAssessment({ onAnswer }: { onAnswer: AnswerHandler }) {
  const tr = useT();

  return (
    <div className="mt-6">
      <p className="mb-2 text-sm text-ink-soft">{tr("estudiar.didYouKnow")}</p>
      <div className="flex-wrap gap-2 flex">
        <Button onClick={() => onAnswer(true, true)}>
          {tr("estudiar.knewIt")}
        </Button>
        <Button variant="secondary" onClick={() => onAnswer(false, true)}>
          {tr("estudiar.almost")}
        </Button>
        <Button variant="ghost" onClick={() => onAnswer(false, true)}>
          {tr("estudiar.didNotKnow")}
        </Button>
      </div>
    </div>
  );
}

/** Elegir significado: una opción correcta entre cuatro. */
export function ChooseMeaning({
  item,
  onAnswer,
}: {
  item: Practice<"elegir">;
  onAnswer: AnswerHandler;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const tr = useT();
  const answered = selected !== null;
  const isCorrect = selected === item.answerId;
  const general = item.card.studyMode === "general";

  return (
    <div>
      <p className="font-display text-2xl text-brand">{item.card.term}</p>
      <p className="mt-1 text-sm text-ink-soft">
        {tr(general ? "general.chooseAnswer" : "estudiar.whatMeaning")}
      </p>

      <div className="mt-5 grid gap-2">
        {item.options.map((option) => (
          <button
            key={option.id}
            type="button"
            disabled={answered}
            aria-pressed={selected === option.id}
            onClick={() => setSelected(option.id)}
            className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${optionTone(
              {
                answered,
                isAnswer: option.id === item.answerId,
                chosen: selected === option.id,
              },
            )}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {answered ? (
        <div className="mt-5">
          <Alert variant={isCorrect ? "success" : "error"}>
            {isCorrect
              ? tr("estudiar.correctAnswer", { meaning: item.card.meaningEs })
              : tr("estudiar.wasAnswer", { meaning: item.card.meaningEs })}
          </Alert>
          <div className="mt-4">
            <Button onClick={() => onAnswer(isCorrect, false)}>
              {tr("estudiar.continue")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Completar la frase: hay que escribir el término que falta.
 *
 * Se comprueba con `checkTypedAnswer`, que es el motor y no este archivo: el mismo
 * que decide si una respuesta escrita vale, con sus reglas de mayúsculas y
 * artículos. Aquí solo se pinta lo que dijo.
 */
export function FillTheBlank({
  item,
  onAnswer,
}: {
  item: Practice<"completar">;
  onAnswer: AnswerHandler;
}) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const tr = useT();

  const answerPlaceholder =
    item.card.targetLanguage === "es"
      ? tr("estudiar.answerPlaceholderSpanish")
      : tr("estudiar.answerPlaceholder");

  const isCorrect = checkTypedAnswer(value, item.answers);
  // `buildFillInTheBlank` siempre deja un solo hueco, así que basta partir la
  // oración en dos tramos.
  const [before = "", after = ""] = item.sentence.split("____");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <p className="text-sm text-ink-soft">{tr("estudiar.fillInstruction")}</p>

      <p className="mt-4 rounded-lg bg-paper-sunken px-4 py-6 text-center font-display text-xl leading-relaxed text-ink">
        {before}
        <span className="mx-1 border-b-2 border-brand text-brand">
          {submitted ? (isCorrect ? value.trim() : item.answer) : "________"}
        </span>
        {after}
      </p>

      <div className="mt-5">
        <label htmlFor="respuesta" className="sr-only">
          {tr("estudiar.answerLabel")}
        </label>
        <input
          id="respuesta"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={submitted}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={answerPlaceholder}
          className={inputClass}
        />
      </div>

      {submitted ? (
        <div className="mt-5">
          <Alert variant={isCorrect ? "success" : "error"}>
            {isCorrect
              ? tr("estudiar.correctTyped")
              : tr("estudiar.wasTerm", { term: item.card.term })}
          </Alert>
          {item.card.exampleEs ? (
            <p className="mt-3 text-sm text-ink-soft">{item.card.exampleEs}</p>
          ) : null}
          <div className="mt-4">
            <Button onClick={() => onAnswer(isCorrect, false)}>
              {tr("estudiar.continue")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-5">
          <Button type="submit" disabled={value.trim() === ""}>
            {tr("estudiar.check")}
          </Button>
        </div>
      )}
    </form>
  );
}

/** La nota de uso. En repaso general el prefijo no habla de traducciones. */
function UsageNote({ card }: { card: PracticeItem["card"] }) {
  const tr = useT();

  return (
    <p className="mt-4 rounded-lg bg-paper-sunken px-4 py-3 text-sm text-ink-soft">
      <span className="font-medium text-ink">
        {tr(
          card.studyMode === "general"
            ? "general.notePrefix"
            : "estudiar.usageNote",
        )}
      </span>
      {card.usageNote}
    </p>
  );
}

/**
 * Cómo se ve una opción según si ya se respondió.
 *
 * Antes de responder, la opción correcta no se distingue de las demás: marcarla
 * sería dar la respuesta.
 */
function optionTone({
  answered,
  isAnswer,
  chosen,
}: {
  answered: boolean;
  isAnswer: boolean;
  chosen: boolean;
}): string {
  if (!answered) {
    return "border-line-strong hover:border-brand hover:bg-brand-muted";
  }
  if (isAnswer) return "border-success bg-success-muted";
  if (chosen) return "border-danger bg-danger-muted";
  return "border-line bg-paper-raised opacity-60";
}
