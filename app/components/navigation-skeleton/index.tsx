import { useMatches } from "react-router";

import { Page } from "~/components/ui";
import type { Deck } from "~/lib/types";

import { AuthSkeleton } from "./auth";
import { AiDeckSkeleton, DeckFormSkeleton } from "./deck-form";
import { PublicDeckSkeleton } from "./decks";
import { ExploreSkeleton, LibrarySkeleton, ProgressSkeleton } from "./library";
import { Placeholder } from "./primitives";
import { AiSettingsSkeleton, ReviewSettingsSkeleton } from "./settings";
import { StudySkeleton } from "./study";
import { skeletonTarget } from "./target";

/**
 * El esqueleto de carga de la pantalla que se está abriendo.
 *
 * Solo decide. Qué pantalla es lo dice `skeletonTarget`, que es una función pura
 * con sus pruebas, y cómo se ve cada una lo dicen los archivos de al lado. Aquí no
 * hay ni un `matchPath`: añadir una pantalla es añadir una fila a una tabla, no
 * escribir otro `else if`.
 */

/**
 * Los mazos que ya trajo la pantalla anterior, si los trajo.
 *
 * El editor y la página pública reutilizan el título que ya estaba en pantalla,
 * para que al cambiar de pantalla no se vea un rectángulo gris donde estaba un
 * nombre.
 */
function decksFromMatches(matches: ReturnType<typeof useMatches>): Deck[] {
  return matches.flatMap(({ loaderData }) => {
    const data = loaderData as
      | { deck?: Deck | null; decks?: Deck[] }
      | undefined;
    return data?.decks ?? (data?.deck ? [data.deck] : []);
  });
}

export function NavigationSkeleton({
  label,
  pathname,
  search = "",
}: {
  label: string;
  pathname: string;
  search?: string;
}) {
  const matches = useMatches();
  const target = skeletonTarget(pathname);
  const deck = target?.deckId
    ? decksFromMatches(matches).find((item) => item.id === target.deckId)
    : undefined;

  return (
    <div role="status" aria-label={label}>
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">{content(target, deck, search)}</div>
    </div>
  );
}

function content(
  target: ReturnType<typeof skeletonTarget>,
  deck: Deck | undefined,
  search: string,
) {
  switch (target?.kind) {
    case "inicio":
      return <Blank />;
    case "explorar":
      return <ExploreSkeleton search={search} />;
    case "biblioteca":
      return <LibrarySkeleton />;
    case "progreso":
      return <ProgressSkeleton />;
    case "mazo-publico":
      return <PublicDeckSkeleton deck={deck} />;
    case "estudiar":
      return <StudySkeleton deckSession={target.deckSession} deck={deck} />;
    case "mazo-nuevo":
      return <DeckFormSkeleton />;
    case "mazo-nuevo-ia":
      return <AiDeckSkeleton />;
    case "mazo-editar":
      return <DeckFormSkeleton editing deck={deck} />;
    case "ajustes-repaso":
      return <ReviewSettingsSkeleton />;
    case "ajustes-ia":
      return <AiSettingsSkeleton />;
    case "iniciar-sesion":
      return <AuthSkeleton kind="signIn" />;
    case "crear-cuenta":
      return <AuthSkeleton kind="signUp" />;
    case "recuperar-contrasena":
      return <AuthSkeleton kind="reset" />;
    default:
      // Una ruta que no es de la aplicación, o la que aún no se sabe: es mejor
      // un rectángulo genérico que adivinar una pantalla equivocada.
      return <Blank />;
  }
}

function Blank() {
  return (
    <Page>
      <Placeholder className="h-10 w-64 max-w-full" />
    </Page>
  );
}
