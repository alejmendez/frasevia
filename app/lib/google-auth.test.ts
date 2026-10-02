import { describe, expect, it } from "vitest";

import { readGoogleAvailability } from "./google-auth";

/**
 * Estos casos nacieron de un fallo real: con el proveedor de Google apagado en
 * Supabase, `signInWithOAuth` no devuelve ningún error, simplemente lanza al
 * navegador a un endpoint que responde con un JSON crudo. Como el error solo se
 * conoce después de que la persona ya salió del sitio, la disponibilidad se
 * consulta antes, y esto decide qué se le ofrece.
 */
describe("readGoogleAvailability", () => {
  it("reconoce el proveedor encendido", () => {
    expect(readGoogleAvailability({ external: { google: true } })).toBe(
      "enabled",
    );
  });

  it("reconoce el proveedor apagado", () => {
    // Esta es la respuesta real de un proyecto sin Google configurado.
    expect(
      readGoogleAvailability({
        external: { email: true, phone: false, google: false, github: false },
      }),
    ).toBe("disabled");
  });

  it("no se inventa un veredicto con una forma inesperada", () => {
    // Si la respuesta cambia de forma, tapar el botón por un error de lectura
    // dejaría a alguien sin una opción que sí funciona.
    expect(readGoogleAvailability({})).toBe("unknown");
    expect(readGoogleAvailability({ external: {} })).toBe("unknown");
    expect(readGoogleAvailability(null)).toBe("unknown");
    expect(readGoogleAvailability("google")).toBe("unknown");
  });
});
