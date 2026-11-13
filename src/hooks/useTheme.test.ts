import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { page } from "vitest/browser";

import {
  DARK_COLOR_SCHEME_MEDIA_QUERY,
  DARK_THEME_CLASS,
  LIGHT_THEME_CLASS,
  THEME_STORAGE_KEY,
} from "@/constants/theme";

import { useTheme } from "./useTheme";

function createColorSchemeMediaQuery(initialMatches = false) {
  let matches = initialMatches;
  const mediaQueryList = Object.assign(new EventTarget(), {
    matches: initialMatches,
    media: DARK_COLOR_SCHEME_MEDIA_QUERY,
    onchange: null as MediaQueryList["onchange"],
    addListener: () => {},
    removeListener: () => {},
  }) satisfies MediaQueryList;

  Object.defineProperty(mediaQueryList, "matches", { get: () => matches });

  return {
    mediaQueryList,
    setMatches(nextMatches: boolean) {
      matches = nextMatches;
      mediaQueryList.dispatchEvent(
        Object.assign(new Event("change"), {
          matches: nextMatches,
          media: DARK_COLOR_SCHEME_MEDIA_QUERY,
        }),
      );
    },
  };
}

function mockColorScheme(mediaQueryList: MediaQueryList) {
  vi.spyOn(window, "matchMedia").mockImplementation((query) => {
    expect(query).toBe(DARK_COLOR_SCHEME_MEDIA_QUERY);
    return mediaQueryList;
  });
}

function clearThemeState() {
  localStorage.removeItem(THEME_STORAGE_KEY);
  document.documentElement.classList.remove(DARK_THEME_CLASS, LIGHT_THEME_CLASS);
  document.documentElement.style.colorScheme = "";
}

beforeEach(() => {
  vi.restoreAllMocks();
  clearThemeState();
});

afterEach(() => {
  clearThemeState();
  vi.restoreAllMocks();
});

describe("useTheme", () => {
  test("defaults to system and follows OS color-scheme changes", async () => {
    const systemColorScheme = createColorSchemeMediaQuery();
    mockColorScheme(systemColorScheme.mediaQueryList);

    const screen = await page.renderHook(() => useTheme());

    expect(screen.result.current).toMatchObject({
      theme: "system",
      colorScheme: "light",
    });
    expect(document.documentElement.classList.contains(LIGHT_THEME_CLASS)).toBeTruthy();

    await screen.act(() => systemColorScheme.setMatches(true));
    expect(screen.result.current.colorScheme).toBe("dark");
    expect(document.documentElement.classList.contains(DARK_THEME_CLASS)).toBeTruthy();
    expect(document.documentElement.style.colorScheme).toBe("dark");

    await screen.act(() => systemColorScheme.setMatches(false));
    expect(screen.result.current.colorScheme).toBe("light");
    expect(document.documentElement.classList.contains(LIGHT_THEME_CLASS)).toBeTruthy();
  });

  test("loads and persists explicit theme choices", async () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    const systemColorScheme = createColorSchemeMediaQuery(false);
    mockColorScheme(systemColorScheme.mediaQueryList);

    const screen = await page.renderHook(() => useTheme());

    expect(screen.result.current).toMatchObject({
      theme: "dark",
      colorScheme: "dark",
    });

    await screen.act(() => screen.result.current.setTheme("light"));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(screen.result.current.colorScheme).toBe("light");
    expect(document.documentElement.classList.contains(LIGHT_THEME_CLASS)).toBeTruthy();

    await screen.act(() => systemColorScheme.setMatches(true));
    expect(screen.result.current.colorScheme).toBe("light");
  });
});
