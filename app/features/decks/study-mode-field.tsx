import { BooksIcon, TranslateIcon } from "@phosphor-icons/react/dist/ssr";
import { cx } from "~/components/ui";
import { useT } from "~/lib/locale-context";
import type { DeckStudyMode } from "~/lib/types";

export function StudyModeField({
  value,
  onChange,
  disabled = false,
}: {
  value: DeckStudyMode;
  onChange: (value: DeckStudyMode) => void;
  disabled?: boolean;
}) {
  const tr = useT();
  return (
    <fieldset disabled={disabled}>
      <legend className="mb-3 text-sm font-medium text-ink">
        {tr("studyMode.label")}
      </legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {(["language", "general"] as const).map((mode) => {
          const Icon = mode === "language" ? TranslateIcon : BooksIcon;
          return (
            <label
              key={mode}
              className={cx(
                "flex cursor-pointer items-start gap-3 rounded-card border p-4 transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand",
                value === mode
                  ? "border-brand bg-brand-muted/40"
                  : "border-line bg-paper-raised hover:border-line-strong",
              )}
            >
              <input
                type="radio"
                name="study_mode"
                value={mode}
                checked={value === mode}
                onChange={() => onChange(mode)}
                className="mt-1 size-4 shrink-0 accent-[var(--color-brand)]"
              />
              <span className="min-w-0">
                <span className="flex items-center gap-2 font-medium text-brand">
                  <Icon aria-hidden size={20} />
                  {tr(`studyMode.${mode}`)}
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-ink-soft">
                  {tr(`studyMode.${mode}Hint`)}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
