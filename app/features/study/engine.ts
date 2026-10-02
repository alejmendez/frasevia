import { t } from "~/lib/locale";
import {
  type CardProgress,
  MASTERY_CORRECT_COUNT,
  type ProgressState,
  type StudyCard,
} from "~/lib/types";

/**
 * Motor de estudio: funciones puras, sin React ni Supabase.
 *
 * Todo lo que decide qué se muestra y si una respuesta es correcta vive acá,
 * para poder probarlo sin navegador ni base de datos.
 */

export const STUDY_MODES = [
  "elegir",
  "completar",
  "revisar",
  "explorar",
] as const;

export type StudyMode = (typeof STUDY_MODES)[number];

/**
 * Etiquetas de los modos.
 *
 * Son funciones y no constantes porque dependen del idioma. Se resuelven al
 * llamarlas, que es cuando el modo ya está elegido y la pantalla se está
 * pintando: leerlas una vez al importar dejaría el modo congelado en el idioma
 * que hubiera en ese momento.
 */
export function modeLabel(mode: StudyMode): string {
  return t(`engine.mode.${mode}`);
}

export function modeDescription(mode: StudyMode): string {
  return t(`engine.modeDescription.${mode}`);
}

/** Cantidad de distractores en la práctica de elección múltiple. */
const OPTION_COUNT = 4;

/** Por debajo de este tamaño no hay suficientes alternativas plausibles. */
const MIN_CARDS_FOR_CHOICE = 4;

export interface ChoiceOption {
  id: string;
  label: string;
}

export type PracticeItem =
  | { kind: "explorar"; card: StudyCard }
  | { kind: "revisar"; card: StudyCard }
  | {
      kind: "elegir";
      card: StudyCard;
      options: ChoiceOption[];
      answerId: string;
    }
  | {
      kind: "completar";
      card: StudyCard;
      /** Oración con el término oculto. */
      sentence: string;
      /** Respuestas aceptadas para esa oración. */
      answers: string[];
    };

export interface SessionPlan {
  /** Modo que realmente se usará, después de aplicar los respaldos. */
  mode: StudyMode;
  /** Modo que pidió la persona. */
  requestedMode: StudyMode;
  items: PracticeItem[];
  /** Explicación, en el idioma de la interfaz, si el modo tuvo que cambiar. */
  notice: string | null;
}

export interface PracticeResult {
  cardId: string;
  /** El ítem se respondió bien. */
  correct: boolean;
  /** En `revisar` y `explorar` la persona se autoevalúa, y cuenta como acierto. */
  selfAssessed: boolean;
}

export interface SessionSummary {
  practiced: number;
  correct: number;
  accuracy: number;
  needsReview: StudyCard[];
}

// ---------------------------------------------------------------------------
// Utilidades deterministas
// ---------------------------------------------------------------------------

/**
 * PRNG con semilla (mulberry32).
 *
 * Permite barajar de forma reproducible: los tests pueden pedir la misma
 * semilla y obtener exactamente la misma sesión, sin depender de `Math.random`.
 */
export function createRng(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: T[], rng: () => number): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

// ---------------------------------------------------------------------------
// Corrección de respuestas escritas
// ---------------------------------------------------------------------------

const TYPOGRAPHIC_QUOTES: Record<string, string> = {
  "‘": "'",
  "’": "'",
  "“": '"',
  "”": '"',
  "–": "-",
  "—": "-",
};

/**
 * Normaliza una respuesta escrita para compararla con la esperada.
 *
 * Ignora mayúsculas, acentos irrelevantes para la Comparison de inglés, comillas
 * tipográficas y puntuación final, que es donde más se equivocan las personas al
 * teclear de memoria.
 */
export function normalizeAnswer(value: string): string {
  return value
    .replace(/[‘’“”–—]/g, (char) => TYPOGRAPHIC_QUOTES[char] ?? char)
    .toLowerCase()
    .replace(/[.,;:!?¿¡"'`]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Variantes aceptadas de un término.
 *
 * Por ejemplo, "the" y "a" no son obligatorios: alguien que escriba "cat" en
 * lugar de "a cat" también acertó.
 */
export function acceptedAnswers(answer: string): string[] {
  const base = normalizeAnswer(answer);
  if (!base) {
    return [];
  }

  const withoutArticle = base.replace(/^(the|a|an)\s+/, "");

  return withoutArticle && withoutArticle !== base
    ? [base, withoutArticle]
    : [base];
}

/** Compara una respuesta escrita con las respuestas aceptadas. */
export function checkTypedAnswer(input: string, answers: string[]): boolean {
  const normalized = normalizeAnswer(input);
  if (!normalized) {
    return false;
  }

  return answers.some((answer) => normalizeAnswer(answer) === normalized);
}

// ---------------------------------------------------------------------------
// Construcción de los ítems de práctica
// ---------------------------------------------------------------------------

/**
 * Oculta el término dentro del ejemplo.
 *
 * Devuelve `null` si el término no aparece en la oración, porque en ese caso no
 * hay un hueco honesto que completar.
 */
export function buildFillInTheBlank(
  card: StudyCard,
): { sentence: string; answers: string[] } | null {
  const example = card.exampleEn?.trim();
  if (!example) {
    return null;
  }

  const escaped = card.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(escaped, "i").exec(example);
  if (!match || match.index === undefined) {
    return null;
  }

  const before = example.slice(0, match.index);
  const after = example.slice(match.index + match[0].length);

  return {
    sentence: `${before}____${after}`.replace(/\s+/g, " ").trim(),
    answers: acceptedAnswers(card.term),
  };
}

/**
 * Arma una pregunta de opción múltiple.
 *
 * Devuelve `null` cuando no hay suficientes significados distintos: es preferible
 * proponer otra práctica a inventar alternativas que no seemblan entre sí.
 * La tarjeta nunca aparece como alternativa correcta de sí misma ni su propio
 * significado se repite entre las opciones.
 */
export function buildChoiceQuestion(
  card: StudyCard,
  pool: StudyCard[],
): { options: ChoiceOption[]; answerId: string } | null {
  const answerId = card.id;
  const correctLabel = normalizeAnswer(card.meaningEs);
  if (!correctLabel) {
    return null;
  }

  const seen = new Set<string>([correctLabel]);
  const distractors: ChoiceOption[] = [];

  for (const candidate of pool) {
    if (candidate.id === card.id) {
      continue;
    }

    const label = candidate.meaningEs.trim();
    const key = normalizeAnswer(label);
    if (!label || seen.has(key)) {
      continue;
    }

    seen.add(key);
    distractors.push({ id: `distractor-${candidate.id}`, label });

    if (distractors.length === OPTION_COUNT - 1) {
      break;
    }
  }

  if (distractors.length < OPTION_COUNT - 1) {
    return null;
  }

  const options: ChoiceOption[] = [
    { id: answerId, label: card.meaningEs.trim() },
    ...distractors,
  ];

  return { options, answerId };
}

export function canUseChoiceMode(cards: StudyCard[]): boolean {
  return (
    new Set(cards.map((card) => normalizeAnswer(card.meaningEs))).size >=
    MIN_CARDS_FOR_CHOICE
  );
}

export function canUseFillInTheBlankMode(cards: StudyCard[]): boolean {
  return cards.some((card) => buildFillInTheBlank(card) !== null);
}

function shuffledOptionOrder(
  options: ChoiceOption[],
  rng: () => number,
): ChoiceOption[] {
  return shuffle(options, rng);
}

// ---------------------------------------------------------------------------
// Plan de sesión
// ---------------------------------------------------------------------------

function buildItems(
  mode: StudyMode,
  cards: StudyCard[],
  rng: () => number,
): PracticeItem[] {
  switch (mode) {
    case "explorar":
      return cards.map((card) => ({ kind: "explorar", card }));

    case "revisar":
      return cards.map((card) => ({ kind: "revisar", card }));

    case "completar": {
      const items: PracticeItem[] = [];
      for (const card of cards) {
        const blank = buildFillInTheBlank(card);
        if (blank) {
          items.push({ kind: "completar", card, ...blank });
        }
      }
      return items;
    }

    case "elegir": {
      const items: PracticeItem[] = [];
      for (const card of cards) {
        const question = buildChoiceQuestion(card, cards);
        if (question) {
          items.push({
            kind: "elegir",
            card,
            options: shuffledOptionOrder(question.options, rng),
            answerId: question.answerId,
          });
        }
      }
      return items;
    }
  }
}

/**
 * Decide el modo que realmente se puede usar.
 *
 * `elegir` necesita al menos cuatro significados distintos y `completar` necesita
 * alguna tarjeta cuyo término aparezca en su ejemplo. Si no, se degrada a una
 * práctica que siempre funciona con el contenido disponible.
 */
export function resolveMode(
  requestedMode: StudyMode,
  cards: StudyCard[],
): { mode: StudyMode; notice: string | null } {
  if (cards.length === 0) {
    return { mode: "revisar", notice: t("engine.notice.empty") };
  }

  if (requestedMode === "elegir" && !canUseChoiceMode(cards)) {
    return {
      mode: "revisar",
      notice: t("engine.notice.tooFewForChoice"),
    };
  }

  if (requestedMode === "completar" && !canUseFillInTheBlankMode(cards)) {
    return {
      mode: "revisar",
      notice: t("engine.notice.noFillInTheBlank"),
    };
  }

  return { mode: requestedMode, notice: null };
}

export interface BuildSessionOptions {
  mode: StudyMode;
  /** Cantidad máxima de tarjetas a practicar. */
  limit?: number;
  seed?: number;
}

export function buildSession(
  cards: StudyCard[],
  options: BuildSessionOptions,
): SessionPlan {
  const rng = createRng(options.seed ?? 20260930);
  const { mode, notice } = resolveMode(options.mode, cards);

  // Primero se baraja el mazo completo y después se recorta, para que un límite
  // bajo no practique siempre las primeras tarjetas.
  const ordered = shuffle(cards, rng);
  const selected =
    options.limit && options.limit > 0
      ? ordered.slice(0, options.limit)
      : ordered;

  return {
    mode,
    requestedMode: options.mode,
    items: buildItems(mode, selected, rng),
    notice,
  };
}

// ---------------------------------------------------------------------------
// Progreso
// ---------------------------------------------------------------------------

export interface NextProgress {
  state: ProgressState;
  attempts: number;
  correctCount: number;
}

/**
 * Calcula el progreso de una tarjeta después de un intento.
 *
 * Regla simple a propósito, sin repetición espaciada: hacen falta dos aciertos
 * para marcar una tarjeta como aprendida, y un fallo la devuelve a "practicando"
 * aunque antes estuviera aprendida. `record_practice` aplica exactamente la misma
 * regla en la base de datos, así que el contador no depende de lo que muestre la
 * interfaz.
 */
export function nextProgress(
  previous: CardProgress | undefined,
  correct: boolean,
): NextProgress {
  const attempts = (previous?.attempts ?? 0) + 1;
  const correctCount = (previous?.correct_count ?? 0) + (correct ? 1 : 0);

  return {
    state:
      correct && correctCount >= MASTERY_CORRECT_COUNT
        ? "mastered"
        : "learning",
    attempts,
    correctCount,
  };
}

/**
 * Resumen de la sesión.
 *
 * Los ítems de `revisar` y `explorar` no entran en el porcentaje: la persona se
 * autoevalúa y no había una respuesta fija con la cual comparar. Aun así, si dice
 * que no lo sabía, la tarjeta sí aparece en el repaso pendiente.
 */
export function summarize(
  results: PracticeResult[],
  cardsById: Map<string, StudyCard>,
): SessionSummary {
  const scorable = results.filter((result) => !result.selfAssessed);
  const correct = scorable.filter((result) => result.correct).length;
  const needsReview = results
    .filter((result) => !result.correct)
    .map((result) => cardsById.get(result.cardId))
    .filter((card): card is StudyCard => Boolean(card));

  return {
    practiced: results.length,
    correct,
    accuracy: scorable.length === 0 ? 0 : correct / scorable.length,
    needsReview,
  };
}
