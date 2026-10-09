import { useEffect, useRef, useState } from "react";

/**
 * Copiar al portapapeles y avisar durante un momento.
 *
 * Son tres cosas juntas —un estado, un temporizador y su limpieza— y solo están
 * para decir «copiado» un instante. El temporizador vive en un `ref` porque hay
 * que poder cancelarlo al copiar otra vez antes de que venza el anterior, o el
 * aviso desaparecería antes de tiempo.
 *
 * Devuelve si funcionó en vez de lanzar: si el navegador no deja copiar, quien
 * está usando la aplicación necesita leerlo y no ver una pantalla rota.
 */
export function useCopyToClipboard(howLong = 2500): {
  copied: boolean;
  copy: (text: string) => Promise<boolean>;
} {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  return {
    copied,
    async copy(text: string): Promise<boolean> {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        if (timer.current !== null) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopied(false), howLong);
        return true;
      } catch {
        return false;
      }
    },
  };
}
