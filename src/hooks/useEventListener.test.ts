import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { page } from "vitest/browser";

import { useEventListener } from "./useEventListener";

describe("useEventListener", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  let addEventListenerSpy: ReturnType<
    // @ts-expect-error - These spies are re-assigned in beforeEach blocks, so they can't be typed as const
    typeof vi.spyOn<Window & typeof globalThis, "addEventListener">
  >;
  let removeEventListenerSpy: ReturnType<
    // @ts-expect-error - These spies are re-assigned in beforeEach blocks, so they can't be typed as const
    typeof vi.spyOn<Window & typeof globalThis, "removeEventListener">
  >;

  describe("`Window` events", () => {
    beforeEach(() => {
      addEventListenerSpy = vi.spyOn(window, "addEventListener").mockImplementation(() => {});
      removeEventListenerSpy = vi.spyOn(window, "removeEventListener").mockImplementation(() => {});
    });

    test("should add and remove event listener for a single event and listener", async () => {
      const listener = vi.fn();

      const screen = await page.renderHook(() => useEventListener(window, "resize", listener));

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(1, "resize", listener, undefined);

      screen.result.current.unsubscribe();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(1, "resize", listener, undefined);

      screen.result.current.subscribe();

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(2, "resize", listener, undefined);

      screen.unmount();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(2, "resize", listener, undefined);
    });

    test("should add and remove event listeners for multiple events and a single listener", async () => {
      const listener = vi.fn();

      const screen = await page.renderHook(() =>
        useEventListener(window, ["resize", "scroll"], listener, undefined),
      );

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(1, "resize", listener, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(2, "scroll", listener, undefined);

      screen.result.current.unsubscribe();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(1, "resize", listener, undefined);
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(2, "scroll", listener, undefined);

      screen.result.current.subscribe();

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(3, "resize", listener, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(4, "scroll", listener, undefined);

      screen.unmount();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(3, "resize", listener, undefined);
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(4, "scroll", listener, undefined);
    });

    test("should add and remove event listeners for a single event and multiple listeners", async () => {
      const listenerA = vi.fn();
      const listenerB = vi.fn();

      const screen = await page.renderHook(() =>
        useEventListener(window, "resize", [listenerA, listenerB]),
      );

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(1, "resize", listenerA, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(2, "resize", listenerB, undefined);

      screen.result.current.unsubscribe();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(1, "resize", listenerA, undefined);
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(2, "resize", listenerB, undefined);

      screen.result.current.subscribe();

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(3, "resize", listenerA, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(4, "resize", listenerB, undefined);

      screen.unmount();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(3, "resize", listenerA, undefined);
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(4, "resize", listenerB, undefined);
    });

    test("should add and remove event listeners for multiple events and multiple listeners", async () => {
      const listenerA = vi.fn();
      const listenerB = vi.fn();

      const screen = await page.renderHook(() =>
        useEventListener(window, ["resize", "scroll"], [listenerA, listenerB]),
      );

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(1, "resize", listenerA, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(2, "resize", listenerB, undefined);

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(3, "scroll", listenerA, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(4, "scroll", listenerB, undefined);

      screen.result.current.unsubscribe();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(1, "resize", listenerA, undefined);
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(2, "resize", listenerB, undefined);

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(3, "scroll", listenerA, undefined);
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(4, "scroll", listenerB, undefined);

      screen.result.current.subscribe();

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(5, "resize", listenerA, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(6, "resize", listenerB, undefined);

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(7, "scroll", listenerA, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(8, "scroll", listenerB, undefined);

      screen.unmount();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(5, "resize", listenerA, undefined);
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(6, "resize", listenerB, undefined);

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(7, "scroll", listenerA, undefined);
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(8, "scroll", listenerB, undefined);
    });
  });

  describe("`Document` events", () => {
    beforeEach(() => {
      addEventListenerSpy = vi.spyOn(document, "addEventListener").mockImplementation(() => {});
      removeEventListenerSpy = vi
        .spyOn(document, "removeEventListener")
        .mockImplementation(() => {});
    });

    test("should add and remove event listener for a single event and listener", async () => {
      const listener = vi.fn();

      const screen = await page.renderHook(() => useEventListener(document, "click", listener));

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(1, "click", listener, undefined);

      screen.result.current.unsubscribe();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(1, "click", listener, undefined);

      screen.result.current.subscribe();

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(2, "click", listener, undefined);

      screen.unmount();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(2, "click", listener, undefined);
    });

    test("should add and remove event listeners for multiple events and a single listener", async () => {
      const listener = vi.fn();

      const screen = await page.renderHook(() =>
        useEventListener(document, ["click", "touchstart"], listener, undefined),
      );

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(1, "click", listener, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(2, "touchstart", listener, undefined);

      screen.result.current.unsubscribe();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(1, "click", listener, undefined);
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(2, "touchstart", listener, undefined);

      screen.result.current.subscribe();

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(3, "click", listener, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(4, "touchstart", listener, undefined);

      screen.unmount();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(3, "click", listener, undefined);
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(4, "touchstart", listener, undefined);
    });

    test("should add and remove event listeners for a single event and multiple listeners", async () => {
      const listenerA = vi.fn();
      const listenerB = vi.fn();

      const screen = await page.renderHook(() =>
        useEventListener(document, "click", [listenerA, listenerB]),
      );

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(1, "click", listenerA, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(2, "click", listenerB, undefined);

      screen.result.current.unsubscribe();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(1, "click", listenerA, undefined);
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(2, "click", listenerB, undefined);

      screen.result.current.subscribe();

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(3, "click", listenerA, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(4, "click", listenerB, undefined);

      screen.unmount();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(3, "click", listenerA, undefined);
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(4, "click", listenerB, undefined);
    });

    test("should add and remove event listeners for multiple events and multiple listeners", async () => {
      const listenerA = vi.fn();
      const listenerB = vi.fn();

      const screen = await page.renderHook(() =>
        useEventListener(document, ["click", "touchstart"], [listenerA, listenerB], undefined),
      );

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(1, "click", listenerA, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(2, "click", listenerB, undefined);

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(3, "touchstart", listenerA, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(4, "touchstart", listenerB, undefined);

      screen.result.current.unsubscribe();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(1, "click", listenerA, undefined);
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(2, "click", listenerB, undefined);

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(3, "touchstart", listenerA, undefined);
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(4, "touchstart", listenerB, undefined);

      screen.result.current.subscribe();

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(5, "click", listenerA, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(6, "click", listenerB, undefined);

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(7, "touchstart", listenerA, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(8, "touchstart", listenerB, undefined);

      screen.unmount();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(5, "click", listenerA, undefined);
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(6, "click", listenerB, undefined);

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(7, "touchstart", listenerA, undefined);
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(8, "touchstart", listenerB, undefined);
    });
  });

  describe("`ShadowRoot` events", () => {
    let shadowRoot: ShadowRoot;

    beforeEach(() => {
      shadowRoot = document.createElement("div").attachShadow({ mode: "open" });

      addEventListenerSpy = vi.spyOn(shadowRoot, "addEventListener").mockImplementation(() => {});
      removeEventListenerSpy = vi
        .spyOn(shadowRoot, "removeEventListener")
        .mockImplementation(() => {});
    });

    test("should add and remove event listener for a single event and listener", async () => {
      const listener = vi.fn();

      const screen = await page.renderHook(() =>
        useEventListener(shadowRoot, "slotchange", listener, undefined),
      );

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(1, "slotchange", listener, undefined);

      screen.result.current.unsubscribe();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(1, "slotchange", listener, undefined);

      screen.result.current.subscribe();

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(2, "slotchange", listener, undefined);

      screen.unmount();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(2, "slotchange", listener, undefined);
    });

    test("should add and remove event listeners for a single event and multiple listeners", async () => {
      const listenerA = vi.fn();
      const listenerB = vi.fn();

      const screen = await page.renderHook(() =>
        useEventListener(shadowRoot, "slotchange", [listenerA, listenerB], undefined),
      );

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(1, "slotchange", listenerA, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(2, "slotchange", listenerB, undefined);

      screen.result.current.unsubscribe();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(1, "slotchange", listenerA, undefined);
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(2, "slotchange", listenerB, undefined);

      screen.result.current.subscribe();

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(3, "slotchange", listenerA, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(4, "slotchange", listenerB, undefined);

      screen.unmount();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(3, "slotchange", listenerA, undefined);
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(4, "slotchange", listenerB, undefined);
    });
  });

  describe("`HTMLElement` events", () => {
    let element: HTMLElement;

    beforeEach(() => {
      element = document.createElement("div");

      addEventListenerSpy = vi.spyOn(element, "addEventListener").mockImplementation(() => {});
      removeEventListenerSpy = vi
        .spyOn(element, "removeEventListener")
        .mockImplementation(() => {});
    });

    test("should add and remove event listener for a single event and listener", async () => {
      const listener = vi.fn();

      const screen = await page.renderHook(() =>
        useEventListener(element, "click", listener, undefined),
      );

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(1, "click", listener, undefined);

      screen.result.current.unsubscribe();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(1, "click", listener, undefined);

      screen.result.current.subscribe();

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(2, "click", listener, undefined);

      screen.unmount();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(2, "click", listener, undefined);
    });

    test("should add and remove event listeners for multiple events and a single listener", async () => {
      const listener = vi.fn();

      const screen = await page.renderHook(() =>
        useEventListener(element, ["click", "mouseover"], listener, undefined),
      );

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(1, "click", listener, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(2, "mouseover", listener, undefined);

      screen.result.current.unsubscribe();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(1, "click", listener, undefined);
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(2, "mouseover", listener, undefined);

      screen.result.current.subscribe();

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(3, "click", listener, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(4, "mouseover", listener, undefined);

      screen.unmount();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(3, "click", listener, undefined);
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(4, "mouseover", listener, undefined);
    });

    test("should add and remove event listeners for a single event and multiple listeners", async () => {
      const listenerA = vi.fn();
      const listenerB = vi.fn();

      const screen = await page.renderHook(() =>
        useEventListener(element, "click", [listenerA, listenerB], undefined),
      );

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(1, "click", listenerA, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(2, "click", listenerB, undefined);

      screen.result.current.unsubscribe();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(1, "click", listenerA, undefined);
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(2, "click", listenerB, undefined);

      screen.result.current.subscribe();

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(3, "click", listenerA, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(4, "click", listenerB, undefined);

      screen.unmount();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(3, "click", listenerA, undefined);
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(4, "click", listenerB, undefined);
    });

    test("should add and remove event listeners for multiple events and multiple listeners", async () => {
      const listenerA = vi.fn();
      const listenerB = vi.fn();

      const screen = await page.renderHook(() =>
        useEventListener(element, ["click", "mouseover"], [listenerA, listenerB], undefined),
      );

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(1, "click", listenerA, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(2, "click", listenerB, undefined);

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(3, "mouseover", listenerA, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(4, "mouseover", listenerB, undefined);

      screen.result.current.unsubscribe();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(1, "click", listenerA, undefined);
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(2, "click", listenerB, undefined);

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(3, "mouseover", listenerA, undefined);
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(4, "mouseover", listenerB, undefined);

      screen.result.current.subscribe();

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(5, "click", listenerA, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(6, "click", listenerB, undefined);

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(7, "mouseover", listenerA, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(8, "mouseover", listenerB, undefined);

      screen.unmount();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(5, "click", listenerA, undefined);
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(6, "click", listenerB, undefined);

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(7, "mouseover", listenerA, undefined);
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(8, "mouseover", listenerB, undefined);
    });
  });

  describe("`CookieStore` events", () => {
    beforeEach(() => {
      addEventListenerSpy = vi.spyOn(cookieStore, "addEventListener").mockImplementation(() => {});
      removeEventListenerSpy = vi
        .spyOn(cookieStore, "removeEventListener")
        .mockImplementation(() => {});
    });

    test("should add and remove event listener for a single event and listener", async () => {
      const listener = vi.fn();

      const screen = await page.renderHook(() =>
        useEventListener(cookieStore, "change", listener, undefined),
      );

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(1, "change", listener, undefined);

      screen.result.current.unsubscribe();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(1, "change", listener, undefined);

      screen.result.current.subscribe();

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(2, "change", listener, undefined);

      screen.unmount();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(2, "change", listener, undefined);
    });

    test("should add and remove event listeners for a single event and multiple listeners", async () => {
      const listenerA = vi.fn();
      const listenerB = vi.fn();

      const screen = await page.renderHook(() =>
        useEventListener(cookieStore, "change", [listenerA, listenerB], undefined),
      );

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(1, "change", listenerA, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(2, "change", listenerB, undefined);

      screen.result.current.unsubscribe();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(1, "change", listenerA, undefined);
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(2, "change", listenerB, undefined);

      screen.result.current.subscribe();

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(3, "change", listenerA, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(4, "change", listenerB, undefined);

      screen.unmount();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(3, "change", listenerA, undefined);
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(4, "change", listenerB, undefined);
    });
  });

  describe("`BroadcastChannel` events", () => {
    let broadcastChannel: BroadcastChannel;

    beforeEach(() => {
      broadcastChannel = new BroadcastChannel("test");

      addEventListenerSpy = vi
        .spyOn(broadcastChannel, "addEventListener")
        .mockImplementation(() => {});
      removeEventListenerSpy = vi
        .spyOn(broadcastChannel, "removeEventListener")
        .mockImplementation(() => {});
    });

    test("should add and remove event listener for a single event and listener", async () => {
      const listener = vi.fn();

      const screen = await page.renderHook(() =>
        useEventListener(broadcastChannel, "message", listener, undefined),
      );

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(1, "message", listener, undefined);

      screen.result.current.unsubscribe();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(1, "message", listener, undefined);

      screen.result.current.subscribe();

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(2, "message", listener, undefined);

      screen.unmount();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(2, "message", listener, undefined);
    });

    test("should add and remove event listeners for multiple events and a single listener", async () => {
      const listener = vi.fn();

      const screen = await page.renderHook(() =>
        useEventListener(broadcastChannel, ["message", "messageerror"], listener, undefined),
      );

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(1, "message", listener, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(2, "messageerror", listener, undefined);

      screen.result.current.unsubscribe();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(1, "message", listener, undefined);
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(
        2,
        "messageerror",
        listener,
        undefined,
      );

      screen.result.current.subscribe();

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(3, "message", listener, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(4, "messageerror", listener, undefined);

      screen.unmount();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(3, "message", listener, undefined);
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(
        4,
        "messageerror",
        listener,
        undefined,
      );
    });

    test("should add and remove event listeners for a single event and multiple listeners", async () => {
      const listenerA = vi.fn();
      const listenerB = vi.fn();

      const screen = await page.renderHook(() =>
        useEventListener(broadcastChannel, "message", [listenerA, listenerB], undefined),
      );

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(1, "message", listenerA, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(2, "message", listenerB, undefined);

      screen.result.current.unsubscribe();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(1, "message", listenerA, undefined);
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(2, "message", listenerB, undefined);

      screen.result.current.subscribe();

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(3, "message", listenerA, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(4, "message", listenerB, undefined);

      screen.unmount();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(3, "message", listenerA, undefined);
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(4, "message", listenerB, undefined);
    });

    test("should add and remove event listeners for multiple events and multiple listeners", async () => {
      const listenerA = vi.fn();
      const listenerB = vi.fn();

      const screen = await page.renderHook(() =>
        useEventListener(
          broadcastChannel,
          ["message", "messageerror"],
          [listenerA, listenerB],
          undefined,
        ),
      );

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(1, "message", listenerA, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(2, "message", listenerB, undefined);

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(3, "messageerror", listenerA, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(4, "messageerror", listenerB, undefined);

      screen.result.current.unsubscribe();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(1, "message", listenerA, undefined);
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(2, "message", listenerB, undefined);

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(
        3,
        "messageerror",
        listenerA,
        undefined,
      );
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(
        4,
        "messageerror",
        listenerB,
        undefined,
      );

      screen.result.current.subscribe();

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(5, "message", listenerA, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(6, "message", listenerB, undefined);

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(7, "messageerror", listenerA, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(8, "messageerror", listenerB, undefined);

      screen.unmount();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(5, "message", listenerA, undefined);
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(6, "message", listenerB, undefined);

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(
        7,
        "messageerror",
        listenerA,
        undefined,
      );
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(
        8,
        "messageerror",
        listenerB,
        undefined,
      );
    });
  });

  describe("Custom events", () => {
    let eventTarget: EventTarget;

    beforeEach(() => {
      eventTarget = new EventTarget();

      addEventListenerSpy = vi.spyOn(eventTarget, "addEventListener").mockImplementation(() => {});
      removeEventListenerSpy = vi
        .spyOn(eventTarget, "removeEventListener")
        .mockImplementation(() => {});
    });

    test("should add and remove event listener for a single event and listener", async () => {
      const listener = vi.fn();

      const screen = await page.renderHook(() =>
        useEventListener(eventTarget, "custom-event", listener, undefined),
      );

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(1, "custom-event", listener, undefined);

      screen.result.current.unsubscribe();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(
        1,
        "custom-event",
        listener,
        undefined,
      );

      screen.result.current.subscribe();

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(2, "custom-event", listener, undefined);

      screen.unmount();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(
        2,
        "custom-event",
        listener,
        undefined,
      );
    });

    test("should add and remove event listeners for multiple events and a single listener", async () => {
      const listener = vi.fn();

      const screen = await page.renderHook(() =>
        useEventListener(eventTarget, ["custom-event-1", "custom-event-2"], listener, undefined),
      );

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(1, "custom-event-1", listener, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(2, "custom-event-2", listener, undefined);

      screen.result.current.unsubscribe();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(
        1,
        "custom-event-1",
        listener,
        undefined,
      );
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(
        2,
        "custom-event-2",
        listener,
        undefined,
      );

      screen.result.current.subscribe();

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(3, "custom-event-1", listener, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(4, "custom-event-2", listener, undefined);

      screen.unmount();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(
        3,
        "custom-event-1",
        listener,
        undefined,
      );
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(
        4,
        "custom-event-2",
        listener,
        undefined,
      );
    });

    test("should add and remove event listeners for a single event and multiple listeners", async () => {
      const listenerA = vi.fn();
      const listenerB = vi.fn();

      const screen = await page.renderHook(() =>
        useEventListener(eventTarget, "custom-event", [listenerA, listenerB], undefined),
      );

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(1, "custom-event", listenerA, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(2, "custom-event", listenerB, undefined);

      screen.result.current.unsubscribe();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(
        1,
        "custom-event",
        listenerA,
        undefined,
      );
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(
        2,
        "custom-event",
        listenerB,
        undefined,
      );

      screen.result.current.subscribe();

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(3, "custom-event", listenerA, undefined);
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(4, "custom-event", listenerB, undefined);

      screen.unmount();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(
        3,
        "custom-event",
        listenerA,
        undefined,
      );
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(
        4,
        "custom-event",
        listenerB,
        undefined,
      );
    });

    test("should add and remove event listeners for multiple events and multiple listeners", async () => {
      const listenerA = vi.fn();
      const listenerB = vi.fn();

      const screen = await page.renderHook(() =>
        useEventListener(
          eventTarget,
          ["custom-event-1", "custom-event-2"],
          [listenerA, listenerB],
          undefined,
        ),
      );

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(
        1,
        "custom-event-1",
        listenerA,
        undefined,
      );
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(
        2,
        "custom-event-1",
        listenerB,
        undefined,
      );

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(
        3,
        "custom-event-2",
        listenerA,
        undefined,
      );
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(
        4,
        "custom-event-2",
        listenerB,
        undefined,
      );

      screen.result.current.unsubscribe();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(
        1,
        "custom-event-1",
        listenerA,
        undefined,
      );
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(
        2,
        "custom-event-1",
        listenerB,
        undefined,
      );

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(
        3,
        "custom-event-2",
        listenerA,
        undefined,
      );
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(
        4,
        "custom-event-2",
        listenerB,
        undefined,
      );

      screen.result.current.subscribe();

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(
        5,
        "custom-event-1",
        listenerA,
        undefined,
      );
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(
        6,
        "custom-event-1",
        listenerB,
        undefined,
      );

      expect(addEventListenerSpy).toHaveBeenNthCalledWith(
        7,
        "custom-event-2",
        listenerA,
        undefined,
      );
      expect(addEventListenerSpy).toHaveBeenNthCalledWith(
        8,
        "custom-event-2",
        listenerB,
        undefined,
      );

      screen.unmount();

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(
        5,
        "custom-event-1",
        listenerA,
        undefined,
      );
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(
        6,
        "custom-event-1",
        listenerB,
        undefined,
      );

      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(
        7,
        "custom-event-2",
        listenerA,
        undefined,
      );
      expect(removeEventListenerSpy).toHaveBeenNthCalledWith(
        8,
        "custom-event-2",
        listenerB,
        undefined,
      );
    });
  });

  test("supports refs as event targets", async () => {
    const target = new EventTarget();
    const targetRef = createRef<EventTarget>();
    targetRef.current = target;
    const listener = vi.fn();

    const screen = await page.renderHook(() => useEventListener(targetRef, "ref-event", listener));

    target.dispatchEvent(new Event("ref-event"));
    expect(listener).toHaveBeenCalledOnce();

    screen.result.current.unsubscribe();
    target.dispatchEvent(new Event("ref-event"));
    expect(listener).toHaveBeenCalledOnce();
  });
});
