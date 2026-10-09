import { type ReactNode, useState } from "react";
import { useFetcher } from "react-router";

import { useT } from "~/lib/locale-context";

import { ModalDialog } from "./dialog";
import { Button } from "./ui";

/**
 * Un botón que pide confirmación y luego envía un `fetcher.Form` al mismo destino.
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
  children: ReactNode;
  triggerClassName?: string;
}) {
  const fetcher = useFetcher<ConfirmActionResult>();
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
        <ModalDialog labelledBy="confirm-title" onClose={() => setOpen(false)}>
          <div className="p-6">
            <h2 id="confirm-title" className="font-display text-xl text-ink">
              {title}
            </h2>
            <p className="mt-2 text-sm text-ink-soft">{description}</p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <fetcher.Form method="post" action={action}>
                <input type="hidden" name="intent" value={intent} />
                {Object.entries(fields ?? {}).map(([name, value]) => (
                  <input key={name} type="hidden" name={name} value={value} />
                ))}
                {failedMessage(fetcher.data) ? (
                  <p
                    role="alert"
                    className="mr-auto max-w-56 text-sm text-danger"
                  >
                    {failedMessage(fetcher.data)}
                  </p>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setOpen(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="danger"
                  disabled={fetcher.state !== "idle"}
                >
                  {fetcher.state === "idle"
                    ? confirmLabel
                    : t("common.deleting")}
                </Button>
              </fetcher.Form>
            </div>
          </div>
        </ModalDialog>
      ) : null}
    </>
  );
}

/**
 * Lo que un action devuelve cuando algo falla.
 *
 * Acepta las dos formas que hay en la aplicación —`{error}` y `{ok, message}`—
 * porque las acciones se escribieron en momentos distintos y ninguna se ocupa de
 * normalizarlo. Antes este componente solo miraba `error`, así que en las rutas
 * que devuelven `{ok, message}` el fallo no se veía: el diálogo se quedaba ahí,
 * sin explicación, esperando.
 */
interface ConfirmActionResult {
  ok?: boolean;
  message?: string;
  error?: string;
}

function failedMessage(data: ConfirmActionResult | undefined): string | null {
  if (!data) return null;
  if (data.ok === false) return data.message ?? data.error ?? null;
  return data.error ?? null;
}
