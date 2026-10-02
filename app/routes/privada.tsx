import { Outlet, redirect } from "react-router";
import { ConfigNotice } from "~/components/ui";
import { t } from "~/lib/locale";
import { getSession, loginPath } from "~/lib/session";
import type { Route } from "./+types/privada";

export function meta() {
  return [{ title: t("biblioteca.metaTitle") }];
}

/**
 * Agrupador de las rutas privadas.
 *
 * No agrega segmentos a la URL: agrupa `/biblioteca`, `/estudiar/:deckId` y
 * `/progreso` bajo una misma comprobación. La sesión de Supabase solo existe en
 * el navegador, así que la comprobación corre en `clientLoader`: primero se ve
 * el `HydrateFallback` de la raíz y es el cliente quien decide si deja pasar o
 * devuelve a la persona al inicio de sesión, conservando la ruta original en
 * `redirectTo`.
 */
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const session = await getSession();

  if (session.status === "unconfigured") {
    return { status: "unconfigured" as const };
  }

  if (session.status === "anonymous") {
    throw redirect(loginPath(request));
  }

  return { status: "ready" as const, userId: session.userId };
}

export default function Privada({ loaderData }: Route.ComponentProps) {
  if (loaderData.status === "unconfigured") {
    return <ConfigNotice />;
  }

  return <Outlet />;
}
