import { useCallback, useEffect, useRef, useState } from "react";

import { isAbort } from "./generate";

/**
 * Una tarea larga que se puede cancelar.
 *
 * Generar un mazo con IA son varios segundos de espera, y durante ellos hay dos
 * cosas que la persona puede querer: mirar otra cosa, o cambiar de idea. Sin esto,
 * la petición sigue viva y el resultado aparece en una pantalla que ya no está.
 *
 * El `AbortController` se cancela también al desmontar, por el mismo motivo: quien
 * se fue no va a leer lo que responda, y el trabajo se paga igual.
 */
export interface AbortableTask {
  /** Si hay una tarea en curso. */
  busy: boolean;
  /** Lanza la tarea. Se cancela sola si otra empieza antes. */
  run: (work: (signal: AbortSignal) => Promise<void>) => Promise<void>;
  /** Cancela lo que esté en curso. */
  cancel: () => void;
}

export function useAbortableTask(): AbortableTask {
  const [busy, setBusy] = useState(false);
  const controller = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    controller.current?.abort();
    controller.current = null;
  }, []);

  useEffect(() => cancel, [cancel]);

  return {
    busy,
    cancel,
    async run(work) {
      // Empezar una antes de que termine la otra cancela la anterior: el resultado
      // viejo no interesa y aparecería después del nuevo.
      controller.current?.abort();
      const current = new AbortController();
      controller.current = current;
      setBusy(true);

      try {
        await work(current.signal);
      } catch (cause) {
        // Cancelar no es un fallo. Lo que no sea cancelación se propaga para que
        // quien llama lo muestre.
        if (!isAbort(cause)) throw cause;
      } finally {
        // Solo quien sigue en curso puede dar la tarea por terminada: si llegó una
        // nueva mientras esta esperaba, no es suya.
        if (controller.current === current) {
          controller.current = null;
          setBusy(false);
        }
      }
    },
  };
}
