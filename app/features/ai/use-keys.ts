import { useCallback, useState } from "react";

import { forgetKey, getKey, maskKey, setKey } from "./keys";

export interface KeyState {
  /** La clave en claro, para poder editarla o vaciarla. */
  value: string;
  /** Final de la clave, para reconocerla sin enseñarla entera. */
  preview: string;
  saved: boolean;
}

export interface AiKey {
  key: KeyState;
  save: (value: string) => boolean;
  forget: () => void;
}

function read(): KeyState {
  const value = getKey() ?? "";
  return {
    value,
    preview: value === "" ? "" : maskKey(value),
    saved: value !== "",
  };
}

/**
 * Estado de la clave de IA en una pantalla.
 *
 * La fuente de verdad es `localStorage` y se escribe en cada tecla, no al pulsar
 * un botón: si alguien pega una clave y se le cierra la pestaña, no pierde nada.
 * Un botón de «Guardar» sobre eso solo daría la falsa impresión de que queda
 * algo pendiente, así que la confirmación va en el estado. El estado de React
 * solo refleja el almacenamiento, para pintar.
 */
export function useAiKey(): AiKey {
  const [key, setKeyState] = useState<KeyState>(() => read());

  const save = useCallback((value: string) => {
    const stored = setKey(value);
    setKeyState(read());
    return stored;
  }, []);

  const forget = useCallback(() => {
    forgetKey();
    setKeyState(read());
  }, []);

  return { key, save, forget };
}
