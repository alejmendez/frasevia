import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guarda contra una trampa que no aparece ni en los tipos ni en el lint.
 *
 * Los módulos `*.client.ts` se eliminan del bundle del servidor: React Router
 * los trata como exclusivos del navegador. Si un módulo así se importa desde el
 * código de un componente (que también se renderiza en el servidor), sus
 * exportaciones llegan como `undefined` y el error aparece en producción como
 * `TypeError: (void 0) is not a function`, con un 500 en rutas que en el editor
 * se ven correctas.
 *
 * Por eso los módulos compartidos se llaman `session.ts`, `decks.ts` y
 * `supabase.ts`, y no con sufijo. Tampoco queda ya ningún `*.server.ts`: la
 * aplicación se compila en modo SPA y se publica sin servidor, así que el
 * código de servidor tendría que mudarse al cliente o desaparecer. Lo que
 * impide reintroducirlo lo vigila `app/lib/static.test.ts`.
 */
function collectFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const full = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(full);
    }
  }

  return files;
}

const appDir = join(process.cwd(), "app");
const files = collectFiles(appDir);

describe("convenciones de nombres de módulo", () => {
  it("encuentra los archivos de la aplicación", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it("no hay módulos con sufijo .client.ts", () => {
    const offenders = files.filter((file) => file.endsWith(".client.ts"));
    expect(offenders).toEqual([]);
  });

  it("los módulos .server.ts solo viven en app/lib", () => {
    const offenders = files.filter(
      (file) =>
        file.endsWith(".server.ts") && !file.startsWith(join(appDir, "lib")),
    );
    expect(offenders).toEqual([]);
  });
});
