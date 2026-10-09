import {
  SpeakerHighIcon,
  SpeakerLowIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui";
import { useT } from "~/lib/locale-context";
import { selectSpeechVoice } from "./speech";

/**
 * Los dos botones de pronunciación: a velocidad normal y despacio.
 *
 * El reproductor del navegador, no un servicio: no hay ninguna clave, ninguna
 * llamada y ninguna tarjeta sale del equipo. Por eso los avisos de «no hay voces
 * para este idioma» son parte de la interfaz y no un error escondido.
 *
 * Las voces llegan de forma asíncrona —el navegador las carga cuando quiere— así
 * que hay que preguntar dos veces: una al montar y otra cuando avisa de que ya
 * están.
 */
export function PronunciationControls({
  text,
  language,
}: {
  text: string;
  language: string;
}) {
  const tr = useT();
  const [notice, setNotice] = useState<"unavailable" | "no-voice" | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;

    const synthesis = window.speechSynthesis;
    const updateVoices = () => setVoices(synthesis.getVoices());
    updateVoices();
    synthesis.addEventListener("voiceschanged", updateVoices);
    return () => synthesis.removeEventListener("voiceschanged", updateVoices);
  }, []);

  useEffect(
    () => () => {
      // Si quien ya se fue al revés a media palabra, que no siga sonando.
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    },
    [],
  );

  function speak(rate: number) {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      typeof SpeechSynthesisUtterance === "undefined"
    ) {
      setNotice("unavailable");
      return;
    }

    const synthesis = window.speechSynthesis;
    synthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const available = voices.length > 0 ? voices : synthesis.getVoices();
    const voice = selectSpeechVoice(available, language);

    // Sin voz para este idioma se dice en pantalla en vez de pronunciar algo
    // aproximado en otro idioma, que es peor que no pronunciar nada.
    if (!voice) {
      setNotice("no-voice");
      return;
    }

    setNotice(null);
    utterance.lang = voice.lang;
    utterance.voice = voice;
    utterance.rate = rate;
    synthesis.speak(utterance);
  }

  return (
    <div>
      <fieldset className="mt-3 flex flex-wrap gap-2">
        <legend className="sr-only">{tr("estudiar.audioControls")}</legend>
        <Button
          type="button"
          variant="secondary"
          className="min-h-10 px-3 py-2"
          aria-label={tr("estudiar.audioNormalLabel", { text })}
          onClick={() => speak(1)}
        >
          <SpeakerHighIcon aria-hidden size={18} weight="fill" />
          {tr("estudiar.audioNormal")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="min-h-10 px-3 py-2"
          aria-label={tr("estudiar.audioSlowLabel", { text })}
          onClick={() => speak(0.75)}
        >
          <SpeakerLowIcon aria-hidden size={18} weight="fill" />
          {tr("estudiar.audioSlow")}
        </Button>
      </fieldset>
      {notice ? (
        <p role="status" className="mt-2 text-sm text-ink-soft">
          {tr(
            notice === "unavailable"
              ? "estudiar.audioUnavailable"
              : "estudiar.audioVoiceUnavailable",
          )}
        </p>
      ) : null}
    </div>
  );
}
