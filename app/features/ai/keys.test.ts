import { beforeEach, describe, expect, it } from "vitest";

import { forgetKey, getKey, hasKey, maskKey, setKey } from "./keys";

/**
 * `localStorage` no existe en Node, y `keys.ts` lo comprueba en cada acceso para
 * no tumbar la pantalla cuando el navegador no deja guardar. Estos stubs
 * comprueban ese mismo camino, no solo el feliz.
 */
function installStorage(overrides: Partial<Storage> = {}) {
  const data = new Map<string, string>();
  const stub = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    clear: () => data.clear(),
    key: (index: number) => [...data.keys()][index] ?? null,
    get length() {
      return data.size;
    },
    ...overrides,
  } as Storage;

  Object.defineProperty(globalThis, "localStorage", {
    value: stub,
    configurable: true,
    writable: true,
  });

  return stub;
}

/** Hace que `setItem` lance, como hace un navegador sin almacenamiento. */
function installFailingStorage() {
  return installStorage({
    setItem: () => {
      throw new Error("cuota llena");
    },
  });
}

beforeEach(() => {
  installStorage();
});

describe("lectura y escritura", () => {
  it("guarda y recupera la clave", () => {
    expect(setKey("sk-or-v1-abc")).toBe(true);
    expect(getKey()).toBe("sk-or-v1-abc");
    expect(hasKey()).toBe(true);
  });

  it("no hay clave antes de escribir una", () => {
    expect(getKey()).toBeNull();
    expect(hasKey()).toBe(false);
  });

  it("recorta los espacios que se cuelan al copiar", () => {
    setKey("  clave-con-espacios \n");

    expect(getKey()).toBe("clave-con-espacios");
  });
});

describe("borrado", () => {
  it("borra la clave", () => {
    setKey("una");
    forgetKey();

    expect(getKey()).toBeNull();
  });

  it("borrar una clave ya vacía no falla", () => {
    expect(forgetKey()).toBe(true);
  });

  it("borrar la clave no toca la sesión de Supabase", () => {
    // La sesión de Supabase también vive en `localStorage`. Si el borrado se
    // pasara de alcance, cerraría la sesión de paso.
    localStorage.setItem(
      "sb-localhost-auth-token",
      JSON.stringify({ access_token: "sesión" }),
    );
    setKey("una");

    forgetKey();

    expect(localStorage.getItem("sb-localhost-auth-token")).toContain("sesión");
  });

  it("borrar con el campo vacío equivale a olvidar", () => {
    setKey("una");
    setKey("   ");

    expect(getKey()).toBeNull();
  });
});

describe("degradación", () => {
  it("avisa en vez de fingir que guardó cuando el navegador lo impide", () => {
    // El fallo clásico: un `save` que devolviera `true` con la clave sin
    // escribir haría creer a la persona que la tiene guardada, y se
    // encontraría sin ella al recargar.
    installFailingStorage();

    expect(setKey("una")).toBe(false);
  });

  it("no lanza cuando el almacenamiento no existe", () => {
    Object.defineProperty(globalThis, "localStorage", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    expect(() => setKey("una")).not.toThrow();
    expect(getKey()).toBeNull();
    expect(forgetKey()).toBe(true);
  });
});

describe("maskKey", () => {
  it("enseña solo el final", () => {
    expect(maskKey("sk-or-v1-1234567890")).toBe("••••••••7890");
  });

  it("no enseña nada de una clave demasiado corta", () => {
    // Una clave real siempre es más larga que esto; si alguien pega un texto
    // corto por error, no hay por qué dejarlo medio a la vista.
    expect(maskKey("corta")).toBe("••••••••");
  });

  it("corta la clave antes de medirla", () => {
    expect(maskKey("  abc  ")).toBe("••••••••");
  });
});
