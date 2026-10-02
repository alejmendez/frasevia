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
import type { DraftCard } from "~/features/ai/draft";
import { cardKindLabel } from "~/lib/format";
import { useT } from "~/lib/locale-context";

/**
 * Pantalla de revisión: las tarjetas generadas, antes de guardarlas.
 *
 * Va en su propio archivo y no dentro de la ruta porque es lo único que hay
 * detrás de la pantalla de encargo, y mezclarlos dejaba la ruta con dos fases
 * muy distintas del mismo flujo.
 *
 * Escribirlas aquí y no en la base de datos a propósito: el modelo se equivoca,
 * y poder quitar la mitad antes de guardar evita tener que entrar después al
 * editor a borrarlas una por una.
 */

/** Tarjeta con identificador estable, para no usar el índice como clave. */
export interface ReviewCard extends DraftCard {
  id: string;
}

export interface ReviewDeck {
  title: string;
  description: string;
  level: string | null;
  cards: ReviewCard[];
}

export interface DeckReviewProps {
  deck: ReviewDeck;
  /** Cuántas quedan tras quitar las descartadas. */
  kept: number;
  /** Índices de las tarjetas que se han quitado. */
  dropped: number[];
  onToggle: (index: number) => void;

  title: string;
  onTitle: (value: string) => void;
  description: string;
  onDescription: (value: string) => void;
  visibility: "private" | "public";
  onVisibility: (value: "private" | "public") => void;

  error: string | null;
  saving: boolean;
  busy: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onRegenerate: () => void;
  onCancel: () => void;
}

export function DeckReview({
  deck,
  kept,
  dropped,
  onToggle,
  title,
  onTitle,
  description,
  onDescription,
  visibility,
  onVisibility,
  error,
  saving,
  busy,
  onSave,
  onDiscard,
  onRegenerate,
  onCancel,
}: DeckReviewProps) {
  const t = useT();

  return (
    <div className="space-y-6">
      {error ? (
        <Alert variant="error" title={t("mazoIa.errorTitle")}>
          {error}
        </Alert>
      ) : null}

      <Card as="section" className="space-y-5">
        <Field label={t("deckField.title")} htmlFor="draft-title" required>
          <input
            id="draft-title"
            value={title}
            maxLength={120}
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

      <div>
        <SectionTitle as="h3">
          {t("review.title")}
          <span className="ml-2 text-base font-normal text-ink-faint">
            {t("review.keptOf", { kept, total: deck.cards.length })}
          </span>
        </SectionTitle>

        <ul className="mt-3 max-h-[32rem] space-y-2 overflow-y-auto pr-1">
          {deck.cards.map((card, index) => {
            const isDropped = dropped.includes(index);

            return (
              <li key={card.id}>
                <Card
                  className={cx(
                    "flex items-start gap-3 py-3",
                    isDropped && "opacity-45",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-ink">{card.term}</p>
                      <Tag>{cardKindLabel(card.kind)}</Tag>
                    </div>
                    <p className="mt-0.5 text-sm text-ink-soft">
                      {card.meaningEs}
                    </p>
                    {card.exampleEn ? (
                      <p className="mt-1 text-xs text-ink-faint italic">
                        {card.exampleEn}
                        {card.exampleEs ? ` — ${card.exampleEs}` : ""}
                      </p>
                    ) : null}
                    {card.usageNote ? (
                      <p className="mt-1 text-xs text-ink-faint">
                        {card.usageNote}
                      </p>
                    ) : null}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    className="shrink-0 px-2.5 py-1.5 text-xs"
                    onClick={() => onToggle(index)}
                  >
                    {isDropped ? t("review.restore") : t("review.remove")}
                  </Button>
                </Card>
              </li>
            );
          })}
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
