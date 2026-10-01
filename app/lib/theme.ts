/**
 * Tema claro / noche.
 *
 * El estado vive en dos sitios y en ninguno hay estado de React: la clase
 * `dark` en `<html>` (que es lo que lee el CSS) y `localStorage` (la
 * preferencia). El script de arranque la aplica antes del primer pintado para
 * que no haya destello, y las funciones de aquí son las que mueve el
 * interruptor.
 *
 * En el servidor no se resuelve nada: el marcado inicial es idéntico en los dos
 * temas y el interruptor se dibuja con CSS en vez de con estado, así que la
 * hidratación no tiene nada que adivinar.
 */

export type Theme = "light" | "dark";

const STORAGE_KEY = "frasevia-theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * Color de la barra del navegador en móvil, uno por tema. El CSS no llega a los
 * controles del navegador, así que este valor solo se puede poner desde aquí.
 * Debe coincidir con `--color-paper` de cada tema en `app/app.css`.
 */
const THEME_COLOR: Record<Theme, string> = {
  light: "#faf7f1",
  dark: "#16130f",
};

/** La preferencia guardada, o `null` si esta persona todavía no eligió tema. */
export function readStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    // Almacenamiento bloqueado (modo privado, cookies de terceros): seguimos con
    // la preferencia del sistema y el tema solo durará esta pestaña.
    return null;
  }
}

export function systemTheme(): Theme {
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

/** Lo que hay en pantalla ahora mismo: la elección si existe, si no, la del sistema. */
export function currentTheme(): Theme {
  return readStoredTheme() ?? systemTheme();
}

/** Pone el tema en el documento. Es la única que toca `<html>`. */
export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLOR[theme]);
}

/** Elige un tema y lo recuerda. */
export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Sin almacenamiento el cambio se aplica igual, solo que no se recuerda.
  }

  applyTheme(theme);
}

/** Alterna entre los dos temas y devuelve al que se pasó. */
export function toggleTheme(): Theme {
  const next = currentTheme() === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}

/**
 * Sigue al sistema mientras la persona no haya elegido un tema a mano.
 *
 * Devuelve la función de limpieza que espera `useEffect`.
 */
export function watchSystemTheme() {
  const media = window.matchMedia(DARK_QUERY);
  const onChange = () => {
    if (readStoredTheme() === null) {
      applyTheme(systemTheme());
    }
  };

  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/**
 * Script de arranque, para el `<head>`.
 *
 * Va como una cadena y no como módulo a propósito: tiene que ser el primer
 * código que corre en la página, antes de que el navegador pinte el fondo, y
 * un `import` no da esa garantía. Esa es también la razón de que repita la
 * lógica de `currentTheme()`: si cambia una de las dos, hay que cambiar la otra.
 *
 * Todos los valores se incrustan ya en JSON, para que ninguna constante pueda
 * dejar el script a medio construir: un `#` suelto aquí es un `SyntaxError` y
 * el tema no se aplica nunca, en silencio.
 */
export const THEME_BOOTSTRAP =
  `(function(){try{` +
  `var s=localStorage.getItem(${JSON.stringify(STORAGE_KEY)}),` +
  `d=s?s==="dark":matchMedia(${JSON.stringify(DARK_QUERY)}).matches,` +
  `r=document.documentElement,c=${JSON.stringify(THEME_COLOR)};` +
  `d?r.classList.add("dark"):r.classList.remove("dark");` +
  `var m=document.querySelector('meta[name="theme-color"]');` +
  `m&&m.setAttribute("content",c[d?"dark":"light"]);` +
  `}catch(e){}})()`;
