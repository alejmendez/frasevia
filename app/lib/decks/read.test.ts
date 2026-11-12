import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { listMyDecks, listMyTrashedDecks } from "./read";

/**
 * Un cliente de Supabase de mentira que recuerda los filtros de cada consulta.
 *
 * Aquí lo que importa no es lo que devuelve —la biblioteca vacía sirve— sino
 * qué se le pregunta: de qué mazos se pide cada lista. Un filtro que se
 * olvida no rompe nada: solo hace que un mazo en la papelera siga apareciendo
 * en la biblioteca, y eso no da ningún error.
 *
 * El simulador es suyo de este archivo a propósito: uno compartido entre
 * pruebas acaba siendo un módulo más de la aplicación.
 */
interface QueryCall {
  table: string;
  filters: Array<[string, unknown]>;
  negated: string[];
}

/** Lo que devuelven las consultas: la misma forma que da Supabase. */
interface Result {
  data: unknown;
  error?: { message: string } | null;
}

/**
 * Una consulta que se puede encadenar y esperar a la vez.
 *
 * Es lo que hace `supabase-js`: `from("decks").select(...).eq(...)` se puede
 * esperar, y `Promise.all` con tres de esas también. Por eso el simulador
 * devuelve una promesa con los eslabones encima, en vez de un objeto con un
 * `then` encima, que convertiría cualquier valor en promesa.
 */
interface Chain extends Promise<Result> {
  select(columns?: string): Chain;
  eq(column: string, value: unknown): Chain;
  is(column: string, value: unknown): Chain;
  not(column: string, operator: string, value: unknown): Chain;
  order(column: string, options?: unknown): Chain;
  limit(count: number): Chain;
  maybeSingle(): Chain;
}

class Query {
  private readonly call: QueryCall;

  constructor(calls: QueryCall[], table: string) {
    this.call = { table, filters: [], negated: [] };
    calls.push(this.call);
  }

  select(): Chain {
    return this.chain();
  }

  eq(): Chain {
    return this.chain();
  }

  is(): Chain {
    return this.chain();
  }

  not(): Chain {
    return this.chain();
  }

  order(): Chain {
    return this.chain();
  }

  limit(): Chain {
    return this.chain();
  }

  maybeSingle(): Chain {
    return this.chain();
  }

  /**
   * La misma consulta, esperable y encadenable.
   *
   * Los filtros se anotan en la promesa y no en la consulta: Supabase deja
   * seguir encadenando después de cualquier paso, así que `.eq(...)` se llama
   * sobre lo que devolvió `.select(...)`, que ya es la promesa.
   */
  private chain(): Chain {
    const promise = Promise.resolve({ data: [], error: null }) as Chain;

    promise.select = () => promise;
    promise.eq = (column: string, value: unknown) => {
      this.call.filters.push([column, value]);
      return promise;
    };
    promise.is = (column: string, value: unknown) => {
      this.call.filters.push([column, value]);
      return promise;
    };
    promise.not = (column: string, operator: string, value: unknown) => {
      this.call.negated.push(`${column}.${operator}.${String(value)}`);
      return promise;
    };
    promise.order = () => promise;
    promise.limit = () => promise;
    promise.maybeSingle = () => promise;

    return promise;
  }
}

function fakeClient(): {
  client: SupabaseClient;
  calls: QueryCall[];
} {
  const calls: QueryCall[] = [];

  return {
    calls,
    client: {
      from: (table: string) => new Query(calls, table),
    } as unknown as SupabaseClient,
  };
}

describe("los mazos de la biblioteca", () => {
  it("no pide los que están en la papelera", async () => {
    const { client, calls } = fakeClient();

    await listMyDecks(client, "user-1");

    const decks = calls.find((call) => call.table === "decks");
    expect(decks?.filters).toContainEqual(["author_id", "user-1"]);
    expect(decks?.filters).toContainEqual(["deleted_at", null]);
  });
});

describe("los mazos de la papelera", () => {
  it("pide solo los del dueño y solo los que están borrados", async () => {
    const { client, calls } = fakeClient();

    await listMyTrashedDecks(client, "user-1");

    const decks = calls.find((call) => call.table === "decks");
    expect(decks?.filters).toContainEqual(["author_id", "user-1"]);
    expect(decks?.negated).toContain("deleted_at.is.null");
  });
});
