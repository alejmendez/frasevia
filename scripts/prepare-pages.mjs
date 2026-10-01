/**
 * Prepara la compilación para GitHub Pages.
 *
 * Hace dos cosas, y solo dos, porque Pages es un servidor de archivos sin
 * reglas de reescritura ni ejecución de JavaScript en el servidor.
 *
 * 1. Antepone el prefijo de la subcarpeta a las rutas de los assets.
 *
 *    Vite emite sus referencias con `base: "/"`, es decir `/assets/…`, así que
 *    se reescriben a `/frasevia/assets/…`. Se tocan el HTML y los `.js`, no solo
 *    el HTML: los trozos de ruta se piden durante la navegación, y Vite los
 *    escribe dentro de los archivos de JavaScript, no en el HTML. Los archivos
 *    no se mueven, porque Pages los publica en la subcarpeta: la URL
 *    `/frasevia/assets/x.js` se resuelve a `assets/x.js` en el repositorio.
 *
 *    La razón de no arreglarlo con `base` de Vite está en `base-path.ts`: en
 *    modo SPA ese valor hace que React Router no llegue a escribir
 *    `index.html` (react-router#15350).
 *
 * 2. Copia el HTML como `404.html`.
 *
 *    Pages sirve `404.html` para lo que no encuentra, que es justo lo que pasa
 *    con una ruta profunda como `/frasevia/biblioteca`. El archivo es el mismo
 *    shell de la aplicación, así que el enrutador del cliente recibe la URL
 *    real y decide qué página mostrar. El precio es que Pages responde 200 en
 *    lugar de 404, y el enrutador acaba mostrando la página de «no encontrada».
 *
 * Con `BASE_PATH` sin definir no se toca nada: es el caso de un repositorio
 * `usuario.github.io`, donde el sitio ya vive en la raíz del dominio.
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { basePath } from "../base-path.ts";

const CLIENT_DIR = "build/client";

/** Carpetas que se copian tal cual a la raíz del repositorio. */
const ROOT_FILES = ["index.html"];

const base = basePath();

if (base === "/") {
  console.log(
    "[pages] BASE_PATH no definido: el sitio va a la raíz, no hay nada que preparar.",
  );
  process.exit(0);
}

let touched = 0;
let bytesSaved = 0;

async function rewrite(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      await rewrite(path);
      continue;
    }

    if (!/\.(html|js|css)$/.test(entry.name)) {
      continue;
    }

    const before = await readFile(path, "utf8");
    if (!before.includes("/assets/")) {
      continue;
    }

    // Idempotente: si ya antepuesto, `base` aparecería dos veces y no se toca.
    if (before.includes(`${base}/assets/`)) {
      continue;
    }

    const after = before.replaceAll("/assets/", `${base}/assets/`);

    if (after === before) {
      continue;
    }

    await writeFile(path, after);
    touched += 1;
    bytesSaved += after.length - before.length;
  }
}

await rewrite(CLIENT_DIR);

for (const file of ROOT_FILES) {
  const source = join(CLIENT_DIR, file);
  const contents = await readFile(source);

  // `404.html` se escribe en la raíz del repositorio publicado, que es donde
  // Pages lo busca.
  await writeFile(join(CLIENT_DIR, "404.html"), contents);
}

if (touched === 0) {
  console.error(
    `[pages] No se encontró ninguna ruta de assets en ${CLIENT_DIR}. ` +
      "Si el proyecto acaba de cambiar de versión de Vite, conviene comprobar " +
      "a mano dónde quedaron las referencias antes de publicar.",
  );
  process.exit(1);
}

console.log(
  `[pages] Prefijo «${base}» antepuesto en ${touched} archivo(s) y ` +
    `404.html creado (${bytesSaved >= 0 ? "+" : ""}${bytesSaved} bytes de diferencia).`,
);
