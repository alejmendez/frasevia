import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Techo de tamaño por archivo, como migas.
 *
 * La regla que guía este repositorio es que un archivo tenga un único motivo de
 * existir: un módulo de ruta es una tabla de contenidos, un componente es una
 * pieza que se puede leer de un tirón. Los números de abajo son la forma
 * mecánica de sostenerlo.
 *
 * Cada techo arranca en el tamaño real que tenía el archivo más grande de su
 * zona y **se baja a medida que el refactor avanza**. No son límites que haya que
 * defender: son el punto de partida de algo que ya se está haciendo. Al terminar
 * el refactor valen 130 para rutas, 300 para el resto del código y 250 para los
 * catálogos de traducción, que dejan de ser monolios al partirse por dominio.
 *
 * Subir un techo es legítimo —un archivo nuevo y grande puede estar bien—, pero
 * conviene que sea una decisión consciente y no un accidento.
 */
const CEILINGS: Array<{
  label: string;
  matches: (path: string) => boolean;
  max: number;
}> = [
  // Va primero porque una prueba vive dentro de una zona y el orden decide.
  {
    label: "prueba",
    matches: (path) => /\.test\.[cm]?[jt]sx?$/.test(path),
    max: 500,
  },
  {
    label: "módulo de ruta",
    matches: (path) => path.startsWith(`routes${sep}`),
    max: 950,
  },
  {
    label: "catálogo de traducción",
    matches: (path) => path.startsWith(`lib${sep}locales${sep}`),
    max: 1000,
  },
  {
    label: "componente compartido",
    matches: (path) => path.startsWith(`components${sep}`),
    max: 1150,
  },
  {
    label: "código de biblioteca",
    matches: (path) => path.startsWith(`lib${sep}`),
    max: 330,
  },
  {
    label: "código de dominio",
    matches: (path) => path.startsWith(`features${sep}`),
    max: 470,
  },
  {
    label: "raíz de la aplicación",
    matches: () => true,
    max: 490,
  },
];

const APP_DIR = join(process.cwd(), "app");
const IGNORED_DIRS = new Set([".react-router", "build", "node_modules"]);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) return [];
      return sourceFiles(join(dir, entry.name));
    }
    return /\.[cm]?[jt]sx?$/.test(entry.name) ? [join(dir, entry.name)] : [];
  });
}

function lineCount(path: string): number {
  const lines = readFileSync(path, "utf8").split("\n");
  // El salto final del archivo no es una línea más, y todos los archivos lo
  // tienen: sin esto el techo mide una línea de más.
  if (lines.at(-1) === "") lines.pop();
  return lines.length;
}

function ceilingFor(path: string) {
  const found = CEILINGS.find((entry) => entry.matches(path));
  if (!found) throw new Error(`sin techo definido para ${path}`);
  return found;
}

const files = sourceFiles(APP_DIR).map((path) => ({
  path: relative(APP_DIR, path),
  lines: lineCount(path),
}));

/** Quién se pasa de su techo, calculado una vez para no repetirlo en el test. */
const breaches = CEILINGS.map((ceiling) => ({
  label: ceiling.label,
  offenders: files
    .filter((file) => ceilingFor(file.path).label === ceiling.label)
    .filter((file) => file.lines > ceiling.max)
    .map((file) => `${file.path}: ${file.lines} > ${ceiling.max}`)
    .sort(),
}));

describe("tamaño de los archivos", () => {
  it("encuentra el código de la aplicación", () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it.each(breaches)(
    "ningún archivo de $label supera su techo",
    ({ offenders }) => {
      expect(offenders).toEqual([]);
    },
  );

  it("ningún archivo se queda sin techo", () => {
    for (const file of files) {
      expect(() => ceilingFor(file.path)).not.toThrow();
    }
  });
});
