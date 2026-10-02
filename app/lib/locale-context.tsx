import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  applyLocale,
  DEFAULT_LOCALE,
  type Locale,
  lookup,
  type MessageKey,
  type MessageParams,
  readStoredLocale,
  setStoredLocale,
} from "./locale";

/**
 * Idioma activo para toda la aplicación.
 *
 * Arranca en `DEFAULT_LOCALE` y se resuelve en un efecto, igual que
 * `auth-context.tsx` con la sesión: la preferencia está en `localStorage`, que no
 * existe durante la generación del HTML. Así el primer render del cliente
 * coincide con el que se compiló y la hidratación no tiene nada que adivinar.
 *
 * El idioma se ve desde el primer instante de todos modos. Entre la hidratación
 * y este efecto, la aplicación entera muestra `HydrateFallback` («Abriendo
 * Frasevia…»), de modo que el cambio de idioma no produce ningún destello: no
 * hay todavía ningún texto en otro idioma que pueda verse el equivocado.
 *
 * ## Un límite conocido: el título de la pestaña
 *
 * El título del navegador lo calculan las funciones `meta` de las rutas, y
 * React Router solo las vuelve a evaluar cuando cambia la URL o el loader. Cambiar
 * de idioma sin navegar, por tanto, deja el `<title>` en el idioma anterior hasta
 * el siguiente enlace o botón. Arreglarlo exigiría reescribir el título a mano
 * desde aquí, peleándose con el enrutador por el mismo atributo, a cambio de un
 * detalle que se corrige solo con la siguiente navegación.
 */
interface LocaleContextValue {
  locale: Locale;
  /** Elige un idioma y lo recuerda en este navegador. */
  setLocale: (locale: Locale) => void;
  /** Traduce en el idioma elegido. Cambia de identidad al cambiar el idioma. */
  t: (key: MessageKey, params?: MessageParams) => string;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key, params) => lookup(DEFAULT_LOCALE, key, params),
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const stored = readStoredLocale() ?? DEFAULT_LOCALE;
    applyLocale(stored);
    setLocaleState(stored);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    setStoredLocale(next);
  }, []);

  // `useCallback` y no una función suelta en el render porque su identidad es
  // su contenido: cambia al cambiar el idioma, y eso es justo lo que necesitan
  // los componentes que la ponen en alguna lista de dependencias.
  const t = useCallback(
    (key: MessageKey, params?: MessageParams) => lookup(locale, key, params),
    [locale],
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

/**
 * Traductor del idioma actual.
 *
 * Es el hook que se usa en los componentes. Devuelve una función, no un
 * objeto, para poder llamarla inline sin envolverla.
 */
export function useT() {
  return useContext(LocaleContext).t;
}
