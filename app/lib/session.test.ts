import { describe, expect, it } from "vitest";

import { safeRedirectTo, stripBasePath } from "./session";

/**
 * `redirectTo` es lo que decide a dónde cae alguien después de entrar, así que
 * las dos funciones que lo tocan se prueban juntas: la primera decide si la
 * ruta es aceptable y la segunda le quita el prefijo del sitio. Si la segunda
 * se ejecutara antes, o sin pasar por la primera, se podría mandar a alguien
 * fuera del sitio por un enlace de acceso legítimo.
 */
describe("safeRedirectTo", () => {
  it("deja pasar las rutas internas", () => {
    expect(safeRedirectTo("/biblioteca")).toBe("/biblioteca");
    expect(safeRedirectTo("/estudiar/abc?x=1")).toBe("/estudiar/abc?x=1");
  });

  it("usa el destino por defecto cuando no hay nada", () => {
    expect(safeRedirectTo(null)).toBe("/biblioteca");
    expect(safeRedirectTo("")).toBe("/biblioteca");
  });

  it("rechaza las rutas externas", () => {
    expect(safeRedirectTo("https://ejemplo.com")).toBe("/biblioteca");
    expect(safeRedirectTo("javascript:alert(1)")).toBe("/biblioteca");
  });

  it("rechaza el protocolo relativo", () => {
    // "//ejemplo.com" no empieza por un solo número de barras, así que el
    // navegador lo trataría como otra página.
    expect(safeRedirectTo("//ejemplo.com")).toBe("/biblioteca");
    expect(safeRedirectTo("/\\ejemplo.com")).toBe("/biblioteca");
  });
});

describe("stripBasePath", () => {
  it("quita el prefijo del sitio", () => {
    expect(stripBasePath("/frasevia/biblioteca", "/frasevia")).toBe(
      "/biblioteca",
    );
  });

  it("deja la raíz en un solo nombre", () => {
    expect(stripBasePath("/frasevia", "/frasevia")).toBe("/");
  });

  it("no toca nada cuando el sitio va en la raíz del dominio", () => {
    expect(stripBasePath("/biblioteca", "")).toBe("/biblioteca");
  });

  it("solo quita el prefijo completo", () => {
    // Un prefijo que sea solo prefijo de texto, no de segmento, no cuenta.
    expect(stripBasePath("/fraseviafoo", "/frasevia")).toBe("/fraseviafoo");
    expect(stripBasePath("/frasevia2/biblioteca", "/frasevia")).toBe(
      "/frasevia2/biblioteca",
    );
  });

  it("no repite el trabajo si ya se quitó", () => {
    const once = stripBasePath("/frasevia/biblioteca", "/frasevia");
    expect(stripBasePath(once, "/frasevia")).toBe(once);
  });

  it("el resultado sigue siendo una ruta interna", () => {
    // La garantía de `safeRedirectTo` se tiene que mantener después de quitar
    // el prefijo, porque el valor que se le pasa a `navigate` no vuelve a
    // pasar por la comprobación.
    const ruta = safeRedirectTo("/frasevia/biblioteca");
    expect(stripBasePath(ruta, "/frasevia").startsWith("/")).toBe(true);
    expect(stripBasePath(ruta, "/frasevia").startsWith("//")).toBe(false);
  });
});
