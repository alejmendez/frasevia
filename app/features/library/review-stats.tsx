import { cx } from "~/components/ui";
import type { LibraryDeck } from "~/lib/decks";
import type { MessageKey } from "~/lib/locale";
import { useT } from "~/lib/locale-context";

/**
 * Los tres números de repaso de un mazo: pendientes, nuevas y archivadas.
 *
 * Los tres son el mismo dibujo con otro color, así que están en un mapa y no
 * escritos tres veces. El aviso de «no hay datos» sale cuando la vista de resumen
 * no vino, que pasa si la consulta de progreso falló sin que la pantalla entera
 * fallara.
 */
export function ReviewStats({ deck }: { deck: LibraryDeck }) {
  const tr = useT();
  const review = deck.review;

  if (!review) {
    return (
      <p className="text-xs text-ink-faint">
        {tr("biblioteca.reviewStatsUnavailable")}
      </p>
    );
  }

  const counts: Array<{ key: MessageKey; value: number; dot: string }> = [
    { key: "biblioteca.dueCount", value: review.due_count, dot: "bg-accent" },
    { key: "biblioteca.newCount", value: review.new_count, dot: "bg-lime" },
    {
      key: "biblioteca.scheduledCount",
      value: review.scheduled_count,
      dot: "bg-brand/40",
    },
  ];

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-soft">
      {counts.map((count) => (
        <span key={count.key} className="inline-flex items-center gap-1.5">
          <i aria-hidden className={cx("size-2.5 rounded-full", count.dot)} />
          {tr(count.key, { count: count.value })}
        </span>
      ))}
    </div>
  );
}
