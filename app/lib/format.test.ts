import { describe, expect, it } from "vitest";

import { formatDateTime } from "./format";

/**
 * La fecha con su hora.
 *
 * Lo que se comprueba es que están las dos partes y que un dato inválido no
 * rompe el render. El instante exacto no se puede afirmar: depende de la zona
 * horaria de quien ejecuta la prueba, y una prueba que falla según dónde se
 * ejecute no está probando nada.
 */
describe("formatDateTime", () => {
  it("pone la fecha y la hora", () => {
    const text = formatDateTime("2026-11-11T21:45:00.000Z");

    expect(text).toContain("2026");
    expect(text).toMatch(/\d{1,2}:\d{2}/);
  });

  it("no inventa una fecha cuando no la hay", () => {
    expect(formatDateTime(null)).toBe("—");
    expect(formatDateTime(undefined)).toBe("—");
    expect(formatDateTime("no-es-una-fecha")).toBe("—");
  });
});
