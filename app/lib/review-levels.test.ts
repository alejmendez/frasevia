import { describe, expect, it } from "vitest";

import {
  DEFAULT_REVIEW_LEVELS,
  intervalName,
  levelName,
  parseLevelSubmission,
  REVIEW_COLORS,
  REVIEW_UNITS,
} from "./review-levels";
import type { ReviewLevel } from "./types";

const id = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const otroId = "9c858901-8a57-4791-81fe-4c455b099bc9";

/** Una traducción de mentira: devuelve la clave, que es lo que hay que leer. */
const tr = (key: string) => `tr(${key})`;

describe("los niveles predeterminados", () => {
  it("son cuatro y cubren desde difícil hasta retirar", () => {
    expect(DEFAULT_REVIEW_LEVELS.map((level) => level.system_key)).toEqual([
      "difficult",
      "normal",
      "easy",
      "very_easy",
    ]);
    expect(
      DEFAULT_REVIEW_LEVELS.find((level) => level.action === "retire"),
    ).toBeDefined();
  });

  it("cada uno usa un color que la interfaz sabe pintar", () => {
    for (const level of DEFAULT_REVIEW_LEVELS) {
      expect(REVIEW_COLORS).toContain(level.color);
    }
  });
});

describe("el nombre de un nivel", () => {
  const base = { name: "", system_key: null };

  it("traduce los predeterminados aunque su nombre siga siendo el de la base", () => {
    // El nombre en la base está en español porque es donde nació la lista. Sin
    // esto, alguien que usa la aplicación en inglés ve «Difícil».
    expect(
      levelName(
        { ...base, system_key: "difficult", name: "Difícil" } as ReviewLevel,
        tr,
      ),
    ).toBe("tr(estudiar.level.difficult)");
  });

  it("si alguien renombró el nivel, gana su nombre", () => {
    expect(
      levelName(
        { ...base, system_key: "normal", name: "Cómodo" } as ReviewLevel,
        tr,
      ),
    ).toBe("Cómodo");
  });

  it("un nivel propio se muestra tal cual", () => {
    expect(levelName({ ...base, name: "Finde" } as ReviewLevel, tr)).toBe(
      "Finde",
    );
  });
});

describe("el intervalo de un nivel", () => {
  it("un nivel que retira no vuelve a aparecer", () => {
    expect(
      intervalName(
        { action: "retire", interval_amount: null, interval_unit: null },
        tr,
      ),
    ).toBe("tr(estudiar.noFurtherReviews)");
  });

  it("un día se dice «mañana», no «1 día»", () => {
    expect(
      intervalName(
        { action: "review", interval_amount: 1, interval_unit: "days" },
        tr,
      ),
    ).toBe("tr(estudiar.tomorrow)");
  });

  it("las demás unidades llevan su cantidad", () => {
    expect(
      intervalName(
        { action: "review", interval_amount: 2, interval_unit: "hours" },
        tr,
      ),
    ).toBe("tr(estudiar.intervalHours)");
    expect(
      intervalName(
        { action: "review", interval_amount: 15, interval_unit: "minutes" },
        tr,
      ),
    ).toBe("tr(estudiar.intervalMinutes)");
    expect(
      intervalName(
        { action: "review", interval_amount: 5, interval_unit: "days" },
        tr,
      ),
    ).toBe("tr(estudiar.intervalDays)");
  });

  it("un intervalo sin unidad tampoco rompe nada", () => {
    expect(
      intervalName(
        { action: "review", interval_amount: null, interval_unit: null },
        tr,
      ),
    ).toBe("tr(estudiar.intervalDays)");
  });
});

describe("lectura de los niveles que envía el formulario", () => {
  const nivel = (overrides: Record<string, unknown> = {}) => ({
    id,
    name: "Normal",
    action: "review",
    interval_amount: 1,
    interval_unit: "days",
    color: "sage",
    active: true,
    system_key: "normal",
    ...overrides,
  });

  it("acepta una lista válida", () => {
    const parsed = parseLevelSubmission([nivel()]);

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(1);
  });

  it("la posición es la del formulario, no la que venga guardada", () => {
    const parsed = parseLevelSubmission([
      nivel({ id, position: 9 }),
      nivel({ id: otroId, name: "Fácil" }),
    ]) as Array<{ position: number; id: string }>;

    // Quien reordena en pantalla reordena en la base; mandar la posición vieja
    // dejaría los botones en un orden que ya nadie está viendo.
    expect(parsed.map((level) => level.position)).toEqual([1, 2]);
    expect(parsed.map((level) => level.id)).toEqual([id, otroId]);
  });

  it("un nivel que retira se guarda sin intervalo", () => {
    const parsed = parseLevelSubmission([
      nivel({ action: "retire", interval_amount: 3, interval_unit: "days" }),
    ]) as Array<{
      interval_amount: number | null;
      interval_unit: string | null;
    }>;

    expect(parsed[0].interval_amount).toBeNull();
    expect(parsed[0].interval_unit).toBeNull();
  });

  it("es todo o nada: un nivel malo no deja guardar los buenos", () => {
    // Guardar veintinueve y avisar sería peor que no guardar: quien edita no ve
    // cuál se perdió.
    expect(parseLevelSubmission([nivel(), nivel({ name: "" })])).toBe("level");
  });

  it("rechaza lo que no es una lista, o una lista vacía", () => {
    expect(parseLevelSubmission(null)).toBe("shape");
    expect(parseLevelSubmission("hola")).toBe("shape");
    expect(parseLevelSubmission([])).toBe("shape");
  });

  it("rechaza más niveles de los que caben", () => {
    const muchos = Array.from({ length: 31 }, (_, index) =>
      nivel({ id: `${id.slice(0, -1)}${index % 10}` }),
    );

    expect(parseLevelSubmission(muchos)).toBe("shape");
  });

  it("exige un identificador con forma de identificador", () => {
    expect(parseLevelSubmission([nivel({ id: "lo-que-sea" })])).toBe("level");
  });

  it("exige un nombre de entre 1 y 40 caracteres", () => {
    expect(parseLevelSubmission([nivel({ name: "   " })])).toBe("level");
    expect(parseLevelSubmission([nivel({ name: "a".repeat(41) })])).toBe(
      "level",
    );
  });

  it("solo acepta colores y unidades que la interfaz y la base conocen", () => {
    expect(parseLevelSubmission([nivel({ color: "fucsia" })])).toBe("level");
    expect(parseLevelSubmission([nivel({ interval_unit: "semanas" })])).toBe(
      "level",
    );
  });

  it("un intervalo tiene que ser un entero positivo", () => {
    expect(parseLevelSubmission([nivel({ interval_amount: 0 })])).toBe("level");
    expect(parseLevelSubmission([nivel({ interval_amount: 1.5 })])).toBe(
      "level",
    );
    expect(parseLevelSubmission([nivel({ interval_amount: "3" })])).toBe(
      "level",
    );
  });

  it("cada unidad tiene su propio techo", () => {
    // Un año de horas no es un año, y la base no lo va a corregir.
    expect(
      parseLevelSubmission([
        nivel({ interval_amount: 8761, interval_unit: "hours" }),
      ]),
    ).toBe("level");
    expect(
      parseLevelSubmission([
        nivel({ interval_amount: 3651, interval_unit: "days" }),
      ]),
    ).toBe("level");
  });

  it("un nivel propio vale `null` en system_key y uno del sistema no", () => {
    const propio = parseLevelSubmission([
      nivel({ system_key: null }),
    ]) as Array<{
      system_key: string | null;
    }>;
    expect(propio[0].system_key).toBeNull();

    expect(parseLevelSubmission([nivel({ system_key: "imposible" })])).toBe(
      "level",
    );
  });

  it("todo nivel enviado tiene que ser del conjunto conocido o ninguno", () => {
    // Si `system_key` no es uno de los cuatro, no se puede traducir su nombre y
    // acabaría mostrándose en crudo.
    expect(REVIEW_UNITS).toContain("days");
    expect(parseLevelSubmission([nivel({ name: "" })])).toBe("level");
  });
});
