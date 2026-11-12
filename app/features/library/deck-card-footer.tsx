import { ArrowRightIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr";

import { ConfirmSubmit } from "~/components/confirm";
import { ButtonLink, Tag } from "~/components/ui";
import { deckEditHref, deckHref, type LibraryDeck } from "~/lib/decks";
import { formatDateTime, formatRelativeTime } from "~/lib/format";
import type { MessageKey, MessageParams } from "~/lib/locale";
import { useT } from "~/lib/locale-context";
import { ROUTE_PATTERNS } from "~/lib/routes-paths";

import { ReviewStats } from "./review-stats";

/** Traduce. Es el mismo tipo que `t` y que `tr`, para que sirvan los dos. */
type Translate = (key: MessageKey, params?: MessageParams) => string;

/**
 * El pie de una tarjeta de mazo: sus números y lo que se puede hacer con él.
 *
 * La acción depende de una sola cosa, y hay que decidirla en un solo sitio: qué
 * es lo más útil que esa persona puede hacer con ese mazo ahora. Estaba escrito
 * como una cadena de cinco ramas con el `ButtonLink` repetido en cada una, que es
 * como se desincronizan: añadir un caso y olvidar el texto de otro.
 */
export function DeckCardFooter({ deck }: { deck: LibraryDeck }) {
  const tr = useT();

  return (
    <div className="space-y-3 border-t border-line pt-3">
      <ReviewStats deck={deck} />
      <LastActivity deck={deck} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <DeckAction deck={deck} />
        <div className="flex flex-wrap items-center gap-2">
          <VisibilityTag deck={deck} />
          <ButtonLink
            to={deckEditHref(deck)}
            variant="ghost"
            className="min-h-11 px-2"
          >
            {tr("biblioteca.edit")}
          </ButtonLink>
          <TrashDeckButton deck={deck} />
        </div>
      </div>
    </div>
  );
}

/**
 * El botón que manda el mazo a la papelera.
 *
 * Vive en la tarjeta de la biblioteca y no solo en el editor porque la
 * biblioteca es donde están los mazos: una opción que está a dos pantallas de
 * distancia es una opción que no existe para quien no la busca.
 *
 * No borra nada. El mazo queda en la papelera, y el borrado de verdad —que sí
 * no tiene vuelta atrás— está allí, en la papelera, y también es del dueño.
 */
function TrashDeckButton({ deck }: { deck: LibraryDeck }) {
  const tr = useT();

  return (
    <ConfirmSubmit
      action={ROUTE_PATTERNS.biblioteca}
      intent="trash-deck"
      fields={{ deckId: deck.id }}
      title={tr("biblioteca.trashDeckTitle", { title: deck.title })}
      description={tr("biblioteca.trashDeckBody")}
      confirmLabel={tr("biblioteca.trashDeckConfirm")}
      triggerClassName="inline-flex size-11 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-danger-muted hover:text-danger"
    >
      <TrashIcon aria-hidden size={18} />
      <span className="sr-only">{tr("biblioteca.trashDeckTrigger")}</span>
    </ConfirmSubmit>
  );
}

/** Lo más útil que se puede hacer con este mazo ahora mismo. */
export function DeckAction({ deck }: { deck: LibraryDeck }) {
  const tr = useT();
  const action = deckAction(deck, tr);

  return (
    <ButtonLink
      to={action.to}
      variant={action.primary ? "primary" : "secondary"}
      className="min-h-11"
    >
      {action.label}
      {action.primary ? <ArrowRightIcon aria-hidden size={17} /> : null}
    </ButtonLink>
  );
}

/**
 * Qué botón va en una tarjeta de mazo.
 *
 * Es una función pura a propósito: decide sin saber nada de JSX, así que se puede
 * probar, y el botón es solo lo que se ve. El orden va de más urgente a menos: un
 * mazo sin tarjetas no se puede repasar; uno con repasos pendientes sí; uno con
 * tarjetas nuevas sirve para aprender; y si no hay nada de eso, se mira.
 */
export function deckAction(
  deck: LibraryDeck,
  tr: Translate,
): { to: string; label: string; primary: boolean } {
  const destination = deckHref(deck);
  const due = deck.review?.due_count ?? 0;
  const fresh = deck.review?.new_count ?? deck.card_count;

  if (deck.card_count === 0) {
    return {
      to: deckEditHref(deck),
      label: tr("biblioteca.addCards"),
      primary: true,
    };
  }

  if (!deck.review) {
    return {
      to: destination,
      label: tr("biblioteca.viewDeck"),
      primary: false,
    };
  }

  if (due > 0) {
    return {
      to: `/estudiar/${deck.id}`,
      label: tr("biblioteca.reviewDeck", { count: due }),
      primary: true,
    };
  }

  if (fresh > 0) {
    return {
      to: `/estudiar/${deck.id}`,
      label: tr("biblioteca.learnNew", { count: fresh }),
      primary: true,
    };
  }

  return { to: destination, label: tr("biblioteca.viewDeck"), primary: false };
}

/**
 * Cuándo se repaso, se estudió o se editó por última vez.
 *
 * La última edición va con fecha y hora, y no como "hace tres días": es el
 * momento exacto en que se tocó el mazo, que es lo que sirve para saber cuál
 * de los mazos de la biblioteca se tocó por última vez.
 */
function LastActivity({ deck }: { deck: LibraryDeck }) {
  const tr = useT();
  const reviewed = deck.review?.last_reviewed_at;
  const studied = deck.progress?.last_studied_at;

  return (
    <>
      {reviewed ? (
        <p className="text-xs text-ink-faint">
          {tr("biblioteca.lastReview", { date: formatRelativeTime(reviewed) })}
        </p>
      ) : null}

      {studied ? (
        <p className="text-xs text-ink-faint">
          {tr("biblioteca.lastPractice", { date: formatRelativeTime(studied) })}
        </p>
      ) : null}

      <p className="text-xs text-ink-faint">
        {tr("biblioteca.lastUpdated", {
          date: formatDateTime(deck.updated_at),
        })}
      </p>
    </>
  );
}

/** Si el mazo es oficial, o si está publicado. */
function VisibilityTag({ deck }: { deck: LibraryDeck }) {
  const tr = useT();

  if (deck.is_official) {
    return <Tag tone="brand">{tr("biblioteca.official")}</Tag>;
  }

  return (
    <Tag tone={deck.visibility === "public" ? "accent" : "neutral"}>
      {deck.visibility === "public"
        ? tr("biblioteca.published")
        : tr("biblioteca.private")}
    </Tag>
  );
}
