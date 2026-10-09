import type { ShouldRevalidateFunctionArgs } from "react-router";
import { describe, expect, it } from "vitest";

import {
  type PendingReview,
  ReviewWriteQueue,
  shouldRevalidate,
} from "./estudiar";
import { shouldRevalidate as shouldRevalidatePrivate } from "./privada";

/**
 * Estos tests vigilan la decisión que toma el enrutador después de una acción.
 *
 * `shouldRevalidate` decides whether the `clientLoader`s run again once an action
 * finishes. It is what stops each rated card from re-requesting the whole deck, so
 * a regression here is silent: the app keeps working, just slower, several times
 * per card.
 */

const url = (path: string, search = "") =>
  new URL(`https://frasevia.app${path}${search}`);

function args(
  overrides: Partial<ShouldRevalidateFunctionArgs> = {},
): ShouldRevalidateFunctionArgs {
  return {
    currentUrl: url("/estudiar"),
    currentParams: {},
    nextUrl: url("/estudiar"),
    nextParams: {},
    actionStatus: undefined,
    actionResult: undefined,
    defaultShouldRevalidate: true,
    ...overrides,
  } as ShouldRevalidateFunctionArgs;
}

function formDataOf(entries: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    formData.append(key, value);
  }
  return formData;
}

describe("revalidation after rating a card", () => {
  it("does not reload the deck when a card is rated", () => {
    const shouldReload = shouldRevalidate(
      args({
        formData: formDataOf({
          intent: "rate-review",
          cardId: "card-1",
          direction: "es-en",
          levelId: "level-1",
          eventId: "event-1",
          timezone: "UTC",
        }),
      }),
    );

    expect(shouldReload).toBe(false);
  });

  it("does not reload after saving a practice session", () => {
    const shouldReload = shouldRevalidate(
      args({
        formData: formDataOf({ results: "[]" }),
      }),
    );

    expect(shouldReload).toBe(false);
  });

  it("follows the router's default on a normal navigation", () => {
    // No formData at all: this is entering the screen, not answering an action.
    expect(shouldRevalidate(args())).toBe(true);
  });

  it("follows the router's default when the router already said no", () => {
    expect(shouldRevalidate(args({ defaultShouldRevalidate: false }))).toBe(
      false,
    );
  });

  it("follows the default for another action on the same route", () => {
    expect(
      shouldRevalidate(args({ formData: formDataOf({ intent: "otra-cosa" }) })),
    ).toBe(true);
  });
});

describe("review write queue", () => {
  function review(index: number, eventId = `event-${index}`): PendingReview {
    return {
      eventId,
      index,
      cardId: `card-${index}`,
      direction: "es-en",
      levelId: `level-${index}`,
    };
  }

  it("sends the first rating straight away", () => {
    const queue = new ReviewWriteQueue();
    expect(queue.push(review(0))).toEqual(review(0));
    expect(queue.current()).toEqual(review(0));
    expect(queue.pending).toBe(0);
  });

  it("holds further ratings instead of dropping them", () => {
    // The whole point: rating without waiting has to queue, not discard.
    const queue = new ReviewWriteQueue();
    queue.push(review(0));
    expect(queue.push(review(1))).toBeNull();
    expect(queue.push(review(2))).toBeNull();
    expect(queue.pending).toBe(2);
  });

  it("sends the next one when the current is confirmed", () => {
    const queue = new ReviewWriteQueue();
    const first = queue.push(review(0));
    queue.push(review(1));
    queue.push(review(2));

    expect(queue.complete(first!)).toEqual(review(1));
    expect(queue.current()).toEqual(review(1));
    expect(queue.pending).toBe(1);
  });

  it("releases each rating in order", () => {
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

  it("ignores a response for something else", () => {
    // A stale response must not release the slot and scramble the order.
    const queue = new ReviewWriteQueue();
    const first = queue.push(review(0));
    queue.push(review(1));

    expect(queue.complete(review(99))).toBeNull();
    expect(queue.current()).toEqual(first);
    expect(queue.pending).toBe(1);
  });

  it("keeps the idempotency key of each rating", () => {
    const queue = new ReviewWriteQueue();
    const retried = queue.push(review(3, "same-event"));
    expect(retried?.eventId).toBe("same-event");
  });

  it("drops what is left when the screen goes away", () => {
    const queue = new ReviewWriteQueue();
    queue.push(review(0));
    queue.push(review(1));
    queue.clear();

    expect(queue.pending).toBe(0);
  });
});

describe("revalidation of the private layout", () => {
  it("does not reload when a child route sends something", () => {
    // A rating on /estudiar is a submit: the URL does not move.
    expect(
      shouldRevalidatePrivate(
        args({
          currentUrl: url("/estudiar/deck-1"),
          nextUrl: url("/estudiar/deck-1"),
          formData: formDataOf({ intent: "rate-review" }),
        }),
      ),
    ).toBe(false);
  });

  it("reloads when moving to another screen", () => {
    expect(
      shouldRevalidatePrivate(
        args({
          currentUrl: url("/estudiar"),
          nextUrl: url("/biblioteca"),
          defaultShouldRevalidate: true,
        }),
      ),
    ).toBe(true);
  });

  it("reloads when only the query string changes", () => {
    // `privada` reads `text` and `title` from the query to open the quick add
    // menu, so a change there does have to reload it.
    expect(
      shouldRevalidatePrivate(
        args({
          currentUrl: url("/biblioteca"),
          nextUrl: url("/biblioteca", "?text=hola"),
        }),
      ),
    ).toBe(true);
  });

  it("respects the router's default on a real navigation", () => {
    expect(
      shouldRevalidatePrivate(
        args({
          currentUrl: url("/progreso"),
          nextUrl: url("/biblioteca"),
          defaultShouldRevalidate: false,
        }),
      ),
    ).toBe(false);
  });
});
