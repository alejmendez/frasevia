import { BooksIcon, TranslateIcon } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";
import { buttonClass, Card, cx } from "~/components/ui";
import { useT } from "~/lib/locale-context";
import type { DeckStudyMode } from "~/lib/types";

/**
 * Las piezas pequeñas que todos los esqueletos comparten.
 *
 * Son rectángulos grises que imitan la forma de lo que va a aparecer. No saben
 * nada de mazos ni de estudio: solo miden y se pintan. Por eso viven aparte de los
 * esqueletos de cada pantalla, que sí saben.
 *
 * Estaban en el mismo archivo que las pantallas, con nueve piezas al principio y
 * mil líneas de pantallas debajo: leer «qué es esto» significaba llegar hasta el
 * final.
 *
 * Aquí también se reexporta lo que viene de `~/components/ui`, para que una
 * pantalla pueda importar sus piezas de un solo sitio.
 */

export {
  buttonClass,
  Card,
  cx,
  Page,
  PageHeader,
  Tag,
} from "~/components/ui";

// Las listas conservan seis marcadores; su longitud real depende de los datos.
export const ITEMS = ["one", "two", "three", "four", "five", "six"] as const;

export function Placeholder({ className }: { className: string }) {
  return <div className={cx("skeleton-placeholder rounded-md", className)} />;
}

export function TextLines() {
  return (
    <div className="space-y-2 py-1">
      <Placeholder className="h-3 w-full" />
      <Placeholder className="h-3 w-4/5" />
    </div>
  );
}

export function Control({ className }: { className?: string }) {
  return (
    <div
      className={cx(
        "flex h-11.5 items-center rounded-lg border border-line-strong bg-paper-raised px-3",
        className,
      )}
    >
      <Placeholder className="h-4 w-2/3" />
    </div>
  );
}

export function SkeletonButton({
  children,
  variant = "primary",
  className,
}: {
  children: ReactNode;
  variant?: Parameters<typeof buttonClass>[0];
  className?: string;
}) {
  return (
    <span className={cx(buttonClass(variant), "opacity-60", className)}>
      {children}
    </span>
  );
}

export function SkeletonField({
  label,
  hint,
  multiline = false,
  required = false,
}: {
  label: string;
  hint?: string;
  multiline?: boolean;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-ink">
        {label}
        {required ? <span className="ml-1 text-accent">*</span> : null}
      </p>
      {hint ? <p className="text-xs text-ink-faint">{hint}</p> : null}
      {multiline ? (
        <div className="min-h-24 rounded-lg border border-line-strong bg-paper-raised px-3 py-2.5">
          <TextLines />
        </div>
      ) : (
        <Control />
      )}
    </div>
  );
}

export function ModeOptions({ value }: { value?: DeckStudyMode }) {
  const tr = useT();
  return (
    <div>
      <p className="mb-3 text-sm font-medium text-ink">
        {tr("studyMode.label")}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {(["language", "general"] as const).map((mode) => {
          const Icon = mode === "language" ? TranslateIcon : BooksIcon;
          return (
            <div
              key={mode}
              className={cx(
                "flex items-start gap-3 rounded-card border p-4",
                value === mode
                  ? "border-brand bg-brand-muted/40"
                  : "border-line bg-paper-raised",
              )}
            >
              <Placeholder className="mt-1 size-4 shrink-0 rounded-full" />
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-medium text-brand">
                  <Icon size={20} />
                  {tr(`studyMode.${mode}`)}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  {tr(`studyMode.${mode}Hint`)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DeckTiles({ library = false }: { library?: boolean }) {
  const tr = useT();
  return (
    <ul
      className={
        library
          ? "grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
          : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      }
    >
      {ITEMS.map((item) => (
        <li key={item} className={cx("flex", library && "pt-2")}>
          <Card
            as="article"
            className="deck-stack-card flex h-full w-full flex-col gap-3 [--deck-tab-color:var(--color-paper-sunken)]"
          >
            <Placeholder className="my-0.5 h-5 w-3/4" />
            <TextLines />
            <div className="mt-auto flex flex-wrap gap-3 pt-1">
              <Placeholder className="h-3 w-16" />
              <Placeholder className="h-3 w-24" />
              <Placeholder className="h-3 w-20" />
            </div>
            {library ? (
              <div className="space-y-3 border-t border-line pt-3">
                <div className="flex flex-wrap gap-3">
                  {["due", "new", "scheduled"].map((stat) => (
                    <Placeholder key={stat} className="h-3 w-20" />
                  ))}
                </div>
                <Placeholder className="h-3 w-40" />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Placeholder className="h-11 w-36 rounded-lg" />
                  <div className="flex items-center gap-2">
                    <Placeholder className="h-6 w-16 rounded-full" />
                    <span className="inline-flex min-h-11 items-center px-2 text-sm text-brand">
                      {tr("biblioteca.edit")}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <Placeholder className="h-3 w-28" />
            )}
          </Card>
        </li>
      ))}
    </ul>
  );
}
