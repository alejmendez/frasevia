import {
  Outlet,
  redirect,
  type ShouldRevalidateFunctionArgs,
} from "react-router";
import { SelectionQuickAdd } from "~/components/selection-quick-add";
import { ConfigNotice } from "~/components/ui";
import { listMyQuickAddDecks } from "~/lib/decks";
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

  const { decks, error } = await listMyQuickAddDecks(
    session.supabase,
    session.userId,
  );
  const url = new URL(request.url);
  const sharedText =
    url.searchParams.get("text")?.trim() ||
    url.searchParams.get("title")?.trim() ||
    null;

  return {
    status: "ready" as const,
    userId: session.userId,
    quickAddDecks: decks,
    quickAddDeckError: error,
    sharedText,
  };
}

/**
 * No recarga la lista de mazos al enviar algo desde una pantalla hija.
 *
 * Este agrupador está montado en todas las rutas privadas, así que cualquier
 * acción de una de ellas (puntuar una ficha, guardar un mazo) lo hacía volver a
 * pedir la lista de adición rápida aunque no hubiera cambiado. Aquí solo se
 * recarga cuando cambia la URL, que es lo único que puede alterarla: entrar a
 * otra pantalla, cambiar de mazo o volver de otra pestaña siguen recargando,
 * porque el enrutador también recarga al cambiar los parámetros de ruta.
 */
export function shouldRevalidate({
  currentUrl,
  nextUrl,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs): boolean {
  if (
    currentUrl.pathname === nextUrl.pathname &&
    currentUrl.search === nextUrl.search
  ) {
    return false;
  }

  return defaultShouldRevalidate;
}

export default function Privada({ loaderData }: Route.ComponentProps) {
  if (loaderData.status === "unconfigured") {
    return <ConfigNotice />;
  }

  return (
    <>
      <Outlet />
      <SelectionQuickAdd
        decks={loaderData.quickAddDecks}
        deckLoadError={loaderData.quickAddDeckError}
        sharedText={loaderData.sharedText}
      />
    </>
  );
}
