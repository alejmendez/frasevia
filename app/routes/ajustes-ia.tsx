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
import {
  PROVIDER,
  providerBlurb,
  providerKeyName,
  providerScoping,
} from "~/features/ai/providers";
import { useAiKey } from "~/features/ai/use-keys";
import { t } from "~/lib/locale";
import { useT } from "~/lib/locale-context";

export function meta() {
  return [{ title: t("ajustesIa.metaTitle") }];
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
  const tr = useT();

  return (
    <Page className="max-w-2xl">
      <PageHeader
        eyebrow={tr("ajustesIa.eyebrow")}
        title={tr("ajustesIa.title")}
        description={tr("ajustesIa.description")}
      />

      <Alert variant="info" title={tr("ajustesIa.noKeyTitle")}>
        <p>
          {tr("ajustesIa.noKeyBody")}{" "}
          <Link
            to="/biblioteca/mazos/nuevo-ia"
            className="font-semibold underline"
          >
            {tr("ajustesIa.goCreate")}
          </Link>
          . {tr("ajustesIa.noKeyTail")}
        </p>
      </Alert>

      <div className="mt-8 space-y-5">
        <Card as="section" className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <SectionTitle as="h3">{PROVIDER.label}</SectionTitle>
              <p className="mt-1 text-sm text-ink-soft">{providerBlurb()}</p>
            </div>
            {key.saved ? (
              <span className="shrink-0 rounded-full border border-success/25 bg-success-muted px-2.5 py-0.5 font-mono text-xs font-medium text-success">
                {tr("ajustesIa.configured", { preview: key.preview })}
              </span>
            ) : null}
          </div>

          <Field
            label={providerKeyName()}
            htmlFor="api-key"
            hint={tr("ajustesIa.keyHint")}
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
                  setStorageError(t("ajustesIa.storageError"));
                }
              }}
            />
          </Field>

          {storageError ? <Alert variant="error">{storageError}</Alert> : null}

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={PROVIDER.keyUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-sm text-brand hover:underline"
            >
              {tr("ajustesIa.getKey")}
            </a>
          </div>

          <p className="rounded-lg bg-paper-sunken px-3 py-2.5 text-xs leading-relaxed text-ink-soft">
            <strong className="font-semibold text-ink">
              {tr("ajustesIa.scopingTitle")}
            </strong>{" "}
            {providerScoping()}
          </p>
        </Card>
      </div>

      <div className="mt-6 rounded-card border border-line bg-paper-sunken px-5 py-5">
        <SectionTitle as="h3">{tr("ajustesIa.eraseTitle")}</SectionTitle>
        <p className="mt-1 text-sm text-ink-soft">
          {key.saved ? tr("ajustesIa.eraseSaved") : tr("ajustesIa.eraseNone")}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {confirming ? (
            <>
              <Button type="button" variant="danger" onClick={forget}>
                {tr("ajustesIa.forgetYes")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirming(false)}
              >
                {tr("common.cancel")}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="secondary"
              disabled={!key.saved}
              onClick={() => setConfirming(true)}
            >
              {tr("ajustesIa.forgetKey")}
            </Button>
          )}
        </div>
      </div>

      <Alert
        variant="warning"
        className="mt-6"
        title={tr("ajustesIa.whyTitle")}
      >
        <p>
          {tr("ajustesIa.whyBody1")}{" "}
          <strong>{tr("ajustesIa.whyBody1Strong")}</strong>{" "}
          {tr("ajustesIa.whyBody1Middle")}
        </p>
        <p className="mt-2">
          {tr("ajustesIa.whyBody2Lead")}{" "}
          <strong>{tr("ajustesIa.whyBody2Strong")}</strong>{" "}
          {tr("ajustesIa.whyBody2Tail")}
        </p>
      </Alert>
    </Page>
  );
}
