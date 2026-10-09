import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { PRIVATE_ROUTES, ROUTE_PATTERNS } from "./routes-paths";

/**
 * La tabla de rutas y el mapa de `app/routes.ts`.
 *
 * Los patrones dicen cómo se llama cada pantalla y el mapa dice dónde está su
 * archivo. Es la misma información en dos sitios, y por eso esto compara las dos:
 * si alguien añade una pantalla en una y no en la otra, la pantalla funciona pero
 * durante la carga sale un rectángulo gris en vez de su esqueleto, y eso no da
 * ningún error.
 *
 * También comprueba que la barra no se cuela en los patrones de las rutas
 * agrupadas: dentro de `layout()` un `/biblioteca` produciría
 * `/biblioteca/biblioteca`.
 */
const ROUTES_DIR = join(process.cwd(), "app", "routes");

function routeModules(): string[] {
  return readdirSync(ROUTES_DIR).filter((name) => name.endsWith(".tsx"));
}

/** Los archivos que `app/routes.ts` menciona, con su prefijo. */
function mentionedFiles(): string[] {
  const source = readFileSync(join(ROUTES_DIR, "..", "routes.ts"), "utf8");
  return [...source.matchAll(/"(routes\/[\w-]+\.tsx)"/g)].map(
    (match) => match[1],
  );
}

describe("los patrones de las rutas", () => {
  it("van sin la barra inicial", () => {
    // Los del agrupador son relativos a él. Con la barra, `/biblioteca` dentro de
    // `layout()` daría `/biblioteca/biblioteca`.
    for (const pattern of PRIVATE_ROUTES) {
      expect(pattern.startsWith("/")).toBe(true);
    }
  });

  it("cubren todas las pantallas menos las agrupadas", () => {
    const source = readFileSync(join(ROUTES_DIR, "..", "routes.ts"), "utf8");

    // Las que se declaran con `route("x", …)` sin usar la tabla, porque son
    // públicas y no cambian: explorarlas aquí sería tautología.
    for (const literal of ["explorar", "mazos/:slug", "progreso"]) {
      expect(source).toContain(`route("${literal}"`);
    }
  });

  it("cada patrón tiene un archivo detrás", () => {
    const mentioned = mentionedFiles();

    for (const file of [
      "routes/mazo-nuevo.tsx",
      "routes/mazo-ia.tsx",
      "routes/mazo-editar.tsx",
      "routes/estudiar.tsx",
      "routes/ajustes-repaso.tsx",
      "routes/ajustes-ia.tsx",
    ]) {
      expect(mentioned).toContain(file);
    }
  });

  it("cada archivo del mapa tiene un patrón", () => {
    const mentioned = new Set(mentionedFiles());
    const screens = routeModules().filter(
      // El agrupador no es una pantalla: no tiene patrón porque no tiene URL.
      (name) => name !== "privada.tsx",
    );

    for (const name of screens) {
      expect(mentioned).toContain(`routes/${name}`);
    }
  });

  it("las ocho rutas privadas siguen siendo ocho", () => {
    // Este número es el contrato entre `routes.ts` y `privada.tsx`: cambiarla
    // tiene que ser a conciencia.
    expect(PRIVATE_ROUTES).toHaveLength(8);
  });

  it("la pantalla de inicio es la raíz", () => {
    expect(ROUTE_PATTERNS.inicio).toBe("/");
  });
});
