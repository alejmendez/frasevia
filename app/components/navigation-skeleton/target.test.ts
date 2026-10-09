import { describe, expect, it } from "vitest";

import { ROUTE_PATTERNS } from "~/lib/routes-paths";
import { skeletonTarget } from "./target";

/**
 * Qué esqueleto se pinta en cada ruta.
 *
 * Es el tipo de cosa que se rompe sin ruido: si una ruta nueva no está en la
 * tabla, la pantalla funciona pero durante la carga sale un rectángulo gris, y
 * eso no da ningún error. Por eso hay una prueba por ruta en vez de confiar en que
 * quien añada una pantalla también se acuerde de aquí.
 */
describe("qué esqueleto corresponde a cada ruta", () => {
  it.each([
    ["/", "inicio"],
    ["/explorar", "explorar"],
    ["/biblioteca", "biblioteca"],
    ["/progreso", "progreso"],
    ["/biblioteca/mazos/nuevo", "mazo-nuevo"],
    ["/biblioteca/mazos/nuevo-ia", "mazo-nuevo-ia"],
    ["/estudiar", "estudiar"],
    ["/estudiar/abc-123", "estudiar"],
    ["/ajustes/repaso", "ajustes-repaso"],
    ["/ajustes/ia", "ajustes-ia"],
    ["/iniciar-sesion", "iniciar-sesion"],
    ["/crear-cuenta", "crear-cuenta"],
    ["/recuperar-contrasena", "recuperar-contrasena"],
  ])("%s es %s", (pathname, kind) => {
    expect(skeletonTarget(pathname)?.kind).toBe(kind);
  });

  it("el editor de mazo no se confunde con crear uno nuevo", () => {
    // `/biblioteca/mazos/nuevo` también encaja en `mazo: id`, y si el editor se
    // comprobara primero, la pantalla de crear mostraría los campos de las
    // tarjetas de un mazo que todavía no existe.
    expect(skeletonTarget("/biblioteca/mazos/nuevo")?.kind).toBe("mazo-nuevo");
    expect(skeletonTarget(ROUTE_PATTERNS.mazoNuevo)?.editing).toBe(false);
    expect(skeletonTarget("/biblioteca/mazos/abc-123/editar")?.kind).toBe(
      "mazo-editar",
    );
  });

  it("el editor recuerda qué mazo es", () => {
    expect(skeletonTarget("/biblioteca/mazos/abc-123/editar")?.deckId).toBe(
      "abc-123",
    );
  });

  it("el mazo público se busca por su nombre legible, no por su identificador", () => {
    const target = skeletonTarget("/mazos/verbos-irregulares");

    expect(target?.kind).toBe("mazo-publico");
    expect(target?.slug).toBe("verbos-irregulares");
    expect(target?.deckId).toBeUndefined();
  });

  it("distingue la sesión de un mazo de la cola global", () => {
    expect(skeletonTarget("/estudiar/abc-123")?.deckSession).toBe(true);
    expect(skeletonTarget("/estudiar/abc-123")?.deckId).toBe("abc-123");
    expect(skeletonTarget("/estudiar")?.deckSession).toBe(false);
  });

  it("una barra final no cambia la pantalla", () => {
    expect(skeletonTarget("/biblioteca/")?.kind).toBe("biblioteca");
    expect(skeletonTarget("/")?.kind).toBe("inicio");
  });

  it("una ruta que no es de la aplicación no inventa un esqueleto", () => {
    // La de error y cualquier otra: es mejor el rectángulo genérico que adivinar.
    expect(skeletonTarget("/no-existe")).toBeNull();
    expect(skeletonTarget("/salir")).toBeNull();
  });
});
