import {
  index,
  layout,
  type RouteConfig,
  route,
} from "@react-router/dev/routes";

import { ROUTE_PATTERNS } from "./lib/routes-paths";

/**
 * Mapa de rutas de Frasevia.
 *
 * `layout` sin segmentos crea un agrupador: `privada.tsx` envuelve a las rutas
 * que exigen sesión y devuelve a la persona al inicio de sesión si no la tiene,
 * sin agregar nada a la URL.
 *
 * Los patrones vienen de `lib/routes-paths.ts`, que es donde también los lee el
 * esqueleto de carga. Si estuvieran en los dos sitios, añadir una ruta sería
 * acordarse de los dos, y olvidar el segundo no da ningún error: la pantalla
 * nueva simplemente sale con un rectángulo gris mientras carga.
 */
export default [
  index("routes/inicio.tsx"),

  // Público
  route("explorar", "routes/explorar.tsx"),
  route("mazos/:slug", "routes/mazo-publico.tsx"),
  route("iniciar-sesion", "routes/iniciar-sesion.tsx"),
  route("crear-cuenta", "routes/crear-cuenta.tsx"),
  route("recuperar-contrasena", "routes/recuperar-contrasena.tsx"),

  // Cierre de sesión: sin interfaz propia, solo procesa el envío del navbar.
  route("salir", "routes/salir.tsx"),

  // Privado
  layout("routes/privada.tsx", [
    route("biblioteca", "routes/biblioteca.tsx"),
    route(strip(ROUTE_PATTERNS.mazoNuevo), "routes/mazo-nuevo.tsx"),
    route(strip(ROUTE_PATTERNS.mazoNuevoIa), "routes/mazo-ia.tsx"),
    route(strip(ROUTE_PATTERNS.mazoEditar), "routes/mazo-editar.tsx"),
    route(strip(ROUTE_PATTERNS.estudiar), "routes/estudiar.tsx"),
    route("progreso", "routes/progreso.tsx"),
    route(strip(ROUTE_PATTERNS.ajustesRepaso), "routes/ajustes-repaso.tsx"),
    route(strip(ROUTE_PATTERNS.ajustesIa), "routes/ajustes-ia.tsx"),
  ]),
] satisfies RouteConfig;

/**
 * El patrón sin la barra inicial.
 *
 * Los patrones del agrupador son relativos a él: si no, `route("/biblioteca", …)`
 * dentro de `layout()` daría `/biblioteca/biblioteca`.
 */
function strip(pattern: string): string {
  return pattern.replace(/^\//, "");
}
