import { describe, expect, test, vi } from "vitest";
import { page } from "vitest/browser";

import { useSupported } from "./useSupported";

describe("useSupported", () => {
  test("should return `true` when the callback returns a truthy value", async () => {
    const callback = vi.fn(() => true);

    const screen = await page.renderHook(() => useSupported(callback));

    expect(screen.result.current).toBe(true);
  });

  test("should return `false` when the callback returns a falsy value", async () => {
    const callback = vi.fn(() => false);

    const screen = await page.renderHook(() => useSupported(callback));

    expect(screen.result.current).toBe(false);
  });

  test("should return `false` when the callback throws an error", async () => {
    const callback = vi.fn(() => {
      throw new Error("Test error");
    });

    const screen = await page.renderHook(() => useSupported(callback));

    expect(screen.result.current).toBe(false);
  });

  test("should return `false` when the callback is not a function", async () => {
    const callback = "not a function";

    // @ts-expect-error - Testing invalid callback type
    const screen = await page.renderHook(() => useSupported(callback));

    expect(screen.result.current).toBe(false);
  });

  test("should return `true` when the callback returns a truthy value and the environment supports the feature", async () => {
    const callback = vi.fn(() => window && "cookieStore" in window);

    const screen = await page.renderHook(() => useSupported(callback));

    expect(screen.result.current).toBe(true);
  });

  test("should return `false` when the callback returns a truthy value but the environment does not support the feature", async () => {
    const callback = vi.fn(() => window && "nonExistentFeature" in window);

    const screen = await page.renderHook(() => useSupported(callback));

    expect(screen.result.current).toBe(false);
  });
});
