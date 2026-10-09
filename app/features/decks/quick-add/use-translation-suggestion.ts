import { useEffect, useRef, useState } from "react";

import { TERM_MAX } from "~/features/ai/draft";
import {
  GenerationError,
  isAbort,
  suggestTranslation,
} from "~/features/ai/generate";
import { hasKey } from "~/features/ai/keys";
import { useT } from "~/lib/locale-context";

/**
 * Los dos campos de la traducción y la sugerencia que los rellena.
 *
 * Estaban repartidos en seis piezas que había que mantener de acuerdo: el idioma
 * adivinado en un estado, los dos textos en otros dos, un `ref` para acordarse de
 * si alguien ya había escrito, un estado para la fase de la sugerencia y otro
 * para su mensaje de error. Y el mensaje podía quedar pegado a una fase que ya no
 * era la del error.
 *
 * Aquí el estado de la sugerencia es un solo objeto —no hay forma de tener medio
 * estado— y los campos viven en este archivo porque quien los rellena es él.
 */

/** En qué punto está la sugerencia. */
export type Suggestion =
  /** Se está pidiendo. */
  | { status: "loading" }
  /** Llegó, y ya se puso en el campo que estaba vacío. */
  | { status: "ready" }
  /** Falló. El mensaje ya está traducido. */
  | { status: "error"; message: string }
  /** No hay clave de un proveedor: no se puede pedir nada. */
  | { status: "missing-key" }
  /** El texto es más largo de lo que admite una tarjeta. */
  | { status: "too-long" };

/** El idioma que se supone al texto seleccionado. */
export type SourceLanguage = "en" | "es";

export interface TranslationFields {
  english: string;
  spanish: string;
  setEnglish: (value: string) => void;
  setSpanish: (value: string) => void;
  /** De qué idioma parece ser el texto seleccionado. */
  source: SourceLanguage;
  /** Cambia de idioma: vuelve a poner el texto en su campo y a pedir traducción. */
  setSource: (language: SourceLanguage) => void;
  suggestion: Suggestion;
}

/** El idioma que parece tener el texto, por las palabras que usa. */
export function guessLanguage(text: string): SourceLanguage {
  return /[ñáéíóú¿¡]|\b(?:el|la|los|las|una?|que|de|del|para|con|pero|está)\b/i.test(
    text,
  )
    ? "es"
    : "en";
}

export function useTranslationFields(text: string): TranslationFields {
  const tr = useT();

  // El idioma se adivina una vez, al montar: el texto seleccionado no cambia
  // mientras el diálogo está abierto, y el diálogo se remonta con cada texto.
  const [source, setSourceLanguage] = useState<SourceLanguage>(() =>
    guessLanguage(text),
  );
  const [english, setEnglish] = useState(() => (source === "en" ? text : ""));
  const [spanish, setSpanish] = useState(() => (source === "es" ? text : ""));
  const [suggestion, setSuggestion] = useState<Suggestion>({
    status: "loading",
  });

  // Va en un `ref` y no en un estado porque el efecto que lo consulta no debe
  // volver a correr por escribir: solo por cambiar el texto o el idioma.
  const edited = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: el traductor solo se usa para el mensaje de error. Relanzar una traducción pagada porque cambió el idioma no vale lo que cuesta.
  useEffect(() => {
    const targetLanguage = source === "en" ? "es" : "en";
    const controller = new AbortController();
    let active = true;

    // El texto no cabe en una tarjeta: ni siquiera tiene sentido traducirlo, y la
    // traducción saldría igual de larga.
    if (text.length > TERM_MAX) {
      setSuggestion({ status: "too-long" });
      return () => {
        active = false;
        controller.abort();
      };
    }

    // Sin clave no hay a quién preguntar. Se dice en pantalla en vez de fallar en
    // silencio, porque el camino de importar funciona sin IA.
    if (!hasKey()) {
      setSuggestion({ status: "missing-key" });
      return () => {
        active = false;
        controller.abort();
      };
    }

    setSuggestion({ status: "loading" });

    void suggestTranslation({
      text,
      sourceLanguage: source,
      targetLanguage,
      signal: controller.signal,
    })
      .then((result) => {
        if (!active) return;
        setSuggestion({ status: "ready" });
        // No se pisa lo que alguien está escribiendo: la sugerencia solo rellena un
        // campo que siga vacío.
        if (edited.current) return;
        if (source === "en") setSpanish(result);
        else setEnglish(result);
      })
      .catch((cause: unknown) => {
        // Cancelar no es un fallo: es quien cerró el diálogo.
        if (!active || isAbort(cause)) return;
        setSuggestion({
          status: "error",
          message:
            cause instanceof GenerationError
              ? cause.message
              : tr("selection.translationSuggestionFailed"),
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [source, text]);

  /** Escribir a mano: a partir de ahí la sugerencia no toca los campos. */
  function writeTo(
    current: string,
    write: (value: string) => void,
  ): (value: string) => void {
    return (next: string) => {
      if (next !== current) edited.current = true;
      write(next);
    };
  }

  return {
    english,
    spanish,
    setEnglish: writeTo(english, setEnglish),
    setSpanish: writeTo(spanish, setSpanish),
    source,
    setSource(language) {
      if (language === source) return;

      // El texto seleccionado vuelve a su campo y se olvida que se había escrito
      // a mano. Lo que hay en el otro campo era la traducción que se pidió para el
      // idioma que resultó equivocado, así que hay que volver a pedirla.
      edited.current = false;
      setSourceLanguage(language);
      setEnglish(language === "en" ? text : "");
      setSpanish(language === "es" ? text : "");
    },
    suggestion,
  };
}
