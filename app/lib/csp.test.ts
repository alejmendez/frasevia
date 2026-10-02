import { describe, expect, it } from "vitest";

import { AI_ORIGINS, buildCsp } from "./csp";

/** Lee el valor de una directiva de la cabecera. */
function directive(csp: string, name: string): string {
  const found = csp
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name} `));
  return found ?? "";
}

describe("buildCsp", () => {
  it("deja pasar solo a los proveedores de IA que usa la aplicación", () => {
    const connect = directive(buildCsp(undefined), "connect-src");

    for (const origin of AI_ORIGINS) {
      expect(connect).toContain(origin);
    }
  });

  it("no deja pasar a ningún otro origen de IA", () => {
    const connect = directive(buildCsp(undefined), "connect-src");

    // La razón de existir de la CSP: si un XSS se lleva la clave, no tiene
    // dónde mandarla. Estos son los que no deben estar.
    expect(connect).not.toContain("https://api.openai.com");
    expect(connect).not.toContain("https://api.anthropic.com");
    expect(connect).not.toContain("https://generativelanguage.googleapis.com");
    expect(connect).not.toContain("https://api.minimax.io");
    expect(connect).not.toContain("*");
  });

  it("añade el origen de Supabase cuando está configurado", () => {
    const connect = directive(
      buildCsp("https://abcdefgh.supabase.co"),
      "connect-src",
    );

    expect(connect).toContain("https://abcdefgh.supabase.co");
  });

  it("arranca igual sin Supabase configurado", () => {
    // La aplicación debe cargar sin credenciales y mostrar el aviso, así que
    // una URL mala o ausente no puede dejar la CSP sin construir.
    const csp = buildCsp(undefined);

    expect(directive(csp, "connect-src")).toContain("'self'");
    expect(directive(csp, "connect-src")).not.toContain("undefined");
  });

  it("ignora una URL de Supabase mal formada en vez de romperse", () => {
    const connect = directive(buildCsp("no es una url"), "connect-src");

    expect(connect).toContain("'self'");
    expect(connect).not.toContain("no%20es");
  });

  it("prohíbe objetos y limita la base y los formularios", () => {
    const csp = buildCsp(undefined);

    expect(directive(csp, "object-src")).toBe("object-src 'none'");
    expect(directive(csp, "base-uri")).toBe("base-uri 'self'");
    expect(directive(csp, "form-action")).toBe("form-action 'self'");
  });

  it("admite las fuentes de Google, que sí se cargan", () => {
    const csp = buildCsp(undefined);

    expect(directive(csp, "style-src")).toContain(
      "https://fonts.googleapis.com",
    );
    expect(directive(csp, "font-src")).toContain("https://fonts.gstatic.com");
  });
});
