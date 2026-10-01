import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

/**
 * Ni `base` ni `assetsDir` se tocan, aunque el sitio se sirva en una subcarpeta.
 *
 * En modo SPA (`ssr: false`) React Router pide el HTML de `index.html` a un
 * servidor de pruebas armado solo con su `basename`. Si Vite tiene un `base`
 * distinto de `/`, ese HTML nunca se escribe y el build termina sin `index.html`
 * (react-router#15350). Mover `assetsDir` tampoco sirve: cambia la carpeta de
 * los archivos, pero la URL los pide con el prefijo delante, y en Pages el
 * repositorio se publica en la subcarpeta, no en la raíz del dominio.
 *
 * La solución es dejar Vite como está y anteponer el prefijo después de
 * compilar, con `scripts/prepare-pages.mjs`. Si el sitio se publica en la raíz
 * del dominio (un repositorio `usuario.github.io`), ese paso no hace nada.
 */
export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
});
