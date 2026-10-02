import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guarda contra un fallo silencioso en la navegación del cliente.
 *
 * `redirect()` existe para que lo capture el enrutador, y el enrutador solo lo
 * captura dentro de un `loader` o un `action`. Lanzarlo desde un manejador de
 * evento —un `onClick` o un `onSubmit`— no lo captura nadie: la página se queda
 * donde está y la `Response` asoma como error sin capturar en la consola. Se
 * comprobó en el navegador: la URL no cambia.
 *
 * El caso grave es cuando el guardado ya ocurrió. En `mazo-nuevo.tsx` el mazo
 * se inserta y luego se lanza el redirect, así que la persona ve el formulario
 * como si nada, y si pulsa «Crear» otra vez se le queda un duplicado en la
 * biblioteca.
 *
 * El sitio se publica sin servidor, así que casi todo ocurre en manejadores de
 * evento y el patrón se copia de un archivo a otro con facilidad. Para moverse
 * de página en el cliente se usa `navigate()`.
 */
const ROUTES_DIR = join(process.cwd(), "app", "routes");

function routeFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      return routeFiles(full);
    }
    return entry.name.endsWith(".tsx") ? [full] : [];
  });
}

/**
 * Rangos de carácter que cubren el cuerpo de las funciones de datos.
 *
 * Se cuenta el texto desde que se abre la llave hasta que se cierra, teniendo
 * en cuenta comillas, para no calcular mal con una `}` dentro de un ejemplo.
 */
function dataFunctionRanges(source: string): [number, number][] {
  const ranges: [number, number][] = [];
  const declaration =
    /export\s+(?:async\s+)?function\s+(clientLoader|clientAction)\s*[(<]/g;
  let match = declaration.exec(source);

  while (match !== null) {
    // Hay que saltar los parámetros antes de buscar la llave del cuerpo: en
    // `clientLoader({ request })` la primera llave es la desestructuración del
    // argumento, no el inicio de la función.
    const open = bodyBrace(source, match.index);
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = open; index < source.length; index++) {
      const char = source[index];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === "\\") {
          escaped = true;
        } else if (char === '"' || char === "'" || char === "`") {
          inString = false;
        }
        continue;
      }

      if (char === '"' || char === "'" || char === "`") {
        inString = true;
      } else if (char === "{") {
        depth++;
      } else if (char === "}") {
        depth--;
        if (depth === 0) {
          ranges.push([open, index]);
          break;
        }
      }
    }

    match = declaration.exec(source);
  }

  return ranges;
}

/** Posición de la llave que abre el cuerpo de la función que empieza en `from`. */
function bodyBrace(source: string, from: number): number {
  let parens = 0;
  let seen = false;

  for (let index = from; index < source.length; index++) {
    const char = source[index];

    if (char === "(") {
      parens++;
      seen = true;
    } else if (char === ")") {
      parens--;
      if (seen && parens === 0) {
        // La llave del cuerpo es la siguiente: los parámetros ya cerraron.
        return source.indexOf("{", index);
      }
    } else if (char === "{" && !seen) {
      // Sin paréntesis: la declaración traía el tipo o ya estaba la llave.
      return index;
    }
  }

  return -1;
}

/**
 * Sustituye los comentarios por espacios, dejando los saltos de línea intactos.
 *
 * Hace falta porque el patrón buscado aparece justamente en comentarios que
 * explican por qué no se usa, y sin esto el test los contaría como fallos. Se
 * recorre con cuidado de cadenas y plantillas porque un `//` de una URL como
 * `https://…` no abre un comentario.
 */
function stripComments(source: string): string {
  const out = source.split("");
  let inString: string | null = null;
  let inLine = false;
  let inBlock = false;

  const blank = (index: number) => {
    if (out[index] !== "\n") {
      out[index] = " ";
    }
  };

  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    const next = source[index + 1];

    if (inLine) {
      if (char === "\n") {
        inLine = false;
      } else {
        blank(index);
      }
      continue;
    }

    if (inBlock) {
      if (char === "*" && next === "/") {
        blank(index);
        blank(index + 1);
        inBlock = false;
        index++;
      } else {
        blank(index);
      }
      continue;
    }

    if (inString !== null) {
      if (char === "\\") {
        index++;
        continue;
      }
      if (char === inString) {
        inString = null;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      inString = char;
      continue;
    }

    if (char === "/" && next === "/") {
      inLine = true;
      blank(index);
      continue;
    }

    if (char === "/" && next === "*") {
      inBlock = true;
      blank(index);
      blank(index + 1);
      index++;
    }
  }

  return out.join("");
}

function isInside(index: number, ranges: [number, number][]): boolean {
  return ranges.some(([start, end]) => index >= start && index <= end);
}

/** Desplazamiento en caracteres del principio de cada línea. */
function lineOffsets(source: string): number[] {
  const offsets: number[] = [0];

  for (let index = 0; index < source.length; index++) {
    if (source[index] === "\n") {
      offsets.push(index + 1);
    }
  }

  return offsets;
}

/** Líneas con `throw redirect(` que el enrutador no va a capturar. */
function orphanRedirects(raw: string): number[] {
  // Los comentarios se tapan antes de medir, y los rangos se calculan sobre el
  // original: tapar no cambia ni las posiciones ni los saltos de línea, así que
  // los números de línea siguen siendo los mismos.
  const source = stripComments(raw);
  const ranges = dataFunctionRanges(raw);
  const offsets = lineOffsets(source);
  const lines = source.split("\n");
  const found: number[] = [];

  lines.forEach((line, index) => {
    if (!/throw\s+redirect\(/.test(line)) {
      return;
    }
    if (!isInside(offsets[index], ranges)) {
      found.push(index + 1);
    }
  });

  return found;
}

describe("navegación desde el cliente", () => {
  it("encuentra las rutas de la aplicación", () => {
    expect(routeFiles(ROUTES_DIR).length).toBeGreaterThan(5);
  });

  it("sabe distinguir un redirect de datos de uno en un manejador", () => {
    const source = [
      "export async function clientLoader() {",
      "  throw redirect('/a');",
      "}",
      "",
      "async function guardar() {",
      "  throw redirect('/b');",
      "}",
    ].join("\n");

    // La de `clientLoader` la captura el enrutador; la del manejador, no.
    expect(orphanRedirects(source)).toEqual([6]);
  });

  it("cuenta el cuerpo, no los parámetros desestructurados", () => {
    // La forma que usa la aplicación de verdad. Si seTomara la primera llave
    // como inicio del cuerpo, el rango acabaría en el `}` de los parámetros y
    // el redirect del `clientLoader` parecería estar suelto.
    const source = [
      "export async function clientLoader({ request }: Args) {",
      "  throw redirect('/a');",
      "}",
      "",
      "async function guardar() {",
      "  throw redirect('/b');",
      "}",
    ].join("\n");

    expect(orphanRedirects(source)).toEqual([6]);
  });

  it("no se confunde con una llave dentro de un texto", () => {
    const source = [
      "export async function clientLoader() {",
      '  const ejemplo = "}";',
      "}",
      "",
      "async function guardar() {",
      "  throw redirect('/b');",
      "}",
    ].join("\n");

    expect(orphanRedirects(source)).toEqual([6]);
  });

  it("ignora un redirect mencionado en un comentario", () => {
    // Los comentarios que explican por qué no se usa el patrón contienen el
    // texto buscado. Sin taparlos, el test fallaría sobre su propia explicación.
    const source = [
      "export async function clientLoader({ request }: Args) {",
      "  throw redirect('/a');",
      "}",
      "",
      "async function guardar() {",
      "  // Antes esto era: throw redirect('/b'), que no navegaba.",
      "  navigate('/c');",
      "}",
    ].join("\n");

    expect(orphanRedirects(source)).toEqual([]);
  });

  it("ignora un redirect dentro de un comentario de bloque", () => {
    const source = [
      "async function guardar() {",
      "  /* throw redirect('/b') */",
      "  navigate('/c');",
      "}",
    ].join("\n");

    expect(orphanRedirects(source)).toEqual([]);
  });

  it("no confunde el doble guion de una URL con un comentario", () => {
    const source = [
      "async function guardar() {",
      '  const url = "https://api.openai.com/v1/chat/completions";',
      "  throw redirect(url);",
      "}",
    ].join("\n");

    // La URL se queda entera y el redirect, que sí está en un manejador, se ve.
    expect(orphanRedirects(source)).toEqual([3]);
  });

  it("no se rompe con una cadena que lleva corchetes y comillas", () => {
    const source = [
      "export async function clientLoader({ request }: Args) {",
      '  const ejemplo = "un \\" y otro";',
      "  throw redirect('/a');",
      "}",
      "",
      "async function guardar() {",
      "  throw redirect('/b');",
      "}",
    ].join("\n");

    expect(orphanRedirects(source)).toEqual([7]);
  });

  it.each(routeFiles(ROUTES_DIR))(
    "%s no lanza redirects fuera de un loader o un action",
    (file) => {
      const source = readFileSync(file, "utf8");

      expect(
        orphanRedirects(source).map(
          (line) => `${file.slice(process.cwd().length + 1)}:${line}`,
        ),
      ).toEqual([]);
    },
  );
});
