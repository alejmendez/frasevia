import { redirect } from "react-router";
import { getSupabaseBrowser } from "~/lib/supabase";

/**
 * Cierre de sesión.
 *
 * Ruta sin interfaz propia a la que apunta el formulario del navbar. Como la
 * sesión vive en el navegador, el cierre se ejecuta en `clientAction` y después
 * se vuelve a la portada.
 *
 * Si alguien abre `/salir` directamente no hay acción que ejecutar: la ruta no
 * declara `clientLoader` ni componente, así que el enrutador no encuentra nada
 * que renderizar en esa URL y cae en el `ErrorBoundary` raíz con el 404.
 */
export async function clientAction() {
  const supabase = getSupabaseBrowser();
  if (supabase) {
    await supabase.auth.signOut();
  }

  return redirect("/");
}
