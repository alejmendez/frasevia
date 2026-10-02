import { useState } from "react";
import { Link } from "react-router";
import {
  Alert,
  Button,
  Card,
  Field,
  inputClass,
  Page,
  PageHeader,
  SectionTitle,
} from "~/components/ui";
import { PROVIDER } from "~/features/ai/providers";
import { useAiKey } from "~/features/ai/use-keys";

export function meta() {
  return [{ title: "Ajustes de IA — Frasevia" }];
}

/**
 * Gestión de la clave de OpenRouter.
 *
 * Lo que se explica aquí es lo que de verdad decide si la clave está a salvo, y
 * por eso no es texto de relleno: `localStorage` no protege de nada frente a
 * JavaScript, así que lo único que evita que una clave robada sirva de algo es
 * haberla limitado en el panel del proveedor.
 */
export default function AjustesIa() {
  const { key, save, forget } = useAiKey();
  const [storageError, setStorageError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  return (
    <Page className="max-w-2xl">
      <PageHeader
        eyebrow="Ajustes"
        title="Claves de IA"
        description="Frasevia no trae claves propias. Pones la tuya y la aplicación la usa desde tu navegador. Pagas tú, a tu cuenta y con tus límites."
      />

      <Alert variant="info" title="Antes de nada: puedes no tener ninguna">
        <p>
          Existe otra forma de generar tarjetas que{" "}
          <strong>no necesita clave</strong>: copiar un prompt a tu propio
          asistente y pegar aquí el JSON que devuelva.{" "}
          <Link
            to="/biblioteca/mazos/nuevo-ia"
            className="font-semibold underline"
          >
            Ir a crear un mazo con IA
          </Link>
          . Si no vas a usar la generación desde aquí, esta página se puede
          ignorar y no queda ninguna clave guardada en el navegador.
        </p>
      </Alert>

      <div className="mt-8 space-y-5">
        <Card as="section" className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <SectionTitle as="h3">{PROVIDER.label}</SectionTitle>
              <p className="mt-1 text-sm text-ink-soft">{PROVIDER.blurb}</p>
            </div>
            {key.saved ? (
              <span className="shrink-0 rounded-full border border-success/25 bg-success-muted px-2.5 py-0.5 font-mono text-xs font-medium text-success">
                Configurada · {key.preview}
              </span>
            ) : null}
          </div>

          <Field
            label={PROVIDER.keyName}
            htmlFor="api-key"
            hint="Se guarda en cuanto la escribes, así que no hay nada que confirmar. Para quitarla, usa Olvidar."
          >
            <input
              id="api-key"
              type="password"
              autoComplete="off"
              spellCheck={false}
              className={inputClass}
              value={key.value}
              placeholder={PROVIDER.keyUrl}
              onChange={(event) => {
                setStorageError(null);
                if (!save(event.target.value)) {
                  setStorageError(
                    "Este navegador no dejó guardar la clave. Puede que tenga el almacenamiento bloqueado o lleno; prueba en modo incógnito o usa el modo de importar, que no necesita clave.",
                  );
                }
              }}
            />
          </Field>

          {storageError ? <Alert variant="error">{storageError}</Alert> : null}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={forget}
              disabled={!key.saved}
            >
              Olvidar
            </Button>

            <a
              href={PROVIDER.keyUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-sm text-brand hover:underline"
            >
              Obtener una clave
            </a>
          </div>

          <p className="rounded-lg bg-paper-sunken px-3 py-2.5 text-xs leading-relaxed text-ink-soft">
            <strong className="font-semibold text-ink">Cómo asegurarla:</strong>{" "}
            {PROVIDER.scoping}
          </p>
        </Card>
      </div>

      <div className="mt-6 rounded-card border border-line bg-paper-sunken px-5 py-5">
        <SectionTitle as="h3">Borrarla</SectionTitle>
        <p className="mt-1 text-sm text-ink-soft">
          {key.saved
            ? "Al olvidarla no se pierde nada de tus mazos: solo se quita la clave de este navegador."
            : "Ahora mismo no hay ninguna clave guardada en este navegador."}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {confirming ? (
            <>
              <Button type="button" variant="danger" onClick={forget}>
                Sí, olvidarla
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirming(false)}
              >
                Cancelar
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="secondary"
              disabled={!key.saved}
              onClick={() => setConfirming(true)}
            >
              Olvidar la clave
            </Button>
          )}
        </div>
      </div>

      <Alert
        variant="warning"
        className="mt-6"
        title="Por qué no hay más proveedores aquí"
      >
        <p>
          La generación directa sale del navegador, y solo funciona con
          servicios que envían cabeceras CORS. Se comprobó uno por uno:
          OpenRouter sí, y desde una sola clave cubre también los modelos de
          Google, Anthropic y MiniMax.{" "}
          <strong>MiniMax no sirve desde el navegador</strong> —su API no
          devuelve esas cabeceras—, por eso no aparece como opción propia. Si lo
          quieres usar, está en el catálogo de modelos de OpenRouter o en el
          modo de importar.
        </p>
        <p className="mt-2">
          Y sobre Claude Code: sus credenciales de suscripción{" "}
          <strong>no son una clave de API</strong> y no valen para esto. No hace
          falta una aquí, porque el modo de importar ya usa la IA que tengas
          abierta.
        </p>
      </Alert>
    </Page>
  );
}
