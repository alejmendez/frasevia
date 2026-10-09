import { matchPath } from "react-router";

import { ROUTE_PATTERNS } from "~/lib/routes-paths";

/**
 * Qué pantalla es esta, y con qué datos.
 *
 * Antes de esto era una cadena de once `matchPath` dentro del componente, en el
 * orden en que se comprobaban: si dos patrones se solapaban, ganaba el que
 * estuviera antes, y cambiar el orden cambiaba la pantalla sin que nadie se
 * enterara. Aquí la decisión es una función pura, sin React, y hay una prueba para
 * cada ruta.
 *
 * El orden sí importa en un caso: `/biblioteca/mazos/nuevo` y
 * `/biblioteca/mazos/:id/editar` serían los dos «un formulario de mazo», y el
 * editor necesita saber cuál de los dos es para enseñar los campos de las
 * tarjetas. Por eso el editor se comprueba después de los dos concretos.
 */
export type SkeletonKind =
  | "inicio"
  | "explorar"
  | "biblioteca"
  | "progreso"
  | "mazo-publico"
  | "mazo-nuevo"
  | "mazo-nuevo-ia"
  | "mazo-editar"
  | "estudiar"
  | "ajustes-repaso"
  | "ajustes-ia"
  | "iniciar-sesion"
  | "crear-cuenta"
  | "recuperar-contrasena";

/** Qué hay que mirar en la ruta para saber qué pintar. */
export interface SkeletonTarget {
  kind: SkeletonKind;
  /** El identificador del mazo, si la ruta lo lleva. */
  deckId?: string;
  /** El nombre legible del mazo público, si es esa ruta. */
  slug?: string;
  /** Si la pantalla de estudio va con un mazo concreto o con la cola global. */
  deckSession: boolean;
  /** Si el formulario de mazo es el de crear o el de editar. */
  editing: boolean;
}

const AUTH_KINDS: Record<string, SkeletonKind> = {
  [ROUTE_PATTERNS.iniciarSesion]: "iniciar-sesion",
  [ROUTE_PATTERNS.crearCuenta]: "crear-cuenta",
  [ROUTE_PATTERNS.recuperarContrasena]: "recuperar-contrasena",
};

/** Las pantallas que se reconocen por su ruta exacta. */
const EXACT: Array<[string, SkeletonKind]> = [
  [ROUTE_PATTERNS.inicio, "inicio"],
  [ROUTE_PATTERNS.explorar, "explorar"],
  [ROUTE_PATTERNS.biblioteca, "biblioteca"],
  [ROUTE_PATTERNS.progreso, "progreso"],
  [ROUTE_PATTERNS.mazoNuevo, "mazo-nuevo"],
  [ROUTE_PATTERNS.mazoNuevoIa, "mazo-nuevo-ia"],
  [ROUTE_PATTERNS.ajustesRepaso, "ajustes-repaso"],
  [ROUTE_PATTERNS.ajustesIa, "ajustes-ia"],
];

/**
 * Decide qué esqueleto pintar para una ruta.
 *
 * Devuelve `null` cuando la ruta no es de la aplicación —la de error, o
 * cualquier otra— y entonces se pinta el esqueleto genérico.
 */
export function skeletonTarget(pathname: string): SkeletonTarget | null {
  // La barra final se ignora: `/biblioteca` y `/biblioteca/` son la misma pantalla.
  const path = pathname.replace(/\/$/, "") || "/";

  for (const [pattern, kind] of EXACT) {
    if (matchPath(pattern, path)) {
      return { kind, deckSession: false, editing: false };
    }
  }

  const auth = AUTH_KINDS[path];
  if (auth) return { kind: auth, deckSession: false, editing: false };

  const editing = matchPath(ROUTE_PATTERNS.mazoEditar, path);
  if (editing) {
    return {
      kind: "mazo-editar",
      deckId: editing.params.id,
      deckSession: false,
      editing: true,
    };
  }

  const study = matchPath(ROUTE_PATTERNS.estudiar, path);
  if (study) {
    const deckId = study.params.deckId;
    return {
      kind: "estudiar",
      deckId,
      // Con identificador la pantalla es la sesión de ese mazo; sin él, la cola
      // global. La diferencia se ve en el esqueleto.
      deckSession: Boolean(deckId),
      editing: false,
    };
  }

  const publicDeck = matchPath(ROUTE_PATTERNS.mazoPublico, path);
  if (publicDeck) {
    return {
      kind: "mazo-publico",
      slug: publicDeck.params.slug,
      deckSession: false,
      editing: false,
    };
  }

  return null;
}
