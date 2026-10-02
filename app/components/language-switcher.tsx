import { GlobeIcon } from "@phosphor-icons/react/dist/ssr/Globe";
import { cx } from "~/components/ui";
import { LOCALE_INFO, otherLocale } from "~/lib/locale";
import { useLocale } from "~/lib/locale-context";

/**
 * Selector de idioma de la interfaz.
 *
 * Con dos idiomas no hace falta un menú desplegable: un botón que salta al otro
 * es el selector entero, y tiene exactamente la misma forma que el interruptor
 * de tema que tiene al lado, que ya se sabe usar. Si algún día entra un tercer
 * idioma, lo que hay que sustituir es este componente por una lista; el estado,
 * el almacenamiento y el resto de la aplicación no cambian.
 *
 * ## Por qué el nombre del idioma va en su idioma
 *
 * El texto para lectores de pantalla es «Español» o «English», no «cambia a
 * español» o «switch to Spanish». Es la convención de los selectores de idioma de
 * todo el mundo, y funciona: un nombre de idioma siempre se reconoce en su
 * propia lengua, esté o no translate la interfaz. Poner la instrucción en el
 * idioma de la interfaz obligaría a quien la tiene en inglés a buscar una palabra
 * que no está en la pantalla que tiene delante.
 *
 * Lo visible, en cambio, es el código corto del idioma destino: cabe en 36
 * píxeles y así se ve a qué se va a cambiar, como el icono del interruptor de
 * tema muestra el tema al que se va.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const next = otherLocale(locale);

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      className={cx(
        "inline-flex h-9 items-center gap-1.5 rounded-lg border border-line-strong bg-paper-raised px-2 text-sm font-medium text-ink transition-colors hover:bg-paper-sunken",
        className,
      )}
    >
      <GlobeIcon aria-hidden size={16} weight="bold" />
      <span aria-hidden>{LOCALE_INFO[next].short}</span>
      <span className="sr-only">{LOCALE_INFO[next].native}</span>
    </button>
  );
}
