import { MoonIcon } from "@phosphor-icons/react/dist/ssr/Moon";
import { SunIcon } from "@phosphor-icons/react/dist/ssr/Sun";
import { useEffect } from "react";
import { cx } from "~/components/ui";
import { useT } from "~/lib/locale-context";
import { toggleTheme, watchSystemTheme } from "~/lib/theme";

/**
 * Interruptor de tema claro / noche.
 *
 * Ni el icono ni la etiqueta dependen del estado de React: los dos están en el
 * marcado y la clase `dark` del documento decide cuál se ve. Así el HTML que
 * genera el servidor y el que genera el cliente son idénticos, no hace falta
 * reservar espacio para la resolución y no hay destello al cambiar de tema.
 *
 * Las dos etiquetas sí dependen del idioma, y por eso van en el marcado en vez
 * de en un atributo: hay dos, una por tema, y escribirlas dentro del botón es lo
 * que permite que las dos estén presentes desde el primer render.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useT();

  // Mientras no haya elección guardada, el sistema manda sobre el tema.
  useEffect(watchSystemTheme, []);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cx(
        "inline-flex size-9 items-center justify-center rounded-lg border border-line-strong bg-paper-raised text-ink transition-colors hover:bg-paper-sunken",
        className,
      )}
    >
      {/* El icono muestra el tema al que se va, como es habitual. */}
      <SunIcon aria-hidden size={18} className="dark:hidden" />
      <MoonIcon aria-hidden size={18} className="hidden dark:block" />

      {/* Un solo nombre accesible, el de la acción. `display: none` saca el
          texto del árbol de accesibilidad, así que en cada tema se anuncia
          únicamente la etiqueta del interruptor que se ve. */}
      <span className="sr-only dark:hidden">{t("theme.toDark")}</span>
      <span className="sr-only hidden dark:inline">{t("theme.toLight")}</span>
    </button>
  );
}
