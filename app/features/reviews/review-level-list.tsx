import {
  ArrowDownIcon,
  ArrowUpIcon,
  PlusIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button, Field, inputClass, Select } from "~/components/ui";
import { useT } from "~/lib/locale-context";
import {
  levelName,
  MAX_REVIEW_LEVELS,
  REVIEW_COLORS,
  REVIEW_UNITS,
} from "~/lib/review-levels";
import type {
  ReviewAction,
  ReviewIntervalUnit,
  ReviewLevel,
} from "~/lib/types";
import type { UpdateLevel } from "./use-review-levels-draft";

/**
 * La lista de niveles que se está editando.
 *
 * Eran 184 líneas dentro de la ruta, con un `map` por nivel y cinco campos cada
 * uno. Aquí se lee como lo que es: una fila por nivel, con sus dos columnas de
 * campos y su botón de activar.
 *
 * El nombre del nivel es el mismo que se ve en la pantalla de estudio, y sale de
 * `lib/review-levels` en vez de tener su propia traducción: si divergieran, el
 * mismo nivel se llamaría de una forma aquí y de otra allí, y eso es justo lo que
 * pasa con un nivel al que alguien le cambió el nombre.
 */
export function ReviewLevelList({
  levels,
  onUpdate,
  onMove,
}: {
  levels: ReviewLevel[];
  onUpdate: UpdateLevel;
  onMove: (index: number, offset: number) => void;
}) {
  return (
    <ol className="divide-y divide-line">
      {levels.map((level, index) => (
        <ReviewLevelRow
          key={level.id}
          level={level}
          position={index}
          last={index === levels.length - 1}
          onUpdate={onUpdate}
          onMove={onMove}
        />
      ))}
    </ol>
  );
}

/** Una fila: nombre y acción a la izquierda, intervalo y color a la derecha. */
function ReviewLevelRow({
  level,
  position,
  last,
  onUpdate,
  onMove,
}: {
  level: ReviewLevel;
  position: number;
  last: boolean;
  onUpdate: UpdateLevel;
  onMove: (index: number, offset: number) => void;
}) {
  const tr = useT();
  const label = levelName(level, tr);

  return (
    <li className="grid gap-4 py-5 lg:grid-cols-[auto_1fr_1fr_auto] lg:items-start">
      <div className="flex items-center gap-2 lg:pt-7">
        <span
          aria-hidden="true"
          className={`size-7 rounded-full rating-level--${level.color}`}
        />
        <div className="flex flex-col">
          <Button
            type="button"
            variant="ghost"
            disabled={position === 0}
            className="size-9 p-0"
            aria-label={tr("ajustesRepaso.moveUp", { name: label })}
            onClick={() => onMove(position, -1)}
          >
            <ArrowUpIcon aria-hidden size={17} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={last}
            className="size-9 p-0"
            aria-label={tr("ajustesRepaso.moveDown", { name: label })}
            onClick={() => onMove(position, 1)}
          >
            <ArrowDownIcon aria-hidden size={17} />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <Field label={tr("ajustesRepaso.name")} htmlFor={`name-${level.id}`}>
          <input
            id={`name-${level.id}`}
            className={inputClass}
            maxLength={40}
            value={label}
            onChange={(event) =>
              // Al escribirle un nombre propio se quita el `system_key`: un nivel
              // del sistema con nombre nuevo ya no se puede traducir, porque la
              // traducción solo existe para los nombres de la base.
              onUpdate(level.id, { name: event.target.value, system_key: null })
            }
          />
        </Field>

        <Field
          label={tr("ajustesRepaso.action")}
          htmlFor={`action-${level.id}`}
        >
          <Select
            id={`action-${level.id}`}
            value={level.action}
            onChange={(event) => {
              const action = event.target.value as ReviewAction;
              // Cambiar a «retirar» limpia el intervalo: guardar uno en un nivel
              // que retira no significaría nada.
              onUpdate(
                level.id,
                action === "retire"
                  ? {
                      action,
                      interval_amount: null,
                      interval_unit: null,
                    }
                  : { action, interval_amount: 1, interval_unit: "days" },
              );
            }}
          >
            <option value="review">{tr("ajustesRepaso.actionReview")}</option>
            <option value="retire">{tr("ajustesRepaso.actionRetire")}</option>
          </Select>
        </Field>
      </div>

      <IntervalFields level={level} onUpdate={onUpdate} />
      <ColorField level={level} onUpdate={onUpdate} />

      <Button
        type="button"
        variant={level.active ? "secondary" : "ghost"}
        className="min-h-11 lg:mt-7"
        aria-pressed={level.active}
        onClick={() => onUpdate(level.id, { active: !level.active })}
      >
        {tr(
          level.active ? "ajustesRepaso.deactivate" : "ajustesRepaso.activate",
        )}
      </Button>
    </li>
  );
}

/** La cantidad y la unidad, o la explicación de por qué no las hay. */
function IntervalFields({
  level,
  onUpdate,
}: {
  level: ReviewLevel;
  onUpdate: UpdateLevel;
}) {
  const tr = useT();

  if (level.action === "retire") {
    return (
      <div className="space-y-4">
        <p className="rounded-lg bg-paper-sunken px-3 py-3 text-sm text-ink-soft">
          {tr("ajustesRepaso.retireHint")}
        </p>
        <ColorField level={level} onUpdate={onUpdate} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[minmax(5rem,0.55fr)_1fr] gap-2">
        <Field
          label={tr("ajustesRepaso.amount")}
          htmlFor={`amount-${level.id}`}
        >
          <input
            id={`amount-${level.id}`}
            type="number"
            min={1}
            max={level.interval_unit === "days" ? 3650 : 525600}
            required
            className={inputClass}
            value={level.interval_amount ?? 1}
            onChange={(event) =>
              onUpdate(level.id, {
                interval_amount: Math.max(1, Number(event.target.value)),
              })
            }
          />
        </Field>
        <Field label={tr("ajustesRepaso.unit")} htmlFor={`unit-${level.id}`}>
          <Select
            id={`unit-${level.id}`}
            value={level.interval_unit ?? "days"}
            onChange={(event) =>
              onUpdate(level.id, {
                interval_unit: event.target.value as ReviewIntervalUnit,
              })
            }
          >
            {REVIEW_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {tr(`ajustesRepaso.${unit}`)}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <ColorField level={level} onUpdate={onUpdate} />
    </div>
  );
}

function ColorField({
  level,
  onUpdate,
}: {
  level: ReviewLevel;
  onUpdate: UpdateLevel;
}) {
  const tr = useT();

  return (
    <Field label={tr("ajustesRepaso.color")} htmlFor={`color-${level.id}`}>
      <Select
        id={`color-${level.id}`}
        value={level.color}
        onChange={(event) => onUpdate(level.id, { color: event.target.value })}
      >
        {REVIEW_COLORS.map((color) => (
          <option key={color} value={color}>
            {tr(`ajustesRepaso.color.${color}`)}
          </option>
        ))}
      </Select>
    </Field>
  );
}

/** El botón de añadir y el aviso de hasta cuántos caben. */
export function AddLevelButton({
  levels,
  onAdd,
}: {
  levels: ReviewLevel[];
  onAdd: () => void;
}) {
  const tr = useT();

  return (
    <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-5">
      <Button
        type="button"
        variant="secondary"
        className="min-h-11"
        disabled={levels.length >= MAX_REVIEW_LEVELS}
        onClick={onAdd}
      >
        <PlusIcon aria-hidden size={18} />
        {tr("ajustesRepaso.addLevel")}
      </Button>
      <span className="text-xs text-ink-faint">
        {tr("ajustesRepaso.timezone", { timezone: browserTimeZone() })}
      </span>
    </div>
  );
}

/** La zona horaria del navegador, que es la que cuenta los dias. */
function browserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}
