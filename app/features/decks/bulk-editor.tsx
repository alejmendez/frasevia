import { useEffect, useState } from "react";
import { useFetcher } from "react-router";

import { ModalDialog } from "~/components/dialog";
import { Button } from "~/components/ui";
import { useCopyToClipboard } from "~/features/ai/use-copy-to-clipboard";
import { useT } from "~/lib/locale-context";
import type { Card } from "~/lib/types";

import { cardsToJson } from "./bulk-cards";

/**
 * El diálogo de la edición masiva con JSON.
 *
 * El textarea arranca con el JSON del mazo, así que el ida y vuelta es sin
 * intermediarios: se copia, se pega lo que devuelve el modelo encima y se
 * guarda. Lo que se copia para el modelo son las instrucciones y el JSON
 * juntos, porque pegarlos en dos trozos es donde se cuelan los errores.
 *
 * El guardado va por un `fetcher` y no por un formulario normal para que la
 * pantalla no se recargue: el mazo se ve mientras se guarda, y el error —si lo
 * hay— aparece en el diálogo, encima del JSON, sin perder lo que se había
 * pegado.
 */
export function BulkCardsDialog({
  cards,
  onClose,
}: {
  cards: Card[];
  onClose: () => void;
}) {
  const tr = useT();
  const fetcher = useFetcher<{ ok: boolean; message: string }>();
  const { copied, copy } = useCopyToClipboard();
  const [text, setText] = useState(() => cardsToJson(cards));
  const [copyError, setCopyError] = useState<string | null>(null);

  // El diálogo se cierra solo cuando el guardado sale bien. Si falla, se
  // queda abierto con el error encima, que es lo que hay que ver.
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.ok) {
      onClose();
    }
  }, [fetcher.state, fetcher.data, onClose]);

  const error = fetcher.data && !fetcher.data.ok ? fetcher.data.message : null;

  /**
   * Copia al portapapeles y avisa si no se pudo.
   *
   * El portapapeles puede estar bloqueado —el navegador lo pide, y hay
   * contextos donde no se concede— y sin este aviso el botón parecería roto:
   * no pasa nada y no se explica por qué.
   */
  async function copyText(value: string) {
    const ok = await copy(value);
    setCopyError(ok ? null : tr("edicionMasiva.copyFailed"));
  }

  return (
    <ModalDialog labelledBy="bulk-cards-title" onClose={onClose} width="wide">
      <div className="p-6">
        <h2 id="bulk-cards-title" className="font-display text-xl text-ink">
          {tr("edicionMasiva.title")}
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          {tr("edicionMasiva.description")}
        </p>

        <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-ink-soft">
          <li>{tr("edicionMasiva.step1")}</li>
          <li>{tr("edicionMasiva.step2")}</li>
          <li>{tr("edicionMasiva.step3")}</li>
        </ol>

        <fetcher.Form method="post" className="mt-4">
          <input type="hidden" name="intent" value="bulk-cards" />

          <label htmlFor="bulk-cards-json" className="sr-only">
            {tr("edicionMasiva.jsonLabel")}
          </label>
          <textarea
            id="bulk-cards-json"
            name="json"
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={14}
            spellCheck={false}
            className="w-full rounded-lg border border-line-strong bg-paper-sunken p-3 font-mono text-xs text-ink"
          />

          {error ? (
            <p role="alert" className="mt-2 text-sm text-danger">
              {error}
            </p>
          ) : null}

          <p className="mt-2 text-xs text-ink-faint">
            {tr("edicionMasiva.rules")}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                copyText(`${tr("edicionMasiva.prompt")}\n\n${text}`)
              }
            >
              {tr("edicionMasiva.copyForAi")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => copyText(text)}
            >
              {tr("edicionMasiva.copyJson")}
            </Button>
            <Button type="submit" disabled={fetcher.state !== "idle"}>
              {fetcher.state === "idle"
                ? tr("edicionMasiva.apply")
                : tr("edicionMasiva.saving")}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              {tr("common.cancel")}
            </Button>
            {copied ? (
              <span role="status" className="text-xs text-ink-faint">
                {tr("edicionMasiva.copied")}
              </span>
            ) : null}
            {copyError ? (
              <span role="alert" className="text-xs text-danger">
                {copyError}
              </span>
            ) : null}
          </div>
        </fetcher.Form>
      </div>
    </ModalDialog>
  );
}
