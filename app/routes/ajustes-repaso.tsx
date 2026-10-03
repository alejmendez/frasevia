import {
  ArrowDownIcon,
  ArrowUpIcon,
  PlusIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";
import { data, Link, redirect, useFetcher } from "react-router";
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  Field,
  inputClass,
  Page,
  PageHeader,
  Select,
} from "~/components/ui";
import { t } from "~/lib/locale";
import { useT } from "~/lib/locale-context";
import type { RetiredReviewCard } from "~/lib/reviews";
import { listRetiredReviewCards, listReviewLevels } from "~/lib/reviews";
import { getSession, loginPath } from "~/lib/session";
import type {
  ReviewAction,
  ReviewIntervalUnit,
  ReviewLevel,
} from "~/lib/types";
import type { Route } from "./+types/ajustes-repaso";

const DEFAULTS = [
  {
    system_key: "difficult",
    name: "Difícil",
    action: "review",
    interval_amount: 2,
    interval_unit: "hours",
    position: 1,
    color: "coral",
  },
  {
    system_key: "normal",
    name: "Normal",
    action: "review",
    interval_amount: 1,
    interval_unit: "days",
    position: 2,
    color: "sand",
  },
  {
    system_key: "easy",
    name: "Fácil",
    action: "review",
    interval_amount: 5,
    interval_unit: "days",
    position: 3,
    color: "sage",
  },
  {
    system_key: "very_easy",
    name: "Súper fácil",
    action: "retire",
    interval_amount: null,
    interval_unit: null,
    position: 4,
    color: "lime",
  },
] as const;

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COLORS = ["coral", "sand", "sage", "lime", "forest", "blue"] as const;
const UNITS = ["minutes", "hours", "days"] as const;

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
    return data(
      {
        ok: false as const,
        intent,
        message: t("ajustesRepaso.sessionExpired"),
      },
      { status: 401 },
    );
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
    const { error } = await session.supabase.rpc("reactivate_card_review", {
      p_card_id: cardId,
      p_direction: direction,
    });
    return error
      ? data(
          { ok: false as const, intent, cardId, message: error.message },
          { status: 400 },
        )
      : {
          ok: true as const,
          intent,
          cardId,
          message: t("ajustesRepaso.reactivated"),
        };
  }

  if (intent === "reset") {
    const { data: existingData, error } = await session.supabase
      .from("review_levels")
      .select(
        "id, user_id, system_key, name, action, interval_amount, interval_unit, position, color, active, created_at, updated_at",
      )
      .order("position", { ascending: true });
    if (error) {
      return data(
        { ok: false as const, intent, message: error.message },
        { status: 400 },
      );
    }
    const existing = (existingData ?? []) as ReviewLevel[];
    const bySystemKey = new Map(
      existing
        .filter((level) => level.system_key)
        .map((level) => [level.system_key, level]),
    );
    const now = new Date().toISOString();
    const rows = [
      ...DEFAULTS.map((preset) => {
        const current = bySystemKey.get(preset.system_key);
        return {
          id: current?.id ?? crypto.randomUUID(),
          user_id: session.userId,
          ...preset,
          active: true,
          created_at: current?.created_at ?? now,
          updated_at: now,
        };
      }),
      ...existing
        .filter((level) => !level.system_key)
        .map((level, index) => ({
          ...level,
          active: false,
          position: DEFAULTS.length + index + 1,
          updated_at: now,
        })),
    ];
    const { data: saved, error: saveError } = await session.supabase
      .from("review_levels")
      .upsert(rows, { onConflict: "id" })
      .select(
        "id, user_id, system_key, name, action, interval_amount, interval_unit, position, color, active, created_at, updated_at",
      );
    return saveError
      ? data(
          { ok: false as const, intent, message: saveError.message },
          { status: 400 },
        )
      : {
          ok: true as const,
          intent,
          message: t("ajustesRepaso.resetDone"),
          levels: (saved ?? []) as ReviewLevel[],
        };
  }

  if (intent !== "save") {
    return data(
      { ok: false as const, intent, message: t("ajustesRepaso.invalidAction") },
      { status: 400 },
    );
  }

  let submitted: unknown;
  try {
    submitted = JSON.parse(String(formData.get("levels") ?? "[]"));
  } catch {
    return data(
      { ok: false as const, intent, message: t("ajustesRepaso.invalidLevels") },
      { status: 400 },
    );
  }
  if (
    !Array.isArray(submitted) ||
    submitted.length === 0 ||
    submitted.length > 30
  ) {
    return data(
      { ok: false as const, intent, message: t("ajustesRepaso.invalidLevels") },
      { status: 400 },
    );
  }

  const normalized = submitted.map((candidate, index) => {
    if (!candidate || typeof candidate !== "object") return null;
    const row = candidate as Record<string, unknown>;
    const name = typeof row.name === "string" ? row.name.trim() : "";
    const action = row.action;
    const amount = row.interval_amount;
    const unit = row.interval_unit;
    const color = row.color;
    const systemKey = row.system_key;
    if (
      typeof row.id !== "string" ||
      !UUID.test(row.id) ||
      name.length < 1 ||
      name.length > 40 ||
      (action !== "review" && action !== "retire") ||
      !COLORS.includes(color as (typeof COLORS)[number]) ||
      (systemKey !== null &&
        !DEFAULTS.some((preset) => preset.system_key === systemKey))
    )
      return null;

    if (action === "review") {
      if (
        typeof amount !== "number" ||
        !Number.isInteger(amount) ||
        amount < 1 ||
        amount > 525600 ||
        !UNITS.includes(unit as (typeof UNITS)[number]) ||
        (unit === "hours" && amount > 8760) ||
        (unit === "days" && amount > 3650)
      )
        return null;
    }

    return {
      id: row.id,
      user_id: session.userId,
      system_key: systemKey,
      name,
      action: action as ReviewAction,
      interval_amount: action === "retire" ? null : (amount as number),
      interval_unit: action === "retire" ? null : (unit as ReviewIntervalUnit),
      position: index + 1,
      color,
      active: row.active === true,
    };
  });

  if (normalized.some((row) => row === null)) {
    return data(
      { ok: false as const, intent, message: t("ajustesRepaso.invalidLevels") },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const ids = (normalized as NonNullable<(typeof normalized)[number]>[]).map(
    (row) => row.id,
  );
  const { data: currentRows } = await session.supabase
    .from("review_levels")
    .select("id, created_at")
    .in("id", ids);
  const createdById = new Map(
    (currentRows ?? []).map((row) => [
      row.id as string,
      row.created_at as string,
    ]),
  );
  const rows = (normalized as NonNullable<(typeof normalized)[number]>[]).map(
    (row) => ({
      ...row,
      created_at: createdById.get(row.id) ?? now,
      updated_at: now,
    }),
  );
  const { data: saved, error } = await session.supabase
    .from("review_levels")
    .upsert(rows, { onConflict: "id" })
    .select(
      "id, user_id, system_key, name, action, interval_amount, interval_unit, position, color, active, created_at, updated_at",
    );

  return error
    ? data(
        { ok: false as const, intent, message: error.message },
        { status: 400 },
      )
    : {
        ok: true as const,
        intent,
        message: t("ajustesRepaso.saved"),
        levels: (saved ?? []) as ReviewLevel[],
      };
}

export default function AjustesRepaso({ loaderData }: Route.ComponentProps) {
  const tr = useT();
  const fetcher = useFetcher<SettingsActionResult>();
  const [levels, setLevels] = useState<ReviewLevel[]>(
    loaderData.status === "ready" ? loaderData.levels : [],
  );

  useEffect(() => {
    if (fetcher.data?.levels) {
      setLevels(
        [...fetcher.data.levels].sort((a, b) => a.position - b.position),
      );
    }
  }, [fetcher.data]);

  if (loaderData.status === "unconfigured") {
    return (
      <Page>
        <Alert variant="warning" title={tr("configNotice.title")}>
          {tr("configNotice.body")}
        </Alert>
      </Page>
    );
  }

  const updateLevel = (id: string, updates: Partial<ReviewLevel>) => {
    setLevels((current) =>
      current.map((level) =>
        level.id === id ? { ...level, ...updates } : level,
      ),
    );
  };

  const moveLevel = (index: number, offset: number) => {
    setLevels((current) => {
      const target = index + offset;
      if (target < 0 || target >= current.length) return current;
      const reordered = [...current];
      [reordered[index], reordered[target]] = [
        reordered[target],
        reordered[index],
      ];
      return reordered.map((level, position) => ({
        ...level,
        position: position + 1,
      }));
    });
  };

  const addLevel = () => {
    const now = new Date().toISOString();
    const newLevel: ReviewLevel = {
      id: crypto.randomUUID(),
      user_id: loaderData.userId,
      system_key: null,
      name: tr("ajustesRepaso.customLevel"),
      action: "review",
      interval_amount: 1,
      interval_unit: "days",
      position: levels.length + 1,
      color: "blue",
      active: true,
      created_at: now,
      updated_at: now,
    };
    setLevels((current) => [...current, newLevel]);
  };

  const levelName = (level: ReviewLevel) => {
    if (level.system_key && DEFAULT_NAMES[level.system_key] === level.name) {
      switch (level.system_key) {
        case "difficult":
          return tr("ajustesRepaso.level.difficult");
        case "normal":
          return tr("ajustesRepaso.level.normal");
        case "easy":
          return tr("ajustesRepaso.level.easy");
        case "very_easy":
          return tr("ajustesRepaso.level.veryEasy");
      }
    }
    return level.name;
  };

  const intervalName = (level: ReviewLevel) => {
    if (level.action === "retire") return tr("estudiar.noFurtherReviews");
    if (level.interval_unit === "days" && level.interval_amount === 1)
      return tr("estudiar.tomorrow");
    const amount = level.interval_amount ?? 1;
    if (level.interval_unit === "minutes")
      return tr("estudiar.intervalMinutes", { amount });
    if (level.interval_unit === "hours")
      return tr("estudiar.intervalHours", { amount });
    return tr("estudiar.intervalDays", { amount });
  };

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
            <ol className="divide-y divide-line">
              {levels.map((level, index) => (
                <li
                  key={level.id}
                  className="grid gap-4 py-5 lg:grid-cols-[auto_1fr_1fr_auto] lg:items-start"
                >
                  <div className="flex items-center gap-2 lg:pt-7">
                    <span
                      aria-hidden="true"
                      className={`size-7 rounded-full rating-level--${level.color}`}
                    />
                    <div className="flex flex-col">
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={index === 0}
                        className="size-9 p-0"
                        aria-label={tr("ajustesRepaso.moveUp", {
                          name: levelName(level),
                        })}
                        onClick={() => moveLevel(index, -1)}
                      >
                        <ArrowUpIcon aria-hidden size={17} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={index === levels.length - 1}
                        className="size-9 p-0"
                        aria-label={tr("ajustesRepaso.moveDown", {
                          name: levelName(level),
                        })}
                        onClick={() => moveLevel(index, 1)}
                      >
                        <ArrowDownIcon aria-hidden size={17} />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Field
                      label={tr("ajustesRepaso.name")}
                      htmlFor={`name-${level.id}`}
                    >
                      <input
                        id={`name-${level.id}`}
                        className={inputClass}
                        maxLength={40}
                        value={levelName(level)}
                        onChange={(event) =>
                          updateLevel(level.id, {
                            name: event.target.value,
                            system_key: null,
                          })
                        }
                      />
                    </Field>
                    <Field
                      label={tr("ajustesRepaso.action")}
                      htmlFor={`action-${level.id}`}
                    >
                      <Select
                        id={`action-${level.id}`}
                        value={level.action}
                        onChange={(event) => {
                          const action = event.target.value as ReviewAction;
                          updateLevel(
                            level.id,
                            action === "retire"
                              ? {
                                  action,
                                  interval_amount: null,
                                  interval_unit: null,
                                }
                              : {
                                  action,
                                  interval_amount: 1,
                                  interval_unit: "days",
                                },
                          );
                        }}
                      >
                        <option value="review">
                          {tr("ajustesRepaso.actionReview")}
                        </option>
                        <option value="retire">
                          {tr("ajustesRepaso.actionRetire")}
                        </option>
                      </Select>
                    </Field>
                  </div>

                  <div className="space-y-4">
                    {level.action === "review" ? (
                      <div className="grid grid-cols-[minmax(5rem,0.55fr)_1fr] gap-2">
                        <Field
                          label={tr("ajustesRepaso.amount")}
                          htmlFor={`amount-${level.id}`}
                        >
                          <input
                            id={`amount-${level.id}`}
                            type="number"
                            min={1}
                            max={level.interval_unit === "days" ? 3650 : 525600}
                            required
                            className={inputClass}
                            value={level.interval_amount ?? 1}
                            onChange={(event) =>
                              updateLevel(level.id, {
                                interval_amount: Math.max(
                                  1,
                                  Number(event.target.value),
                                ),
                              })
                            }
                          />
                        </Field>
                        <Field
                          label={tr("ajustesRepaso.unit")}
                          htmlFor={`unit-${level.id}`}
                        >
                          <Select
                            id={`unit-${level.id}`}
                            value={level.interval_unit ?? "days"}
                            onChange={(event) =>
                              updateLevel(level.id, {
                                interval_unit: event.target
                                  .value as ReviewIntervalUnit,
                              })
                            }
                          >
                            <option value="minutes">
                              {tr("ajustesRepaso.minutes")}
                            </option>
                            <option value="hours">
                              {tr("ajustesRepaso.hours")}
                            </option>
                            <option value="days">
                              {tr("ajustesRepaso.days")}
                            </option>
                          </Select>
                        </Field>
                      </div>
                    ) : (
                      <p className="rounded-lg bg-paper-sunken px-3 py-3 text-sm text-ink-soft">
                        {tr("ajustesRepaso.retireHint")}
                      </p>
                    )}
                    <Field
                      label={tr("ajustesRepaso.color")}
                      htmlFor={`color-${level.id}`}
                    >
                      <Select
                        id={`color-${level.id}`}
                        value={level.color}
                        onChange={(event) =>
                          updateLevel(level.id, { color: event.target.value })
                        }
                      >
                        {COLORS.map((color) => (
                          <option key={color} value={color}>
                            {tr(`ajustesRepaso.color.${color}`)}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>

                  <Button
                    type="button"
                    variant={level.active ? "secondary" : "ghost"}
                    className="min-h-11 lg:mt-7"
                    aria-pressed={level.active}
                    onClick={() =>
                      updateLevel(level.id, { active: !level.active })
                    }
                  >
                    {tr(
                      level.active
                        ? "ajustesRepaso.deactivate"
                        : "ajustesRepaso.activate",
                    )}
                  </Button>
                </li>
              ))}
            </ol>

            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-5">
              <Button
                type="button"
                variant="secondary"
                className="min-h-11"
                disabled={levels.length >= 30}
                onClick={addLevel}
              >
                <PlusIcon aria-hidden size={18} />
                {tr("ajustesRepaso.addLevel")}
              </Button>
              <span className="text-xs text-ink-faint">
                {tr("ajustesRepaso.timezone", {
                  timezone:
                    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
                })}
              </span>
            </div>

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
                    <span className="font-medium">{levelName(level)}</span>
                    <span className="ml-auto text-sm">
                      {intervalName(level)}
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

const DEFAULT_NAMES: Record<string, string> = {
  difficult: "Difícil",
  normal: "Normal",
  easy: "Fácil",
  very_easy: "Súper fácil",
};
