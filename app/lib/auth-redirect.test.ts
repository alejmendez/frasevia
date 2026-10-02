import { describe, expect, it } from "vitest";

import {
  buildOAuthReturnUrl,
  forgetRedirect,
  PENDING_REDIRECT_KEY,
  rememberRedirect,
  type StorageLike,
  takeRedirect,
} from "./auth-redirect";

/** Almacenamiento en memoria, para no depender del navegador. */
function fakeStorage(initial: Record<string, string> = {}): StorageLike {
  const data = new Map(Object.entries(initial));

  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

describe("buildOAuthReturnUrl", () => {
  it("devuelve a la raíz del dominio", () => {
    expect(buildOAuthReturnUrl("https://frasevia.app", "/")).toBe(
      "https://frasevia.app/",
    );
  });

  it("conserva el prefijo con el que se publica el sitio", () => {
    // Pages solo responde con un 200 a la raíz, así que es la dirección que
    // tiene que estar en las Redirect URLs de Supabase.
    expect(
      buildOAuthReturnUrl("https://alejmendez.github.io", "/frasevia/"),
    ).toBe("https://alejmendez.github.io/frasevia/");
  });

  it("funciona con un origen sin barra final", () => {
    expect(buildOAuthReturnUrl("https://frasevia.app", "/frasevia/")).toBe(
      "https://frasevia.app/frasevia/",
    );
  });
});

describe("rememberRedirect", () => {
  it("guarda una ruta interna", () => {
    const storage = fakeStorage();

    rememberRedirect("/biblioteca", storage);

    expect(storage.getItem(PENDING_REDIRECT_KEY)).toBe("/biblioteca");
  });

  it("no guarda rutas externas", () => {
    const storage = fakeStorage();

    // Si esto se guardara, `takeRedirect` lo filtraría igual, pero no tiene por
    // qué dejar un destino inservible en el almacenamiento de la persona.
    rememberRedirect("https://ejemplo.com", storage);
    rememberRedirect("//ejemplo.com", storage);

    expect(storage.getItem(PENDING_REDIRECT_KEY)).toBeNull();
  });

  it("no rompe cuando no hay almacenamiento", () => {
    expect(() => rememberRedirect("/biblioteca", null)).not.toThrow();
  });

  it("no rompe cuando el almacenamiento falla", () => {
    const roto: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error("cuota llena");
      },
      removeItem: () => {},
    };

    expect(() => rememberRedirect("/biblioteca", roto)).not.toThrow();
  });
});

describe("takeRedirect", () => {
  it("devuelve la ruta guardada y la borra", () => {
    const storage = fakeStorage({
      [PENDING_REDIRECT_KEY]: "/estudiar/abc",
    });

    expect(takeRedirect(storage)).toBe("/estudiar/abc");
    // Se borra al leer: si no, la siguiente entrada saltaría a un sitio viejo.
    expect(storage.getItem(PENDING_REDIRECT_KEY)).toBeNull();
    expect(takeRedirect(storage)).toBeNull();
  });

  it("rechaza un destino manipulado en el almacenamiento", () => {
    // El valor sale del `localStorage`, que cualquiera puede editar a mano, y
    // acaba en un `navigate`: la validación se repite, no se confía.
    const storage = fakeStorage({
      [PENDING_REDIRECT_KEY]: "https://atacante.example/robo",
    });

    expect(takeRedirect(storage)).toBeNull();
  });

  it("no rompe cuando no hay almacenamiento", () => {
    expect(takeRedirect(null)).toBeNull();
  });
});

describe("forgetRedirect", () => {
  it("descarta el destino pendiente", () => {
    const storage = fakeStorage();
    rememberRedirect("/biblioteca", storage);

    forgetRedirect(storage);

    expect(storage.getItem(PENDING_REDIRECT_KEY)).toBeNull();
  });

  it("aguanta que no haya nada que descartar", () => {
    expect(() => forgetRedirect(fakeStorage())).not.toThrow();
    expect(() => forgetRedirect(null)).not.toThrow();
  });
});
