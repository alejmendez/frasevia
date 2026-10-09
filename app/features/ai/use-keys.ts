import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

/** Cuánto se agrupan las pulsaciones antes de escribir en disco. */
const WRITE_DELAY = 400;

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
 * La fuente de verdad es `localStorage` y se escribe mientras se escribe, no al
 * pulsar un botón: si alguien pega una clave y se le cierra la pestaña, no
 * pierde nada. Un botón de «Guardar» sobre eso solo daría la falsa impresión de
 * que queda algo pendiente, así que la confirmación va en el estado. El estado
 * de React solo refleja lo que se está escribiendo, para pintar.
 *
 * Lo que sí se retrasa es la escritura en disco. `localStorage.setItem` es
 * síncrono y bloquea el hilo principal, de modo que llamarlo en cada tecla
 * convertía cada pulsación en una espera de disco. Las pulsaciones se agrupan
 * en un temporizador corto, y lo último que quede pendiente se escribe al salir.
 *
 * Para poder seguir avisando cuando el navegador no deja escribir (modo
 * privado, cookies de terceros) se comprueba una sola vez por pantalla, en lugar
 * de en cada tecla.
 */
export function useAiKey(): AiKey {
  const [key, setKeyState] = useState<KeyState>(() => read());
  const pending = useRef<number | null>(null);
  const writable = useRef<boolean | null>(null);
  // Lo último tecleado, para poder escribirlo si la pantalla se desmonta antes
  // de que venza el temporizador. Un ref y no el estado, porque el estado cambia
  // en cada tecla y el efecto de limpieza debe correr solo al desmontar.
  const latest = useRef(key.value);

  /** ¿Deja este navegador escribir en `localStorage`? Se pregunta una vez. */
  const storageWorks = useCallback(() => {
    if (writable.current === null) {
      try {
        localStorage.setItem("frasevia-sondeo", "1");
        localStorage.removeItem("frasevia-sondeo");
        writable.current = true;
      } catch {
        writable.current = false;
      }
    }

    return writable.current;
  }, []);

  const save = useCallback(
    (value: string) => {
      if (!storageWorks()) {
        // Sin almacenamiento no se puede recordar nada: el cambio se aplica
        // solo en esta pestaña, y quien llama lo avisa.
        setKeyState({
          value,
          preview: value === "" ? "" : maskKey(value),
          saved: false,
        });
        return false;
      }

      // Lo que se pinta sale ya: el campo no puede esperar a disco para mostrar
      // la clave que se acaba de teclear.
      latest.current = value;
      setKeyState({
        value,
        preview: value === "" ? "" : maskKey(value),
        saved: value !== "",
      });

      if (pending.current !== null) {
        window.clearTimeout(pending.current);
      }
      pending.current = window.setTimeout(() => {
        pending.current = null;
        setKey(value);
      }, WRITE_DELAY);

      return true;
    },
    [storageWorks],
  );

  const forget = useCallback(() => {
    if (pending.current !== null) {
      window.clearTimeout(pending.current);
      pending.current = null;
    }
    latest.current = "";
    forgetKey();
    setKeyState(read());
  }, []);

  // Escribir lo último que quedó pendiente: si la pantalla se desmonta con una
  // escritura en el aire (al navegar, por ejemplo), no se pierde. Las
  // dependencias están vacías a propósito: el efecto debe correr solo al
  // desmontar, y `latest` es justamente un ref para poder leer el valor final
  // sin volver a disparar la limpieza en cada tecla.
  useEffect(
    () => () => {
      if (pending.current === null) {
        return;
      }
      window.clearTimeout(pending.current);
      pending.current = null;
      setKey(latest.current);
    },
    [],
  );

  // El objeto devuelto era nuevo en cada render, así que no habría servido como
  // dependencia de un `useMemo` de quien lo use.
  return useMemo(() => ({ key, save, forget }), [key, save, forget]);
}
