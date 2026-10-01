import { redirect } from "react-router";
import { getSupabaseBrowser } from "~/lib/supabase";

/**
 * Cierre de sesión.
 *
 * Ruta sin interfaz propia a la que apunta el formulario del navbar. Como la
 * sesión vive en el navegador, el cierre se ejecuta en `clientAction` y después
 * se vuelve a la portada.
 */
export async function clientAction() {
  const supabase = getSupabaseBrowser();
  if (supabase) {
    await supabase.auth.signOut();
  }

  return redirect("/");
}

/**
 * Si alguien abre `/salir` directamente no hay nada que hacer aquí: se envía a la
 * portada en lugar de mostrar una página en blanco.
 */
export function loader() {
  return redirect("/");
}
