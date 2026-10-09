import { useT } from "~/lib/locale-context";
import {
  modeDescription,
  modeLabel,
  STUDY_MODES,
  type StudyMode,
} from "../engine";

/**
 * El selector de modo de práctica.
 *
 * El campo que se marca no es el que se eligió sino el que el motor acabó
 * usando: si no había contenido para el modo pedido, el motor cambia a otro y lo
 * explica debajo. Marcar el pedido dejaría a la persona pensando que está
 * practicando algo que no está practicando.
 */
export function ModePicker({
  mode,
  onChange,
  general,
}: {
  mode: StudyMode;
  onChange: (mode: StudyMode) => void;
  general: boolean;
}) {
  const tr = useT();

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-ink">
        {tr("estudiar.modeLegend")}
      </legend>
      <div className="flex flex-wrap gap-2">
        {modesFor(general).map((option) => (
          <ModeOption
            key={option}
            option={option}
            active={option === mode}
            general={general}
            onChange={onChange}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-faint">
        {general
          ? tr(`general.modeDescription.${mode}`)
          : modeDescription(mode)}
      </p>
    </fieldset>
  );
}

function ModeOption({
  option,
  active,
  general,
  onChange,
}: {
  option: StudyMode;
  active: boolean;
  general: boolean;
  onChange: (mode: StudyMode) => void;
}) {
  const tr = useT();

  return (
    <label
      className={`cursor-pointer rounded-lg border px-3 py-2 text-sm transition-colors ${
        active
          ? "border-brand bg-brand-muted font-medium text-brand-strong"
          : "border-line-strong bg-paper-raised text-ink-soft hover:bg-paper-sunken"
      }`}
    >
      <input
        type="radio"
        name="modo"
        value={option}
        checked={active}
        onChange={() => onChange(option)}
        className="sr-only"
      />
      {/* En repaso general, «elegir» no es elegir una traducción: es responder
          una pregunta, y el nombre del modo lo dice. */}
      {general && option === "elegir"
        ? tr("general.choiceMode")
        : modeLabel(option)}
    </label>
  );
}

/** Los modos disponibles. «Completar la frase» no tiene sentido sin dos idiomas. */
function modesFor(general: boolean): StudyMode[] {
  return STUDY_MODES.filter((option) => !general || option !== "completar");
}
