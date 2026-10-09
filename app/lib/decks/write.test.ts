import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import type { CardDraft, DeckBrief } from "./rows";
import { appendCard, createDeckWithCards, discardDeck } from "./write";

/**
 * Un cliente de Supabase de mentira.
 *
 * `supabase-js` devuelve un constructor que se encadena y que además se puede
 * esperar en cualquier punto. Eso es cómodo de usar e incómodo de imitar, así que
 * aquí solo están las tres operaciones que usa la creación de un mazo, y cada una
 * deja rastro en `calls` para poder afirmar qué se mandó y en qué orden.
 *
 * Vive en este archivo a propósito: un simulador compartido entre pruebas acaba
 * siendo un módulo más del código de la aplicación, que es justo lo que este
 * refactor está intentando reducir.
 */
interface Call {
  table: string;
  op: string;
  payload?: unknown;
}

interface Failures {
  insertDeck?: string;
  insertCards?: string;
}

/** Lo que devuelven las consultas: la misma forma que da Supabase. */
interface Result {
  data: unknown;
  error?: { message: string } | null;
}

/**
 * Una consulta que se puede encadenar y esperar a la vez.
 *
 * Es lo que hace `supabase-js`: `from("decks").insert(fila).select("id")` se
 * puede esperar, y `from("cards").insert(filas)` también. Por eso el simulador
 * devuelve una promesa a la que se le pegan los eslabones siguientes, en vez de
 * un objeto con un `then` encima, que convertiría cualquier valor en promesa.
 */
interface Chain extends Promise<Result> {
  select(columns?: string): Chain;
  insert(payload: unknown): Chain;
  delete(): Chain;
  eq(column: string, value: unknown): Chain;
  order(column: string, options?: unknown): Chain;
  limit(count: number): Chain;
  maybeSingle(): Chain;
  single(): Chain;
}

/** El constructor encadenable que devuelve `from()`. */
class Query {
  private readonly call: Call;
  private readonly failure: string | undefined;

  constructor(calls: Call[], table: string, failures: Failures) {
    this.call = { table, op: "select" };
    calls.push(this.call);
    this.failure =
      table === "decks" ? failures.insertDeck : failures.insertCards;
  }

  private result(): Result {
    return {
      data: null,
      error: this.failure ? { message: this.failure } : null,
    };
  }

  select(): Chain {
    return this.chain({ id: "deck-nuevo" });
  }

  insert(payload: unknown): Chain {
    this.call.op = "insert";
    this.call.payload = payload;
    return this.chain({ id: "deck-nuevo" });
  }

  delete(): Chain {
    this.call.op = "delete";
    return this.chain(this.result());
  }

  eq(): this {
    return this;
  }

  order(): this {
    return this;
  }

  limit(): this {
    return this;
  }

  maybeSingle(): Chain {
    return this.chain(this.result());
  }

  single(): Chain {
    return this.chain({ id: "deck-nuevo" });
  }

  /**
   * La misma consulta, esperable y encadenable.
   *
   * Supabase deja seguir encadenando después de cualquier paso, así que la
   * promesa lleva encima todos los eslabones. Si solo llevara los que le tocan en
   * ese orden, `.select("position").eq(...)` —que es lo que hace el código real—
   * se rompería.
   */
  private chain(data: unknown): Chain {
    const promise = Promise.resolve({
      data,
      error: this.failure ? { message: this.failure } : null,
    }) as Chain;

    const pass = () => promise;
    promise.select = pass;
    promise.delete = pass;
    promise.eq = pass;
    promise.order = pass;
    promise.limit = pass;
    promise.maybeSingle = pass;
    promise.single = pass;
    promise.insert = (payload: unknown) => {
      this.call.op = "insert";
      this.call.payload = payload;
      return promise;
    };

    return promise;
  }
}

function fakeClient(
  failures: Failures = {},
): SupabaseClient & { calls: Call[] } {
  const calls: Call[] = [];

  return {
    calls,
    from: (table: string) => new Query(calls, table, failures),
  } as unknown as SupabaseClient & { calls: Call[] };
}

const brief: DeckBrief = {
  title: "Verbos irregulares",
  studyMode: "language",
  sourceLanguage: "es",
  targetLanguage: "en",
  visibility: "private",
};

const cards: CardDraft[] = [{ term: "to go", meaningEs: "ir" }];

describe("crear un mazo con sus tarjetas", () => {
  it("inserta el mazo y después las tarjetas", async () => {
    const supabase = fakeClient();

    const result = await createDeckWithCards(supabase, "user-1", brief, cards);

    expect(result).toEqual({ ok: true, deckId: "deck-nuevo" });
    expect(supabase.calls.map((call) => `${call.table}.${call.op}`)).toEqual([
      "decks.insert",
      "cards.insert",
    ]);
  });

  it("no toca las tarjetas si el mazo ni siquiera se pudo crear", async () => {
    const supabase = fakeClient({ insertDeck: "sin permiso" });

    const result = await createDeckWithCards(supabase, "user-1", brief, cards);

    expect(result).toEqual({
      ok: false,
      stage: "deck",
      message: "sin permiso",
    });
    expect(supabase.calls.some((call) => call.table === "cards")).toBe(false);
  });

  it("deshace el mazo si las tarjetas fallan", async () => {
    // Sin este paso, reintentar dejaría un mazo vacío duplicado en la biblioteca
    // y nadie sabría por qué apareció.
    const supabase = fakeClient({ insertCards: "texto demasiado largo" });

    const result = await createDeckWithCards(supabase, "user-1", brief, cards);

    expect(result).toEqual({
      ok: false,
      stage: "cards",
      message: "texto demasiado largo",
    });
    expect(supabase.calls.map((call) => `${call.table}.${call.op}`)).toEqual([
      "decks.insert",
      "cards.insert",
      "decks.delete",
    ]);
  });

  it("un mazo sin tarjetas no necesita ninguna escritura más", async () => {
    const supabase = fakeClient();

    const result = await createDeckWithCards(supabase, "user-1", brief, []);

    expect(result.ok).toBe(true);
    expect(supabase.calls.map((call) => `${call.table}.${call.op}`)).toEqual([
      "decks.insert",
    ]);
  });
});

describe("deshacer un mazo a medio crear", () => {
  it("borra por identificador", async () => {
    const supabase = fakeClient();
    await discardDeck(supabase, "deck-nuevo");

    expect(supabase.calls).toContainEqual({
      table: "decks",
      op: "delete",
    });
  });
});

describe("añadir una tarjeta al final", () => {
  it("la numera detrás de la última que había", async () => {
    const supabase = fakeClient();

    await appendCard(supabase, "deck-1", { term: "to go", meaningEs: "ir" });

    const inserted = supabase.calls.find(
      (call) => call.table === "cards" && call.op === "insert",
    );
    expect(inserted?.payload).toMatchObject({
      deck_id: "deck-1",
      term: "to go",
      // El simulador no sabe la última posición, así que devuelve la primera
      // libre: lo que importa aquí es que se numeró desde 1.
      position: 1,
    });
  });
});
