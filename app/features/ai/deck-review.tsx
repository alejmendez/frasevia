import { memo } from "react";

import {
  Alert,
  Button,
  Card,
  cx,
  Field,
  inputClass,
  SectionTitle,
  Select,
  Tag,
  Textarea,
} from "~/components/ui";
import { cardKindLabel } from "~/lib/format";
import { useT } from "~/lib/locale-context";
import type { DeckStudyMode } from "~/lib/types";
import type { DraftCard } from "./draft";
import { TITLE_MAX } from "./draft";

/**
 * La pantalla de revisión: lo que generó el modelo, antes de que exista.
 *
 * Está en su propio archivo y no dentro de la ruta porque son dos pantallas
 * distintas —crear y revisar— que comparten un borrador. La ruta elige cuál
 * pintar; esta decide cómo se ve la otra.
 *
 * Los campos de arriba son controlados porque quien edita el título está viendo
 * el mismo texto que se va a guardar. Las tarjetas de abajo no se editan: o se
 * dejan como vienen o se descartan.
 */

/** Una tarjeta del borrador, con su sitio en la lista. */
export interface ReviewCard extends DraftCard {
  /** Posición en el borrador. Es lo que se descarta y lo que se vuelve a guardar. */
  id: string;
}

/** El borrador completo, ya con identificadores propios. */
export interface ReviewDeck {
  title: string;
  description: string;
  level: string | null;
  cards: ReviewCard[];
}

/**
 * Lo que la pantalla de revisión necesita, en cuatro grupos.
 *
 * Eran dieciocho props sueltas y ninguna decía a qué pertenecía: seis del
 * formulario, cuatro del borrador, tres del estado y cuatro de las acciones.
 * Agrupadas se lee de un vistazo qué es cada cosa, y quien llama deja de tener
 * que acordarse del orden.
 */
export interface DeckReviewProps {
  studyMode: DeckStudyMode;
  /** El borrador y qué se ha hecho con él. */
  draft: {
    deck: ReviewDeck;
    /** Cuántas quedan tras quitar las descartadas. */
    kept: number;
    /** Índices de las tarjetas que se han quitado. */
    dropped: number[];
    onToggle: (index: number) => void;
  };
  /** Los campos del mazo, que se editan aquí mismo. */
  form: {
    title: string;
    onTitle: (value: string) => void;
    description: string;
    onDescription: (value: string) => void;
    visibility: "private" | "public";
    onVisibility: (value: "private" | "public") => void;
  };
  status: {
    error: string | null;
    saving: boolean;
    busy: boolean;
  };
  actions: {
    onSave: () => void;
    onDiscard: () => void;
    onRegenerate: () => void;
    onCancel: () => void;
  };
}

export function DeckReview({
  studyMode,
  draft,
  form,
  status,
  actions,
}: DeckReviewProps) {
  const t = useT();
  const { deck, kept, dropped, onToggle } = draft;
  const { error, saving, busy } = status;
  const { onSave, onDiscard, onRegenerate, onCancel } = actions;
  const {
    title,
    onTitle,
    description,
    onDescription,
    visibility,
    onVisibility,
  } = form;

  return (
    <div className="space-y-6">
      {error ? (
        <Alert variant="error" title={t("mazoIa.errorTitle")}>
          {error}
        </Alert>
      ) : null}

      <DeckMetadata
        title={title}
        onTitle={onTitle}
        description={description}
        onDescription={onDescription}
        visibility={visibility}
        onVisibility={onVisibility}
      />

      <div>
        <SectionTitle as="h3">
          {t("review.title")}
          <span className="ml-2 text-base font-normal text-ink-faint">
            {t("review.keptOf", { kept, total: deck.cards.length })}
          </span>
        </SectionTitle>

        <ul className="mt-3 max-h-[32rem] space-y-2 overflow-y-auto pr-1">
          {deck.cards.map((card, index) => (
            <ReviewCardRow
              key={card.id}
              card={card}
              studyMode={studyMode}
              dropped={dropped.includes(index)}
              onToggle={onToggle}
              index={index}
            />
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={onSave} disabled={saving || kept === 0}>
          {saving ? t("review.saving") : t("review.saveCards", { count: kept })}
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={onDiscard}
          disabled={saving}
        >
          {t("review.discard")}
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={onRegenerate}
          disabled={busy}
        >
          {busy ? t("mazoIa.generating") : t("review.askMore")}
        </Button>

        {busy ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/** Los tres campos del mazo: título, descripción y quién lo puede ver. */
function DeckMetadata({
  title,
  onTitle,
  description,
  onDescription,
  visibility,
  onVisibility,
}: DeckReviewProps["form"]) {
  const t = useT();

  return (
    <Card as="section" className="space-y-5">
      <Field label={t("deckField.title")} htmlFor="draft-title" required>
        <input
          id="draft-title"
          value={title}
          maxLength={TITLE_MAX}
          onChange={(event) => onTitle(event.target.value)}
          className={inputClass}
        />
      </Field>

      <Field
        label={t("deckField.description")}
        htmlFor="draft-description"
        hint={t("deckField.descriptionHintReview")}
      >
        <Textarea
          id="draft-description"
          value={description}
          onChange={(event) => onDescription(event.target.value)}
        />
      </Field>

      <Field label={t("deckField.visibility")} htmlFor="draft-visibility">
        <Select
          id="draft-visibility"
          value={visibility}
          onChange={(event) =>
            onVisibility(event.target.value as "private" | "public")
          }
        >
          <option value="private">{t("visibility.option.private")}</option>
          <option value="public">{t("visibility.option.public")}</option>
        </Select>
      </Field>
    </Card>
  );
}

/**
 * Una tarjeta del borrador, con su botón de descartar.
 *
 * Va memorizada porque escribir el título re-renderiza la pantalla entera, y sin
 * esto eso repinta hasta sesenta tarjetas —con su traducción y su ejemplo— por
 * cada tecla. Aquí solo se repinta la que cambia.
 */
const ReviewCardRow = memo(function ReviewCardRow({
  card,
  studyMode,
  dropped,
  onToggle,
  index,
}: {
  card: ReviewCard;
  studyMode: DeckStudyMode;
  dropped: boolean;
  onToggle: (index: number) => void;
  index: number;
}) {
  const t = useT();

  return (
    <li>
      <Card
        className={cx("flex items-start gap-3 py-3", dropped && "opacity-45")}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-ink">{card.term}</p>
            <Tag>
              {/* En repaso general una «palabra» es un concepto, no un vocablo. */}
              {studyMode === "general" && card.kind === "word"
                ? t("general.concept")
                : cardKindLabel(card.kind)}
            </Tag>
          </div>
          <p className="mt-0.5 text-sm text-ink-soft">{card.meaningEs}</p>
          {card.exampleEn ? (
            <p className="mt-1 text-xs text-ink-faint italic">
              {card.exampleEn}
              {card.exampleEs ? ` — ${card.exampleEs}` : ""}
            </p>
          ) : null}
          {card.usageNote ? (
            <p className="mt-1 text-xs text-ink-faint">{card.usageNote}</p>
          ) : null}
        </div>

        <Button
          type="button"
          variant="ghost"
          className="shrink-0 px-2.5 py-1.5 text-xs"
          onClick={() => onToggle(index)}
        >
          {dropped ? t("review.restore") : t("review.remove")}
        </Button>
      </Card>
    </li>
  );
});
