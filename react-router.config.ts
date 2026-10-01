import type { Config } from "@react-router/dev/config";
import { basePath } from "./base-path.ts";

/**
 * Compilación estática para GitHub Pages.
 *
 * La aplicación no tiene servidor propio: Supabase es el backend y toda la
 * lógica de datos corre en el navegador (ver `app/lib/session.ts`). El servidor
 * de Node solo servía HTML, así que se elimina del producto final y queda
 * `build/client`, que es lo que Pages publica.
 *
 * Dos consecuencias que conviene tener presentes:
 *
 * - `ssr: false` prohíbe `loader` y `action` de servidor en cualquier ruta. Los
 *   datos van en `clientLoader` / `clientAction`, y `app/lib/static.test.ts`
 *   vigila que nadie reintroduzca un `loader`.
 * - GitHub Pages no sabe reescribir URLs, así que una ruta profunda pediría un
 *   archivo inexistente. El arreglo es publicar también el HTML de respaldo
 *   como `404.html`: Pages lo sirve para lo que no encuentra, y el enrutador
 *   del cliente decide después qué página es. El `.github/workflows/pages.yml`
 *   se encarga de copiarlo.
 *
 * El `basename` no es lo mismo que el prefijo de los assets, y esa diferencia
 * es la parte incómoda de publicar en Pages. Las rutas las resuelve el
 * enrutador (aquí), pero los `.js` y `.css` los pide el navegador a la URL que
 * escriben Vite, que con `base: "/"` no lleva el prefijo. La razón está en
 * `base-path.ts` y `scripts/prepare-pages.mjs`.
 */
export default {
  // Sin render en servidor: `react-router build` escribe un único `index.html`
  // con la ruta raíz ya renderizada, y todas las URLs de la aplicación se sirven
  // desde ese mismo archivo. Las páginas con datos (el catálogo, un mazo, tu
  // biblioteca) las arma el navegador.
  ssr: false,

  // Bajo qué ruta está montada la aplicación: `/` en un repositorio de usuario,
  // `/frasevia` en el de un proyecto. Lo normaliza `basePath()`.
  basename: basePath(),

  // Aquí no hay `prerender`. Compilar rutas fijas a HTML funciona, pero con
  // `basename` la salida anida en una carpeta con su nombre y deja de cuadrar
  // con lo que GitHub Pages publica. Como el SEO no es un objetivo, un único
  // archivo es más simple de desplegar y de entender.
} satisfies Config;
