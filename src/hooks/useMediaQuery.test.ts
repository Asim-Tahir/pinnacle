import { useState } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { page } from "vitest/browser";

import { DARK_COLOR_SCHEME_MEDIA_QUERY } from "@/constants/theme";

import { useMediaQuery } from "./useMediaQuery";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useMediaQuery", () => {
  test("should be defined", () => {
    expect(useMediaQuery).toBeDefined();
  });

  test("should be false without window", async () => {
    const screen = await page.renderHook(() =>
      useMediaQuery("(min-width: 0px)", { window: null as unknown as undefined }),
    );

    expect(screen.result.current).toBeFalsy();
  });

  test("updates when the query changes", async () => {
    const firstQuery = "(min-width: 600px)";
    const secondQuery = "(min-width: 700px)";
    let matches = true;
    const mediaQueryList = Object.assign(new EventTarget(), {
      matches: false,
      media: firstQuery,
      onchange: null as MediaQueryList["onchange"],
      addListener: () => {},
      removeListener: () => {},
    }) satisfies MediaQueryList;
    Object.defineProperty(mediaQueryList, "matches", { get: () => matches });
    vi.spyOn(window, "matchMedia").mockImplementation((query) => {
      matches = query === firstQuery;
      return mediaQueryList;
    });

    const screen = await page.renderHook(() => {
      const [query, setQuery] = useState(firstQuery);
      return {
        matches: useMediaQuery(query),
        setQuery,
      };
    });

    expect(screen.result.current.matches).toBeTruthy();
    await screen.act(() => screen.result.current.setQuery(secondQuery));
    expect(screen.result.current.matches).toBeFalsy();
  });

  test("updates when the system color scheme changes", async () => {
    let matches = false;
    const mediaQueryList = Object.assign(new EventTarget(), {
      matches: false,
      media: DARK_COLOR_SCHEME_MEDIA_QUERY,
      onchange: null as MediaQueryList["onchange"],
      addListener: () => {},
      removeListener: () => {},
    }) satisfies MediaQueryList;
    Object.defineProperty(mediaQueryList, "matches", { get: () => matches });
    vi.spyOn(window, "matchMedia").mockReturnValue(mediaQueryList);

    const screen = await page.renderHook(() => useMediaQuery(DARK_COLOR_SCHEME_MEDIA_QUERY));
    expect(screen.result.current).toBeFalsy();

    await screen.act(() => {
      matches = true;
      mediaQueryList.dispatchEvent(
        Object.assign(new Event("change"), {
          matches: true,
          media: mediaQueryList.media,
        }),
      );
    });

    expect(screen.result.current).toBeTruthy();

    await screen.act(() => {
      matches = false;
      mediaQueryList.dispatchEvent(
        Object.assign(new Event("change"), {
          matches: false,
          media: mediaQueryList.media,
        }),
      );
    });

    expect(screen.result.current).toBeFalsy();
  });
});
