import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guarda contra la trampa que decide si el sitio se puede publicar.
 *
 * La aplicación se compila en modo SPA (`ssr: false` en
 * `react-router.config.ts`) y se publica en GitHub Pages como archivos estáticos.
 * En ese modo React Router prohíbe `loader` y `action` de servidor en cualquier
 * ruta: no hay servidor donde ejecutarlos. El error sale al compilar, pero
 * después de haber escrito medio build, y el mensaje habla de "exports
 * inválidos" sin explicar el motivo real: que ya no hay servidor.
 *
 * El primer servidor que se quitó fue `decks.server.ts`, que solo servía para
 * leer mazos públicos con la clave publicable. Todo eso cabe en el cliente, y
 * ahora mismo ya cabe.
 */
const ROUTES_DIR = join(process.cwd(), "app", "routes");
const ROOT_ROUTE = join(process.cwd(), "app", "root.tsx");

/** Exportaciones que solo tienen sentido con un servidor detrás. */
const SERVER_ONLY_EXPORTS = ["loader", "action", "headers", "middleware"];

function collectRouteFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectRouteFiles(full);
    }
    return entry.name.endsWith(".tsx") ? [full] : [];
  });
}

const routeFiles = collectRouteFiles(ROUTES_DIR);

function readRoute(file: string): string {
  return readFileSync(file, "utf8");
}

/**
 * Detecta `export function loader()` y `export async function loader()`,
 * admitiendo la firma con `satisfies`, con tipo explícito o sin él.
 */
function hasServerExport(source: string, name: string): boolean {
  const pattern = new RegExp(
    `^export\\s+(async\\s+)?function\\s+${name}\\s*[(<]`,
    "m",
  );
  return pattern.test(source);
}

describe("publicación estática", () => {
  it("encuentra las rutas de la aplicación", () => {
    expect(routeFiles.length).toBeGreaterThan(5);
  });

  it.each(SERVER_ONLY_EXPORTS)(
    "ninguna ruta exporta `%s` de servidor",
    (name) => {
      const offenders = routeFiles
        .filter((file) => hasServerExport(readRoute(file), name))
        .map((file) => file.slice(process.cwd().length + 1));

      expect(offenders).toEqual([]);
    },
  );

  it("ninguna ruta hija declara HydrateFallback", () => {
    // En modo SPA el HTML se genera con la ruta raíz y nada más, así que los
    // `HydrateFallback` de las rutas hijas no se llegan a usar: React Router los
    // rechaza al compilar.
    const offenders = routeFiles
      .filter((file) => hasServerExport(readRoute(file), "HydrateFallback"))
      .map((file) => file.slice(process.cwd().length + 1));

    expect(offenders).toEqual([]);
  });

  it("la raíz sí declara HydrateFallback", () => {
    expect(hasServerExport(readRoute(ROOT_ROUTE), "HydrateFallback")).toBe(
      true,
    );
  });
});
