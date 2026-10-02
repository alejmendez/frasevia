import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";

import { useT } from "~/lib/locale-context";

import { Button } from "./ui";

/**
 * Confirmación antes de una acción destructiva.
 *
 * Usa `<dialog>` nativo: el foco queda atrapado dentro del modal, `Esc` lo
 * cierra y los lectores de pantalla lo anuncian, sin código extra.
 */
function ConfirmDialog({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: (close: () => void) => React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // El diálogo existe solo cuando alguien pidió confirmar, así que se abre al
  // montar.
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const close = () => dialogRef.current?.close();

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="confirm-title"
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-card border border-line bg-paper-raised p-0 text-ink shadow-xl backdrop:bg-ink/40"
      onCancel={(event) => {
        // `Esc` cierra el diálogo; el formulario nunca llega a enviarse.
        event.preventDefault();
        close();
      }}
    >
      <div className="p-6">
        <h2 id="confirm-title" className="font-display text-xl text-ink">
          {title}
        </h2>
        <p className="mt-2 text-sm text-ink-soft">{description}</p>
        <div className="mt-6 flex items-center justify-end gap-2">
          {children(close)}
        </div>
      </div>
    </dialog>
  );
}

/**
 * Botón que pide confirmación y luego envía un `fetcher.Form` al mismo destino.
 *
 * Se usa `useFetcher` para que el borrado no recargue la página ni pierda el
 * scroll, y para poder mostrar un error sin sacar a la persona de donde estaba.
 */
export function ConfirmSubmit({
  action,
  intent,
  fields,
  title,
  description,
  confirmLabel,
  children,
  triggerClassName,
}: {
  /** Destino del envío. Si se omite, va a la ruta actual. */
  action?: string;
  /** Campo `intent` que identifica la operación en el action. */
  intent: string;
  /** Campos ocultos adicionales que necesita la operación. */
  fields?: Record<string, string>;
  title: string;
  description: string;
  confirmLabel: string;
  children: React.ReactNode;
  triggerClassName?: string;
}) {
  const fetcher = useFetcher<{ error?: string }>();
  const [open, setOpen] = useState(false);
  const t = useT();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerClassName}
      >
        {children}
      </button>

      {open ? (
        <ConfirmDialog title={title} description={description}>
          {(close) => (
            <fetcher.Form method="post" action={action}>
              <input type="hidden" name="intent" value={intent} />
              {Object.entries(fields ?? {}).map(([name, value]) => (
                <input key={name} type="hidden" name={name} value={value} />
              ))}
              {fetcher.data?.error ? (
                <p
                  role="alert"
                  className="mr-auto max-w-56 text-sm text-danger"
                >
                  {fetcher.data.error}
                </p>
              ) : (
                <Button type="button" variant="ghost" onClick={close}>
                  {t("common.cancel")}
                </Button>
              )}
              <Button
                type="submit"
                variant="danger"
                disabled={fetcher.state !== "idle"}
              >
                {fetcher.state === "idle" ? confirmLabel : t("common.deleting")}
              </Button>
            </fetcher.Form>
          )}
        </ConfirmDialog>
      ) : null}
    </>
  );
}
