import { describe, expect, it } from "vitest";

import {
  nextPendingReviewIndex,
  type PendingReview,
  ReviewWriteQueue,
} from "./review-write-queue";

/**
 * La cola de puntuaciones.
 *
 * Vive fuera del componente justamente para poder probarla así. Lo que se vigila
 * aquí es lo que no se ve en la pantalla: que no se pierda una puntuación, que no
 * se manden dos a la vez y que una respuesta vieja no libere el hueco de la que
 * sí toca.
 */
describe("la cola de puntuaciones", () => {
  function review(index: number, eventId = `event-${index}`): PendingReview {
    return {
      eventId,
      index,
      cardId: `card-${index}`,
      direction: "es-en",
      levelId: `level-${index}`,
    };
  }

  it("manda la primera puntuación en el acto", () => {
    const queue = new ReviewWriteQueue();

    expect(queue.push(review(0))).toEqual(review(0));
    expect(queue.current()).toEqual(review(0));
    expect(queue.pending).toBe(0);
  });

  it("guarda las siguientes en vez de tirarlas", () => {
    // De esto trata: puntuar sin esperar a la red tiene que encolar, no perder.
    const queue = new ReviewWriteQueue();
    queue.push(review(0));

    expect(queue.push(review(1))).toBeNull();
    expect(queue.push(review(2))).toBeNull();
    expect(queue.pending).toBe(2);
  });

  it("manda la siguiente en cuanto se confirma la que estaba en vuelo", () => {
    const queue = new ReviewWriteQueue();
    const first = queue.push(review(0));
    queue.push(review(1));
    queue.push(review(2));

    expect(queue.complete(first as PendingReview)).toEqual(review(1));
    expect(queue.current()).toEqual(review(1));
    expect(queue.pending).toBe(1);
  });

  it("libera cada puntuación en orden", () => {
    const queue = new ReviewWriteQueue();
    const seen: string[] = [];
    let current = queue.push(review(0));
    queue.push(review(1));
    queue.push(review(2));

    while (current) {
      seen.push(current.eventId);
      current = queue.complete(current);
    }

    expect(seen).toEqual(["event-0", "event-1", "event-2"]);
    expect(queue.pending).toBe(0);
    expect(queue.current()).toBeNull();
  });

  it("ignora la respuesta de otra puntuación", () => {
    // Una respuesta vieja no puede liberar el hueco: se revolvería el orden.
    const queue = new ReviewWriteQueue();
    const first = queue.push(review(0));
    queue.push(review(1));

    expect(queue.complete(review(99))).toBeNull();
    expect(queue.current()).toEqual(first);
    expect(queue.pending).toBe(1);
  });

  it("respeta la clave de idempotencia de cada puntuación", () => {
    // Es lo que hace que un reintento no cuente dos veces el mismo repaso.
    const queue = new ReviewWriteQueue();

    expect(queue.push(review(3, "same-event"))?.eventId).toBe("same-event");
  });

  it("descarta lo que queda cuando la pantalla se va", () => {
    const queue = new ReviewWriteQueue();
    queue.push(review(0));
    queue.push(review(1));
    queue.clear();

    expect(queue.pending).toBe(0);
  });
});

describe("la siguiente ficha sin puntuar", () => {
  const todas = [0, 1, 2].map((index) => index);

  it("es la que sigue, no la primera", () => {
    // Volver al principio porque ya se respondió es lo que hace que el repaso se
    // sienta como un bucle.
    expect(nextPendingReviewIndex(3, 0, new Set([0]))).toBe(1);
    expect(nextPendingReviewIndex(3, 2, new Set([2]))).toBe(0);
  });

  it("da la vuelta al final de la lista", () => {
    expect(nextPendingReviewIndex(3, 2, new Set([2, 0]))).toBe(1);
  });

  it("se queda con las que ya se respondieron saltadas", () => {
    expect(nextPendingReviewIndex(3, 0, new Set([0, 1]))).toBe(2);
  });

  it("no hay siguiente cuando está todo respondido", () => {
    expect(nextPendingReviewIndex(3, 0, new Set(todas))).toBeNull();
  });

  it("no hay siguiente en una sesión vacía", () => {
    expect(nextPendingReviewIndex(0, 0, new Set())).toBeNull();
  });
});
