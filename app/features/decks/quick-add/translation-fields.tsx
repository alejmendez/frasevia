import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";
import { Link } from "react-router";

import { Alert, Field, inputClass } from "~/components/ui";
import { useT } from "~/lib/locale-context";

import type { SourceLanguage, Suggestion } from "./use-translation-suggestion";

/**
 * Los dos campos de la traducción y lo que se les avisa.
 *
 * Los dos campos eran dos bloques de once líneas que solo cambiaban en el `id`,
 * el `lang` y el tope; y los cuatro estados de la sugerencia eran cuatro bloques
 * de JSX con el mismo envoltorio. Aquí están una vez cada uno, y quien lee el
 * diálogo ve el formulario y no la mecánica.
 */

/**
 * Un campo de traducción.
 *
 * El `maxLength` lo pone quien llama porque los dos límites son distintos: el
 * término se topa antes que la traducción, y por eso no se puede dejar aquí un
 * valor por defecto sin que alguien se pregunte cuál de los dos es.
 */
export function TranslationInput({
  id,
  lang,
  label,
  value,
  maxLength,
  autoFocus,
  onChange,
}: {
  id: string;
  /** El idioma del texto, para que el corrector no lo cambie por otro. */
  lang: SourceLanguage;
  label: string;
  value: string;
  maxLength: number;
  autoFocus?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label} htmlFor={id}>
      <input
        id={id}
        lang={lang}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        required
        // biome-ignore lint/a11y/noAutofocus: es un modal que se acaba de abrir, y el campo a completar es el del idioma de origen.
        autoFocus={autoFocus}
        className={inputClass}
      />
    </Field>
  );
}

/**
 * Lo que se avisa de la traducción automática.
 *
 * Los cinco casos no son cinco pantallas: son «nada que decir», «se está
 * pidiendo», «ya está», «falló» y «no se puede pedir». Solo los tres últimos se
 * ven, y por eso están en un `switch` y no en cuatro `&&`.
 */
export function SuggestionNotice({
  suggestion,
  onClose,
}: {
  suggestion: Suggestion;
  /** Para que el enlace a los ajustes cierre el diálogo al navegar. */
  onClose: () => void;
}) {
  const tr = useT();

  switch (suggestion.status) {
    case "loading":
      return (
        <p
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 rounded-lg border border-brand/20 bg-brand-muted px-3 py-2.5 text-sm text-brand-strong"
        >
          <CircleNotchIcon
            aria-hidden="true"
            size={18}
            className="shrink-0 animate-spin"
          />
          {tr("selection.translating")}
        </p>
      );

    case "ready":
      return (
        <p role="status" className="text-sm text-ink-soft">
          {tr("selection.suggestionReady")}
        </p>
      );

    case "error":
      return <Alert variant="warning">{suggestion.message}</Alert>;

    case "missing-key":
      return (
        <p role="status" className="text-sm text-ink-soft">
          {tr("selection.translationNeedsKey")}{" "}
          <Link
            to="/ajustes/ia"
            onClick={onClose}
            className="font-medium text-brand underline"
          >
            {tr("selection.configureAi")}
          </Link>
        </p>
      );

    case "too-long":
      return (
        <p role="status" className="text-sm text-ink-soft">
          {tr("selection.translationTooLongForSuggestion")}
        </p>
      );
  }
}
