import { Field, inputClass, Select } from "~/components/ui";
import { deckLanguages } from "~/lib/languages";
import type { MessageKey } from "~/lib/locale";
import { useT } from "~/lib/locale-context";
import type { DeckStudyMode } from "~/lib/types";

/**
 * Los campos que comparten los formularios de mazo.
 *
 * Crear un mazo, editarlo y revisarlo con IA piden todos los mismos datos con las
 * mismas etiquetas, y estaban escritos tres veces con tres nombres distintos para
 * el campo. Eso no es solo repetición: el día que cambie una etiqueta había que
 * cambiarla en tres sitios y era fácil olvidar uno.
 *
 * Cada campo acepta `onChange` o no. El editor de mazo deja que el navegador
 * gestione los valores y los manda con el formulario; la pantalla de creación los
 * tiene en estado, porque su botón depende de si el título está lleno antes de
 * dejar enviar. Con `onChange` el campo es controlado y sin él no lo es.
 */

/** Un par de idiomas. En repaso general solo se usa el de contenido. */
export function LanguageFields({
  names,
  labels,
  source,
  target,
  studyMode,
  onSourceChange,
  onTargetChange,
}: {
  names: { source: string; target: string };
  /**
   * Las etiquetas. Cada pantalla usa las suyas: en el editor es «idioma de origen»
   * y aquí, al generar, es «idioma de la tarjeta». Lo que se comparte son los dos
   * selectores y la regla de que en repaso general solo hay uno.
   */
  labels: { source: MessageKey; target: MessageKey };
  source: string;
  target: string;
  studyMode: DeckStudyMode;
  onSourceChange?: (value: string) => void;
  onTargetChange?: (value: string) => void;
}) {
  const tr = useT();
  const languages = deckLanguages();
  const general = studyMode === "general";

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field
        label={tr(general ? "general.contentLanguage" : labels.source)}
        htmlFor={names.source}
      >
        <Select
          id={names.source}
          name={names.source}
          value={source}
          onChange={
            onSourceChange
              ? (event) => onSourceChange(event.target.value)
              : undefined
          }
          defaultValue={onSourceChange ? undefined : source}
        >
          {languages.map((language) => (
            <option key={language.code} value={language.code}>
              {language.label}
            </option>
          ))}
        </Select>
      </Field>

      {/* En repaso general no hay traducción, así que preguntar el idioma de
          destino sería una pregunta sin respuesta. */}
      {general ? null : (
        <Field label={tr(labels.target)} htmlFor={names.target}>
          <Select
            id={names.target}
            name={names.target}
            value={target}
            onChange={
              onTargetChange
                ? (event) => onTargetChange(event.target.value)
                : undefined
            }
            defaultValue={onTargetChange ? undefined : target}
          >
            {languages.map((language) => (
              <option key={language.code} value={language.code}>
                {language.label}
              </option>
            ))}
          </Select>
        </Field>
      )}
    </div>
  );
}

/** El nivel: un texto libre, porque el nivel lo pone quien sabe el idioma. */
export function LevelField({
  name,
  value,
  studyMode,
  onChange,
}: {
  name: string;
  value: string | null;
  studyMode: DeckStudyMode;
  onChange?: (value: string) => void;
}) {
  const tr = useT();
  const general = studyMode === "general";

  return (
    <Field
      label={tr("deckField.level")}
      htmlFor={name}
      hint={tr(general ? "general.levelHint" : "deckField.levelHint")}
    >
      <input
        id={name}
        name={name}
        value={value ?? ""}
        onChange={
          onChange ? (event) => onChange(event.target.value) : undefined
        }
        defaultValue={onChange ? undefined : (value ?? "")}
        placeholder={tr(
          general ? "general.levelPlaceholder" : "mazoNuevo.levelPlaceholder",
        )}
        className={inputClass}
      />
    </Field>
  );
}

/** Quién puede ver el mazo. */
export function VisibilityField({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange?: (value: string) => void;
}) {
  const tr = useT();

  return (
    <Field label={tr("deckField.visibility")} htmlFor={name}>
      <Select
        id={name}
        name={name}
        value={value}
        onChange={
          onChange ? (event) => onChange(event.target.value) : undefined
        }
        defaultValue={onChange ? undefined : value}
      >
        <option value="private">{tr("visibility.option.private")}</option>
        <option value="public">{tr("visibility.option.public")}</option>
      </Select>
    </Field>
  );
}
