import { Field, inputClass, Select, textareaClass } from "~/components/ui";
import { MEANING_MAX, TERM_MAX } from "~/features/ai/draft";
import { cardKindLabel } from "~/lib/format";
import { useT } from "~/lib/locale-context";
import type { Card, DeckStudyMode } from "~/lib/types";

/**
 * Los campos de una tarjeta.
 *
 * Aparecían dos veces en el mismo archivo, con casi las mismas 80 líneas: una para
 * añadir una tarjeta nueva y otra por cada tarjeta que ya había. Solo cambiaban el
 * prefijo de los `name` y los valores por defecto, y eso no justifica dos
 * copias que se pueden desincronizar —que es exactamente lo que pasó con el
 * ejemplo en español de los mazos de repaso general.
 *
 * El prefijo lo resuelve el `id`: vacío para una tarjeta nueva, y `card:<id>`
 * para una que ya existe, que es lo que el action lee para saber cuál es cuál.
 */
export function CardFields({
  prefix,
  studyMode,
  card,
}: {
  /** `""` para una tarjeta nueva, `card:<id>` para una que ya está guardada. */
  prefix: string;
  studyMode: DeckStudyMode;
  /** Los valores iniciales. Sin él, los campos salen vacíos. */
  card?: Card;
}) {
  const tr = useT();
  const general = studyMode === "general";

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          prefix={prefix}
          field="term"
          area
          required
          maxLength={TERM_MAX}
          defaultValue={card?.term}
          label={tr(general ? "general.front" : "mazoEditar.fieldTerm")}
        />

        <TextField
          prefix={prefix}
          field="meaning_es"
          area
          required
          maxLength={MEANING_MAX}
          defaultValue={card?.meaning_es}
          label={tr(general ? "general.back" : "mazoEditar.fieldMeaning")}
        />

        <Field
          label={tr("mazoEditar.fieldKind")}
          htmlFor={idOf(prefix, "kind")}
        >
          <Select
            id={idOf(prefix, "kind")}
            name={nameOf(prefix, "kind")}
            defaultValue={card?.kind ?? (general ? "question" : "word")}
          >
            {/* En repaso general, «palabra» no es una palabra: es un concepto. */}
            <option value="word">
              {general ? tr("general.concept") : cardKindLabel("word")}
            </option>
            <option value="phrase">{cardKindLabel("phrase")}</option>
            <option value="question">{cardKindLabel("question")}</option>
            <option value="rule">{cardKindLabel("rule")}</option>
          </Select>
        </Field>

        <Field
          label={tr("mazoEditar.fieldTags")}
          htmlFor={idOf(prefix, "tags")}
          hint={tr("mazoEditar.tagsHint")}
        >
          <input
            id={idOf(prefix, "tags")}
            name={nameOf(prefix, "tags")}
            defaultValue={card?.tags.join(", ")}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="mt-4 grid gap-4">
        <TextField
          prefix={prefix}
          field="example_en"
          defaultValue={card?.example_en}
          label={tr(general ? "general.example" : "mazoEditar.fieldExampleEn")}
        />

        {/* Un mazo general no tiene traducción, así que el ejemplo en español no
            se puede editar. Pero tampoco se puede borrar: si no, cambiar el tipo
            de un mazo perdería los ejemplos que ya había. */}
        {general ? (
          <input
            type="hidden"
            name={nameOf(prefix, "example_es")}
            value={card?.example_es ?? ""}
          />
        ) : (
          <TextField
            prefix={prefix}
            field="example_es"
            defaultValue={card?.example_es}
            label={tr("mazoEditar.fieldExampleEs")}
          />
        )}

        <TextField
          prefix={prefix}
          field="usage_note"
          defaultValue={card?.usage_note}
          label={tr(general ? "general.note" : "mazoEditar.fieldUsageNote")}
        />
      </div>
    </>
  );
}

/** Un campo de texto, con o sin área, y con o sin prefijo. */
function TextField({
  prefix,
  field,
  label,
  area = false,
  required = false,
  maxLength,
  defaultValue,
}: {
  prefix: string;
  field: string;
  label: string;
  area?: boolean;
  required?: boolean;
  maxLength?: number;
  defaultValue?: string | null;
}) {
  const shared = {
    id: idOf(prefix, field),
    name: nameOf(prefix, field),
    required,
    maxLength,
    defaultValue: defaultValue ?? "",
  };

  return (
    <Field label={label} htmlFor={shared.id} required={required}>
      {area ? (
        <textarea {...shared} className={textareaClass} />
      ) : (
        <input {...shared} className={inputClass} />
      )}
    </Field>
  );
}

function idOf(prefix: string, field: string): string {
  return prefix === "" ? `card-${field}` : `${prefix}-${field}`;
}

function nameOf(prefix: string, field: string): string {
  return prefix === "" ? field : `${prefix}:${field}`;
}
