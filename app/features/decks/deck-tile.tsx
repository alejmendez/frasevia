import { Link } from "react-router";
import { Card, Tag } from "~/components/ui";
import { cardCountLabel, visibilityLabel } from "~/lib/format";
import { useT } from "~/lib/locale-context";
import type { Deck } from "~/lib/types";

/**
 * Tarjeta de mazo para el catálogo y la biblioteca.
 *
 * Un solo componente para ambos listados: la diferencia está en los metadatos
 * que cada vista puede añadir, no en el diseño.
 */
export function DeckTile({
  deck,
  authorName,
  footer,
  className,
  href,
  descriptionAction,
}: {
  deck: Deck;
  authorName?: string | null;
  footer?: React.ReactNode;
  className?: string;
  descriptionAction?: React.ReactNode;
  /**
   * Destino del título. Por defecto es la página pública, pero la biblioteca
   * lo reenvía al editor: la página pública de un mazo privado responde «no
   * encontrado» porque RLS lo esconde, y un enlace roto ahí sería confuso.
   */
  href?: string;
}) {
  const t = useT();

  const tabColors = ["coral", "lime", "blue", "sage"] as const;
  const colorIndex = deck.id.charCodeAt(0) % tabColors.length;

  return (
    <Card
      as="article"
      className={`deck-stack-card deck-tab-${tabColors[colorIndex]} flex h-full w-full flex-col gap-3 ${className ?? ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-display text-lg leading-snug text-ink">
          {/* El enlace envuelve el título para que sea el destino principal. */}
          <Link
            to={href ?? `/mazos/${deck.slug}`}
            className="hover:text-brand focus-visible:text-brand"
          >
            {deck.title}
          </Link>
        </h3>
        {deck.is_official ? (
          <Tag tone="brand">{t("biblioteca.official")}</Tag>
        ) : null}
      </div>

      {deck.description ? (
        <p className="line-clamp-3 text-sm text-ink-soft">{deck.description}</p>
      ) : (
        <div className="text-sm text-ink-faint">
          <p>{t("deck.noDescription")}</p>
          {descriptionAction ? (
            <div className="mt-1">{descriptionAction}</div>
          ) : null}
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-ink-faint">
        <span>{cardCountLabel(deck.card_count)}</span>
        {deck.level ? <span>· {deck.level}</span> : null}
        <span>
          · {deck.source_language} → {deck.target_language}
        </span>
        {!deck.is_official ? (
          <span>· {visibilityLabel(deck.visibility)}</span>
        ) : null}
      </div>

      {authorName ? (
        <p className="text-xs text-ink-faint">
          {t("deck.by", { author: authorName })}
        </p>
      ) : null}

      {footer}
    </Card>
  );
}
