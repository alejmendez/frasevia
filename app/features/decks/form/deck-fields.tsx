import type { ChangeEvent } from "react";

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
          {...selectProps(source, onSourceChange)}
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
            {...selectProps(target, onTargetChange)}
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
        {...inputProps(value ?? "", onChange)}
        placeholder={tr(
          general ? "general.levelPlaceholder" : "mazoNuevo.levelPlaceholder",
        )}
        className={inputClass}
      />
    </Field>
  );
}

/**
 * Las props de un campo, según quién lo controla.
 *
 * React avisa cuando un campo trae `value` y `defaultValue` a la vez, y tiene
 * razón: un campo no puede estar controlado y sin controlar al mismo tiempo.
 * Lo decide el `onChange`: si está, el campo es controlado y lleva `value`; si
 * no, lo gestiona el navegador y lleva `defaultValue`. La pantalla de creación
 * de mazos usa lo segundo, porque sus valores cambian mientras se escribe.
 */
function inputProps(
  value: string,
  onChange?: (value: string) => void,
):
  | { value: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void }
  | { defaultValue: string } {
  return onChange
    ? {
        value,
        onChange: (event: ChangeEvent<HTMLInputElement>) =>
          onChange(event.target.value),
      }
    : { defaultValue: value };
}

/** Lo mismo, para un desplegable. */
function selectProps(
  value: string,
  onChange?: (value: string) => void,
):
  | {
      value: string;
      onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
    }
  | { defaultValue: string } {
  return onChange
    ? {
        value,
        onChange: (event: ChangeEvent<HTMLSelectElement>) =>
          onChange(event.target.value),
      }
    : { defaultValue: value };
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
      <Select id={name} name={name} {...selectProps(value, onChange)}>
        <option value="private">{tr("visibility.option.private")}</option>
        <option value="public">{tr("visibility.option.public")}</option>
      </Select>
    </Field>
  );
}
