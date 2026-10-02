import { useEffect, useState } from "react";
import { useHref } from "react-router";

import {
  type GoogleAvailability,
  googleAvailability,
  startGoogleAccess,
} from "~/lib/google-auth";
import { useT } from "~/lib/locale-context";

import { Alert, Button } from "./ui";

/**
 * Acceso con Google, para las pantallas de entrar y de crear cuenta.
 *
 * Va en su propio componente y no dentro de cada formulario para que las dos
 * pantallas ofrezcan exactamente el mismo botón, el mismo texto y los mismos
 * errores.
 *
 * El botón **desaparece solo** si el proyecto de Supabase tiene el proveedor
 * apagado, en lugar de llevar a una página de error de Supabase que no explica
 * nada. Al encender el proveedor en el panel, el botón reaparece sin compilar ni
 * republicar nada, porque la comprobación se hace en vivo.
 */
export function GoogleSignIn({
  redirectTo,
  label,
}: {
  /** Ruta interna a la que ir después de entrar. */
  redirectTo: string;
  label: string;
}) {
  const t = useT();
  const homeHref = useHref("/");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [availability, setAvailability] =
    useState<GoogleAvailability>("unknown");

  useEffect(() => {
    let active = true;

    void googleAvailability().then((result) => {
      if (active) {
        setAvailability(result);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  async function handleClick() {
    setError(null);
    setPending(true);

    const result = await startGoogleAccess({ redirectTo, homeHref });

    // El camino feliz no vuelve: `startGoogleAccess` solo responde cuando algo
    // falló, porque en caso contrario el navegador ya está en Google.
    if (!result.ok) {
      setError(result.message);
      setPending(false);
    }
  }

  if (availability === "disabled") {
    return (
      <div className="mt-6">
        <Divider />
        <p className="mt-4 text-sm text-ink-soft">{t("google.disabled")}</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <Divider />

      {error ? (
        <div className="mt-4">
          <Alert variant="error">{error}</Alert>
        </div>
      ) : null}

      <div className="mt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={handleClick}
          disabled={pending}
          aria-busy={pending}
          className="w-full"
        >
          <GoogleMark />
          {pending ? t("google.opening") : label}
        </Button>
      </div>

      <p className="mt-3 text-xs text-ink-faint">{t("google.privacy")}</p>
    </div>
  );
}

/** Separador con la «o» en medio, entre el formulario y el acceso con Google. */
function Divider() {
  const t = useT();

  return (
    <div className="flex items-center gap-3 text-xs text-ink-faint">
      <span aria-hidden="true" className="h-px flex-1 bg-line" />
      {t("google.divider")}
      <span aria-hidden="true" className="h-px flex-1 bg-line" />
    </div>
  );
}

/**
 * La «G» de Google.
 *
 * Va en línea y como SVG por dos razones: la marca pide ese dibujo exacto, y
 * una imagen remota añadiría una petición a la CSP y un destino más que
 * bloquear. Los cuatro colores son los de la marca; el resto de la aplicación
 * no los usa, y aquí son parte del logotipo.
 */
function GoogleMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      className="size-4 shrink-0"
      focusable="false"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
