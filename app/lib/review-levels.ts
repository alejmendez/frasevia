import type { MessageKey, MessageParams } from "./locale";
import type { ReviewAction, ReviewIntervalUnit, ReviewLevel } from "./types";

/**
 * Los niveles de repaso: qué son, cómo se validan y cómo se nombran.
 *
 * Esto lo usan tres sitios y cada uno tenía su copia: la pantalla de ajustes
 * —que los edita—, la de estudio —que los muestra como botones— y la base. La
 * consecuencia era visible: el mismo nivel se llamaba «Difícil» en un sitio y
 * «Dificil» en otro, y las validaciones solo existían en la pantalla, así que un
 * envío a mano se colaba.
 *
 * Aquí no hay React ni base de datos. Las etiquetas reciben la función de traducir
 * como argumento para que sirvan igual dentro de un componente (`tr`) y fuera
 * (`t`), y para que se puedan probar sin montar nada.
 */

/**
 * Un identificador de nivel, tal como lo genera `crypto.randomUUID`: versión 4
 * con su variante correcta. No es adorno — es lo que distingue un identificador
 * de una cadena que alguien mandó a mano.
 */
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Colores que la interfaz sabe pintar. */
export const REVIEW_COLORS = [
  "coral",
  "sand",
  "sage",
  "lime",
  "forest",
  "blue",
] as const;

/** Unidades de intervalo que entiende la base. */
export const REVIEW_UNITS = ["minutes", "hours", "days"] as const;

export type ReviewColor = (typeof REVIEW_COLORS)[number];
export type ReviewUnit = (typeof REVIEW_UNITS)[number];

/**
 * Los cuatro niveles con los que arranca todo el mundo.
 *
 * Difícil, Normal, Fácil y Súper fácil. Sus nombres vienen traducidos por el
 * código (levelName), así que aquí solo están los valores: un idioma nuevo
 * no necesita otra tabla.
 */
export const DEFAULT_REVIEW_LEVELS = [
  {
    system_key: "difficult",
    name: "Difícil",
    action: "review",
    interval_amount: 2,
    interval_unit: "hours",
    position: 1,
    color: "coral",
  },
  {
    system_key: "normal",
    name: "Normal",
    action: "review",
    interval_amount: 1,
    interval_unit: "days",
    position: 2,
    color: "sand",
  },
  {
    system_key: "easy",
    name: "Fácil",
    action: "review",
    interval_amount: 5,
    interval_unit: "days",
    position: 3,
    color: "sage",
  },
  {
    system_key: "very_easy",
    name: "Súper fácil",
    action: "retire",
    interval_amount: null,
    interval_unit: null,
    position: 4,
    color: "lime",
  },
] as const satisfies readonly {
  system_key: string;
  name: string;
  action: ReviewAction;
  interval_amount: number | null;
  interval_unit: ReviewIntervalUnit | null;
  position: number;
  color: ReviewColor;
}[];

/** Cuántos niveles caben como mucho. Un tope para que un envío no sea infinito. */
export const MAX_REVIEW_LEVELS = 30;

/** El nombre en el idioma de los valores predeterminados. */
const DEFAULT_NAMES: Record<string, string> = {
  difficult: "Difícil",
  normal: "Normal",
  easy: "Fácil",
  very_easy: "Súper fácil",
};

/**
 * Traduce una clave de traducción a un mensaje.
 *
 * Es el mismo tipo que tienen `t` y `tr`, así que estas funciones sirven dentro
 * de un componente y fuera. Va con tipos exactos a propósito: si aceptara
 * cualquier cadena, se podría pasar por una clave que no existe y saldría el
 * nombre de la clave en pantalla.
 */
type Translate = (key: MessageKey, params?: MessageParams) => string;

/**
 * El nombre del nivel, en el idioma de quien lo está leyendo.
 *
 * Un nivel con `system_key` cuyo nombre sigue siendo el predeterminado se
 * muestra traducido, no con el texto de la base: si alguien lo renombró a mano,
 * ese nombre gana.
 */
export function levelName(
  level: Pick<ReviewLevel, "system_key" | "name">,
  tr: Translate,
): string {
  const key = level.system_key;

  if (key && DEFAULT_NAMES[key] === level.name) {
    switch (key) {
      case "difficult":
        return tr("estudiar.level.difficult");
      case "normal":
        return tr("estudiar.level.normal");
      case "easy":
        return tr("estudiar.level.easy");
      case "very_easy":
        return tr("estudiar.level.veryEasy");
      default:
        break;
    }
  }

  return level.name;
}

/** El intervalo del nivel, dicho como lo diría una persona. */
export function intervalName(
  level: Pick<ReviewLevel, "action" | "interval_unit" | "interval_amount">,
  tr: Translate,
): string {
  if (level.action === "retire") return tr("estudiar.noFurtherReviews");

  const amount = level.interval_amount ?? 1;
  if (level.interval_unit === "days" && amount === 1) {
    return tr("estudiar.tomorrow");
  }
  if (level.interval_unit === "minutes") {
    return tr("estudiar.intervalMinutes", { amount });
  }
  if (level.interval_unit === "hours") {
    return tr("estudiar.intervalHours", { amount });
  }
  return tr("estudiar.intervalDays", { amount });
}

/** La clase CSS del botón de cada color. */
export const REVIEW_COLOR_CLASSES: Record<string, string> = {
  coral: "rating-level--coral",
  sand: "rating-level--sand",
  sage: "rating-level--sage",
  lime: "rating-level--lime",
  forest: "rating-level--forest",
  blue: "rating-level--blue",
};

/** Un nivel tal como viaja de la pantalla a la base, ya limpio. */
export interface LevelSubmission {
  id: string;
  system_key: string | null;
  name: string;
  action: ReviewAction;
  interval_amount: number | null;
  interval_unit: ReviewIntervalUnit | null;
  position: number;
  color: ReviewColor;
  active: boolean;
}

/** Por qué un envío de niveles no sirve, o `null` si sí sirve. */
export type LevelSubmissionProblem = "shape" | "level" | "interval";

/**
 * Lee y valida los niveles que llegan de un formulario.
 *
 * Es todo o nada a propósito: si un nivel de treinta está mal, no se guarda
 * ninguno. Guardar veintinueve y avisar sería peor que no guardar, porque quien
 * edita no ve qué se perdió.
 *
 * Devuelve `null` en vez de lanzar porque el destino de este fallo es una
 * pantalla, no un registro: quién lo explique es cosa de quien llama.
 */
export function parseLevelSubmission(
  input: unknown,
): LevelSubmission[] | LevelSubmissionProblem {
  if (!Array.isArray(input) || input.length === 0) return "shape";
  if (input.length > MAX_REVIEW_LEVELS) return "shape";

  const levels: LevelSubmission[] = [];

  for (const [index, candidate] of input.entries()) {
    const level = readLevel(candidate, index);
    if (!level) return "level";
    levels.push(level);
  }

  return levels;
}

function readLevel(candidate: unknown, index: number): LevelSubmission | null {
  if (!candidate || typeof candidate !== "object") return null;

  const row = candidate as Record<string, unknown>;
  const name = typeof row.name === "string" ? row.name.trim() : "";
  const action = row.action;
  const systemKey = typeof row.system_key === "string" ? row.system_key : null;

  if (typeof row.id !== "string" || !UUID.test(row.id)) return null;
  if (name.length < 1 || name.length > 40) return null;
  if (action !== "review" && action !== "retire") return null;
  if (!REVIEW_COLORS.includes(row.color as ReviewColor)) return null;
  if (
    systemKey !== null &&
    !DEFAULT_REVIEW_LEVELS.some((preset) => preset.system_key === systemKey)
  ) {
    return null;
  }

  const amount = row.interval_amount;
  const unit = row.interval_unit;

  // Un nivel que retira no tiene intervalo, así que no se mira. El que repasa
  // necesita los dos, y con un techo por unidad: un año de horas no es un año.
  if (action === "review") {
    if (typeof amount !== "number" || !Number.isInteger(amount)) return null;
    if (amount < 1 || amount > 525600) return null;
    if (!REVIEW_UNITS.includes(unit as ReviewUnit)) return null;
    if (unit === "hours" && amount > 8760) return null;
    if (unit === "days" && amount > 3650) return null;
  }

  return {
    id: row.id,
    system_key: systemKey,
    name,
    action,
    interval_amount: action === "retire" ? null : (amount as number),
    interval_unit: action === "retire" ? null : (unit as ReviewIntervalUnit),
    // La posición es la del formulario, no la que venga guardada: quien reordena
    // reordena, y el orden es exactamente el que está viendo.
    position: index + 1,
    color: row.color as ReviewColor,
    active: row.active === true,
  };
}
