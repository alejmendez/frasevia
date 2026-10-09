import type { ComponentProps, ReactNode } from "react";

import { cx } from "./layout";

/**
 * Los campos de un formulario.
 *
 * `Field` es solo la etiqueta y su ayuda: el control va como hijo, para que cada
 * pantalla pueda poner un `<input>`, un `<select>` o algo composed sin que este
 * archivo tenga que saber de todos ellos.
 */

/** Las clases de un campo de texto, por si hay que aplicarlas a algo raro. */
export const inputClass =
  "w-full rounded-lg border border-line-strong bg-paper-raised px-3 py-2.5 text-ink placeholder:text-ink-faint focus:border-brand";

export const textareaClass = cx(
  inputClass,
  "min-h-24 resize-y leading-relaxed",
);

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  required,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  /** El error ya traducido. Se anuncia con `role="alert"` al aparecer. */
  error?: string | null;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
        {required ? (
          <span className="ml-1 text-accent" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {hint ? <p className="text-xs text-ink-faint">{hint}</p> : null}
      {children}
      {error ? (
        <p role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cx(textareaClass, className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cx(inputClass, className)} {...props} />;
}
