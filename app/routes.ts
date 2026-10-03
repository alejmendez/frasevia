import {
  index,
  layout,
  type RouteConfig,
  route,
} from "@react-router/dev/routes";

/**
 * Mapa de rutas de Frasevia.
 *
 * `layout` sin segmentos crea un agrupador: `privada.tsx` envuelve a las rutas
 * que exigen sesión y devuelve a la persona al inicio de sesión si no la tiene,
 * sin agregar nada a la URL.
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
    route("biblioteca/mazos/nuevo", "routes/mazo-nuevo.tsx"),
    route("biblioteca/mazos/nuevo-ia", "routes/mazo-ia.tsx"),
    route("biblioteca/mazos/:id/editar", "routes/mazo-editar.tsx"),
    route("estudiar/:deckId?", "routes/estudiar.tsx"),
    route("progreso", "routes/progreso.tsx"),
    route("ajustes/repaso", "routes/ajustes-repaso.tsx"),
    route("ajustes/ia", "routes/ajustes-ia.tsx"),
  ]),
] satisfies RouteConfig;
