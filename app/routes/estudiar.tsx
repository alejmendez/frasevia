import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import {
  Link,
  redirect,
  type ShouldRevalidateFunctionArgs,
} from "react-router";

import { Alert, ConfigNotice, Page } from "~/components/ui";
import type { StudyMode } from "~/features/study/engine";
import {
  loadDeckSession,
  loadGlobalQueue,
} from "~/features/study/load-session";
import { PracticeSession } from "~/features/study/practice/practice-session";
import { ReviewSessionView } from "~/features/study/review-session";
import {
  rateReview,
  savePractice,
  sessionExpired,
} from "~/features/study/save-results";
import { t } from "~/lib/locale";
import { useT } from "~/lib/locale-context";
import { getSession, loginPath } from "~/lib/session";
import type { Route } from "./+types/estudiar";

/**
 * `/estudiar`: repasar de memoria lo que está vencido.
 *
 * La ruta hace tres cosas y ninguna más: traer los datos, guardar lo que se le
 * manda y pintar. Todo lo demás vive en `app/features/study/`, que es donde se
 * puede probar sin navegador y sin base de datos.
 *
 * Aquí hay dos prácticas y una pantalla: el repaso por memoria, que es el camino
 * por defecto, y las otras tres —explorar, elegir y completar— debajo de un
 * `<details>`, porque son la alternativa y no la primera opción.
 *
 * Este archivo eran 2100 líneas. Ahora se lee entero de una sentada.
 */

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    {
      title: loaderData?.deck?.title
        ? t("estudiar.metaDeck", { deck: loaderData.deck.title })
        : t("estudiar.metaTitle"),
    },
  ];
}

export async function clientLoader({
  request,
  params,
}: Route.ClientLoaderArgs) {
  const session = await getSession();

  if (session.status === "unconfigured") {
    return {
      status: "unconfigured" as const,
      deck: null,
      cards: [],
      progress: [],
      reviewStates: [],
      reviewLevels: [],
      direction: "es-en",
    };
  }

  if (session.status === "anonymous") {
    throw redirect(loginPath(request));
  }

  // Sin identificador de mazo la pantalla es la cola global; con él, la sesión de
  // ese mazo. Las dos traen la misma forma de datos.
  const data_ = params.deckId
    ? await loadDeckSession(session.supabase, params.deckId)
    : await loadGlobalQueue(session.supabase);

  return {
    status: "ready" as const,
    scope: params.deckId ? ("deck" as const) : ("global" as const),
    ...data_,
  };
}

/**
 * Guarda lo que haya mandado la pantalla.
 *
 * El `intent` separa las dos operaciones para que un mismo formulario no pueda
 * hacer de más.
 */
export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const session = await getSession();

  if (session.status !== "ready") {
    return sessionExpired(
      formData.get("intent") === "rate-review"
        ? String(formData.get("eventId") ?? "")
        : "",
    );
  }

  return formData.get("intent") === "rate-review"
    ? rateReview(session.supabase, formData)
    : savePractice(session.supabase, formData);
}

/**
 * No recarga los datos al terminar de puntuar una ficha.
 *
 * Guardar con `rate-review` (o con `results`, al cerrar una práctica) no cambia
 * nada de lo que este `clientLoader` trae: la sesión de repaso lleva su propio
 * estado y ya se pintó con datos frescos antes de enviar, y la práctica muestra
 * un resumen construido en el navegador. Recargar aquí repetiría, en cada ficha
 * puntuada, el mazo entero, el progreso de todas sus tarjetas y su estado de
 * repaso: cuatro viajes de red que no cambian ni un solo píxel.
 *
 * El resto de casos —entrar a la pantalla, cambiar de mazo, volver de otra
 * pestaña— siguen usando la decisión por defecto del enrutador, que sí recarga.
 */
export function shouldRevalidate({
  formData,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs): boolean {
  const intent = formData?.get("intent");
  if (intent === "rate-review" || formData?.has("results")) {
    return false;
  }

  return defaultShouldRevalidate;
}

export default function Estudiar({ loaderData }: Route.ComponentProps) {
  const tr = useT();
  const [mode, setMode] = useState<StudyMode>("elegir");
  // El número que se incrementa al reiniciar. Remonta las dos sesiones con una
  // `key`, y es más claro que guardar el contador dentro de cada una.
  const [sessionKey, setSessionKey] = useState(0);

  if (loaderData.status === "unconfigured") {
    return <ConfigNotice />;
  }

  const { deck, cards, progress, reviewStates, reviewLevels, direction } =
    loaderData;
  const isDeckSession = loaderData.scope === "deck";
  const general = deck?.study_mode === "general";

  return (
    <Page className="max-w-7xl">
      <LinkToLibrary />

      <header className="mb-7">
        <p className="text-sm font-medium text-ink-soft">
          {deck?.title ?? tr("estudiar.pendingTitle")}
        </p>
        <h1 className="mt-2 font-display text-4xl leading-tight text-brand sm:text-5xl">
          {tr("estudiar.recallTitle")}
        </h1>
        <p className="mt-2 text-ink-soft">{tr("estudiar.recallSubtitle")}</p>
      </header>

      {isDeckSession && cards.length === 0 ? (
        <EmptyDeck deckId={deck?.id} />
      ) : (
        <>
          <ReviewSessionView
            key={`${deck?.id ?? "global"}-${sessionKey}`}
            cards={cards}
            states={reviewStates}
            levels={reviewLevels}
            direction={direction}
            isDeckSession={isDeckSession}
          />

          {isDeckSession ? (
            <details className="mt-10 rounded-card border border-line bg-paper-raised/75 p-5 sm:p-6">
              <summary className="min-h-11 cursor-pointer font-display text-2xl text-brand">
                {general
                  ? tr("general.otherPractices")
                  : tr("estudiar.otherPractices")}
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {general
                  ? tr("general.otherPractices")
                  : tr("estudiar.otherPracticesHint")}
              </p>
              <div className="mt-5">
                <PracticeSession
                  key={`${mode}-${sessionKey}`}
                  cards={cards}
                  progress={progress}
                  mode={mode}
                  onModeChange={setMode}
                  onRestart={() => setSessionKey((value) => value + 1)}
                />
              </div>
            </details>
          ) : null}
        </>
      )}
    </Page>
  );
}

function LinkToLibrary() {
  const tr = useT();

  return (
    <Link
      to="/biblioteca"
      className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm text-brand hover:underline"
    >
      <ArrowLeftIcon aria-hidden size={18} />
      {tr("estudiar.backLibrary")}
    </Link>
  );
}

/**
 * Un mazo sin tarjetas: no hay nada que repasar hasta que se le añada alguna.
 */
function EmptyDeck({ deckId }: { deckId: string | undefined }) {
  const tr = useT();

  return (
    <Alert variant="warning" title={tr("estudiar.emptyDeckTitle")}>
      <p>
        {tr("estudiar.emptyDeckLead")}{" "}
        {deckId ? (
          <Link to={`/biblioteca/mazos/${deckId}/editar`} className="underline">
            {tr("estudiar.addCards")}
          </Link>
        ) : (
          tr("estudiar.addCards")
        )}{" "}
        {tr("estudiar.emptyDeckTail")}
      </p>
    </Alert>
  );
}
