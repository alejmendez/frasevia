/**
 * Las rutas de la aplicación, en un solo sitio.
 *
 * `app/routes.ts` dice dónde está cada pantalla y este archivo dice cómo se
 * llama cada una en la barra. Los dos necesitan la misma tabla, y como estaban
 * separados, añadir una ruta era acordarse de los dos: si se olvidaba el esqueleto,
 * la pantalla nueva salía con un rectángulo gris durante la carga y no había forma
 * de quejarse.
 *
 * La tabla es la de `routes.ts`, con el prefijo de las agrupadas quitado. Los
 * patrones van sin la barra inicial porque `matchPath` no la espera.
 */
export const ROUTE_PATTERNS = {
  inicio: "/",
  explorar: "/explorar",
  biblioteca: "/biblioteca",
  progreso: "/progreso",
  /** Un mazo público, por su nombre legible. */
  mazoPublico: "/mazos/:slug",
  mazoNuevo: "/biblioteca/mazos/nuevo",
  mazoNuevoIa: "/biblioteca/mazos/nuevo-ia",
  mazoEditar: "/biblioteca/mazos/:id/editar",
  /** Con o sin identificador de mazo: la misma pantalla en los dos casos. */
  estudiar: "/estudiar/:deckId?",
  ajustesRepaso: "/ajustes/repaso",
  ajustesIa: "/ajustes/ia",
  iniciarSesion: "/iniciar-sesion",
  crearCuenta: "/crear-cuenta",
  recuperarContrasena: "/recuperar-contrasena",
} as const;

/** Las rutas que exigen sesión y devuelven a la persona al acceso si no la tiene. */
export const PRIVATE_ROUTES = [
  ROUTE_PATTERNS.biblioteca,
  ROUTE_PATTERNS.mazoNuevo,
  ROUTE_PATTERNS.mazoNuevoIa,
  ROUTE_PATTERNS.mazoEditar,
  ROUTE_PATTERNS.estudiar,
  ROUTE_PATTERNS.progreso,
  ROUTE_PATTERNS.ajustesRepaso,
  ROUTE_PATTERNS.ajustesIa,
] as const;
