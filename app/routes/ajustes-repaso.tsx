import { data, Link, redirect, useFetcher } from "react-router";
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  ConfigNotice,
  Page,
  PageHeader,
} from "~/components/ui";
import {
  AddLevelButton,
  ReviewLevelList,
} from "~/features/reviews/review-level-list";
import { useReviewLevelsDraft } from "~/features/reviews/use-review-levels-draft";
import { t } from "~/lib/locale";
import { useT } from "~/lib/locale-context";
import { intervalName, levelName } from "~/lib/review-levels";
import type { RetiredReviewCard } from "~/lib/reviews";
import {
  listRetiredReviewCards,
  listReviewLevels,
  reactivateCardReview,
  resetReviewLevels,
  saveReviewLevels,
} from "~/lib/reviews";
import { getSession, loginPath } from "~/lib/session";
import type { ReviewLevel } from "~/lib/types";
import type { Route } from "./+types/ajustes-repaso";

type SettingsActionResult = {
  ok: boolean;
  intent: string;
  message: string;
  levels?: ReviewLevel[];
  cardId?: string;
};

export function meta() {
  return [{ title: t("ajustesRepaso.metaTitle") }];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const session = await getSession();
  if (session.status === "unconfigured") {
    return {
      status: "unconfigured" as const,
      userId: "",
      levels: [],
      retired: [],
      error: null,
    };
  }
  if (session.status === "anonymous") throw redirect(loginPath(request));

  const [levelsResult, retiredResult] = await Promise.all([
    listReviewLevels(session.supabase),
    listRetiredReviewCards(session.supabase),
  ]);
  return {
    status: "ready" as const,
    userId: session.userId,
    levels: levelsResult.levels,
    retired: retiredResult.cards,
    error: levelsResult.error ?? retiredResult.error,
  };
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");
  const session = await getSession();
  if (session.status !== "ready") {
    return fail(intent, t("ajustesRepaso.sessionExpired"), 401);
  }

  if (intent === "reactivate") {
    const cardId = String(formData.get("cardId") ?? "");
    const direction = String(formData.get("direction") ?? "");
    if (!cardId || !direction) {
      return data(
        {
          ok: false as const,
          intent,
          cardId,
          message: t("ajustesRepaso.invalidCard"),
        },
        { status: 400 },
      );
    }

    const result = await reactivateCardReview(
      session.supabase,
      cardId,
      direction,
    );

    return result.ok
      ? {
          ok: true as const,
          intent,
          cardId,
          message: t("ajustesRepaso.reactivated"),
        }
      : data(
          { ok: false as const, intent, cardId, message: result.message },
          { status: 400 },
        );
  }

  if (intent === "reset") {
    const result = await resetReviewLevels(session.supabase, session.userId);

    return result.ok
      ? {
          ok: true as const,
          intent,
          message: t("ajustesRepaso.resetDone"),
          levels: result.levels,
        }
      : data(
          { ok: false as const, intent, message: result.message },
          { status: 400 },
        );
  }

  if (intent !== "save") {
    return fail(intent, t("ajustesRepaso.invalidAction"));
  }

  let submitted: unknown;
  try {
    submitted = JSON.parse(String(formData.get("levels") ?? "[]"));
  } catch {
    return fail(intent, t("ajustesRepaso.invalidLevels"));
  }

  const result = await saveReviewLevels(
    session.supabase,
    session.userId,
    submitted,
  );

  if (!result.ok) {
    return fail(intent, t("ajustesRepaso.invalidLevels"));
  }

  return {
    ok: true as const,
    intent,
    message: t("ajustesRepaso.saved"),
    levels: result.levels,
  };
}

/**
 * Un fallo de acción, con su código.
 *
 * Salía nueve veces en este archivo, cada una con el mismo `data({ok:false},
 * {status})` y solo cambiando el texto. La forma de la respuesta es un contrato:
 * la pantalla lee `ok` y `message` de ahí, así que en un solo sitio.
 */
function fail(intent: string, message: string, status = 400) {
  return data({ ok: false as const, intent, message }, { status });
}

export default function AjustesRepaso({ loaderData }: Route.ComponentProps) {
  const tr = useT();
  const fetcher = useFetcher<SettingsActionResult>();
  const draft = useReviewLevelsDraft(
    loaderData.status === "ready" ? loaderData.levels : [],
    fetcher.data?.levels,
  );
  const { levels } = draft;

  if (loaderData.status === "unconfigured") {
    return <ConfigNotice />;
  }

  function addLevel() {
    const now = new Date().toISOString();
    draft.add({
      id: crypto.randomUUID(),
      user_id: loaderData.userId,
      system_key: null,
      name: tr("ajustesRepaso.customLevel"),
      action: "review",
      interval_amount: 1,
      interval_unit: "days",
      color: "blue",
      active: true,
      created_at: now,
      updated_at: now,
    });
  }

  // Los nombres y los intervalos se resuelven con las mismas reglas que usa la
  // pantalla de estudio: si divergieran, el mismo nivel se llamaría de una forma
  // aquí y de otra allí.
  const levelLabel = (level: ReviewLevel) => levelName(level, tr);
  const intervalLabel = (level: ReviewLevel) => intervalName(level, tr);

  return (
    <Page>
      <PageHeader
        eyebrow={tr("ajustesRepaso.eyebrow")}
        title={tr("ajustesRepaso.title")}
        description={tr("ajustesRepaso.description")}
        actions={
          <ButtonLink to="/biblioteca" variant="secondary">
            {tr("ajustesRepaso.backLibrary")}
          </ButtonLink>
        }
      />

      {loaderData.error ? (
        <Alert variant="error" className="mb-5">
          {loaderData.error}
        </Alert>
      ) : null}
      {fetcher.data?.message ? (
        <Alert variant={fetcher.data.ok ? "success" : "error"} className="mb-5">
          {fetcher.data.message}
        </Alert>
      ) : null}

      <div className="grid items-start gap-6 xl:grid-cols-[1.65fr_0.85fr]">
        <Card as="section" className="p-5 sm:p-7">
          <div className="mb-5 border-b border-line pb-4">
            <h2 className="font-display text-2xl text-brand">
              {tr("ajustesRepaso.levelsTitle")}
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              {tr("ajustesRepaso.levelsHint")}
            </p>
          </div>

          <fetcher.Form method="post">
            <input type="hidden" name="intent" value="save" />
            <input type="hidden" name="levels" value={JSON.stringify(levels)} />
            <ReviewLevelList
              levels={levels}
              onUpdate={draft.update}
              onMove={draft.move}
            />

            <AddLevelButton levels={levels} onAdd={addLevel} />

            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                type="submit"
                className="min-h-12"
                disabled={fetcher.state !== "idle"}
              >
                {fetcher.state !== "idle"
                  ? tr("ajustesRepaso.saving")
                  : tr("ajustesRepaso.save")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="min-h-12"
                disabled={fetcher.state !== "idle"}
                onClick={() =>
                  fetcher.submit({ intent: "reset" }, { method: "post" })
                }
              >
                {tr("ajustesRepaso.reset")}
              </Button>
            </div>
          </fetcher.Form>
        </Card>

        <div className="space-y-6">
          <Card as="section" className="paper-card p-5 sm:p-6">
            <span aria-hidden="true" className="paper-tape" />
            <h2 className="font-display text-2xl text-brand">
              {tr("ajustesRepaso.previewTitle")}
            </h2>
            <div className="mt-4 space-y-2.5">
              {levels
                .filter((level) => level.active)
                .map((level, index) => (
                  <div
                    key={level.id}
                    className={`rating-level--${level.color} flex min-h-14 items-center gap-3 rounded-xl border bg-paper-raised/70 px-4 py-2`}
                  >
                    <span
                      aria-hidden="true"
                      className="size-6 rounded-full bg-current opacity-35"
                    />
                    <span className="font-medium">{levelLabel(level)}</span>
                    <span className="ml-auto text-sm">
                      {intervalLabel(level)}
                    </span>
                    <span className="sr-only">{index + 1}</span>
                  </div>
                ))}
            </div>
            {levels.every((level) => !level.active) ? (
              <p className="mt-3 text-sm text-ink-soft">
                {tr("ajustesRepaso.noActivePreview")}
              </p>
            ) : null}
          </Card>

          <Card as="section" className="p-5 sm:p-6">
            <h2 className="font-display text-2xl text-brand">
              {tr("ajustesRepaso.retiredTitle")}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              {tr("ajustesRepaso.retiredDescription")}
            </p>
            {loaderData.retired.length === 0 ? (
              <p className="mt-4 text-sm text-ink-faint">
                {tr("ajustesRepaso.noRetired")}
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-line">
                {loaderData.retired.map((card) => (
                  <RetiredCardRow
                    key={`${card.card_id}-${card.direction}`}
                    card={card}
                  />
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </Page>
  );
}

function RetiredCardRow({ card }: { card: RetiredReviewCard }) {
  const tr = useT();
  const fetcher = useFetcher<SettingsActionResult>();

  return (
    <li className="py-4">
      <p className="text-xs text-ink-faint">
        {card.deck_title} · {card.direction.toUpperCase()}
      </p>
      <p className="mt-1 font-medium text-brand">{card.meaning_es}</p>
      <p className="text-sm text-ink-soft">{card.term}</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <Link
          to={
            card.deck_visibility === "public"
              ? `/mazos/${card.deck_slug}`
              : `/biblioteca/mazos/${card.deck_id}/editar`
          }
          className="text-sm text-brand underline"
        >
          {tr("ajustesRepaso.openDeck")}
        </Link>
        <fetcher.Form method="post">
          <input type="hidden" name="intent" value="reactivate" />
          <input type="hidden" name="cardId" value={card.card_id} />
          <input type="hidden" name="direction" value={card.direction} />
          <Button
            type="submit"
            variant="secondary"
            className="min-h-11"
            disabled={fetcher.state !== "idle"}
          >
            {fetcher.state !== "idle"
              ? tr("ajustesRepaso.reactivating")
              : tr("ajustesRepaso.reactivate")}
          </Button>
        </fetcher.Form>
      </div>
      {fetcher.data?.message ? (
        <p
          className="mt-2 text-xs text-ink-soft"
          role={fetcher.data.ok ? "status" : "alert"}
        >
          {fetcher.data.message}
        </p>
      ) : null}
    </li>
  );
}
