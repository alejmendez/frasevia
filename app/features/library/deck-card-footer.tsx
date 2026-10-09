import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";

import { ButtonLink, Tag } from "~/components/ui";
import { deckEditHref, deckHref, type LibraryDeck } from "~/lib/decks";
import { formatRelativeTime } from "~/lib/format";
import type { MessageKey, MessageParams } from "~/lib/locale";
import { useT } from "~/lib/locale-context";

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
        </div>
      </div>
    </div>
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

/** Cuándo se repaso o se estudió por última vez. */
function LastActivity({ deck }: { deck: LibraryDeck }) {
  const tr = useT();
  const reviewed = deck.review?.last_reviewed_at;
  const studied = deck.progress?.last_studied_at;

  if (reviewed) {
    return (
      <p className="text-xs text-ink-faint">
        {tr("biblioteca.lastReview", { date: formatRelativeTime(reviewed) })}
      </p>
    );
  }

  if (studied) {
    return (
      <p className="text-xs text-ink-faint">
        {tr("biblioteca.lastPractice", { date: formatRelativeTime(studied) })}
      </p>
    );
  }

  return null;
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
