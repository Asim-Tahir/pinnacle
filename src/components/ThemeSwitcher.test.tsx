import { act } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { page } from "vitest/browser";

import {
  DARK_COLOR_SCHEME_MEDIA_QUERY,
  DARK_THEME_CLASS,
  LIGHT_THEME_CLASS,
  THEME_STORAGE_KEY,
} from "@/constants/theme";

import ThemeSwitcher from "./ThemeSwitcher";

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

function expectIcon(button: HTMLElement | SVGElement, icon: "monitor" | "moon" | "sun") {
  expect(button.querySelector("svg")?.classList.contains(`lucide-${icon}`)).toBeTruthy();
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

describe("ThemeSwitcher", () => {
  test("opens the accessible theme menu and shows the system icon in dark system mode", async () => {
    const systemColorScheme = createColorSchemeMediaQuery(true);
    vi.spyOn(window, "matchMedia").mockReturnValue(systemColorScheme.mediaQueryList);

    const screen = await page.render(<ThemeSwitcher />);
    const trigger = screen.getByRole("button", { name: "Theme: system" });

    await expect.element(trigger).toBeVisible();
    expectIcon(trigger.element(), "monitor");
    await trigger.click();

    await expect.element(screen.getByRole("menuitemradio", { name: "Light" })).toBeVisible();
    await expect.element(screen.getByRole("menuitemradio", { name: "Dark" })).toBeVisible();
    await expect
      .element(screen.getByRole("menuitemradio", { name: "System" }))
      .toHaveAttribute("aria-checked", "true");
  });

  test("selects and persists Dark and Light themes with the matching icon", async () => {
    const systemColorScheme = createColorSchemeMediaQuery(false);
    vi.spyOn(window, "matchMedia").mockReturnValue(systemColorScheme.mediaQueryList);

    const screen = await page.render(<ThemeSwitcher />);
    await screen.getByRole("button", { name: "Theme: system" }).click();
    await screen.getByRole("menuitemradio", { name: "Dark" }).click();

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    const darkTrigger = screen.getByRole("button", { name: "Theme: dark" });
    expectIcon(darkTrigger.element(), "moon");
    expect(document.documentElement.classList.contains(DARK_THEME_CLASS)).toBeTruthy();

    await darkTrigger.click();
    await screen.getByRole("menuitemradio", { name: "Light" }).click();

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    const lightTrigger = screen.getByRole("button", { name: "Theme: light" });
    expectIcon(lightTrigger.element(), "sun");
    expect(document.documentElement.classList.contains(LIGHT_THEME_CLASS)).toBeTruthy();
  });

  test("selecting System restores the OS color scheme and monitor icon", async () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    const systemColorScheme = createColorSchemeMediaQuery(false);
    vi.spyOn(window, "matchMedia").mockReturnValue(systemColorScheme.mediaQueryList);

    const screen = await page.render(<ThemeSwitcher />);
    await screen.getByRole("button", { name: "Theme: dark" }).click();
    await screen.getByRole("menuitemradio", { name: "System" }).click();

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("system");
    const systemTrigger = screen.getByRole("button", { name: "Theme: system" });
    expectIcon(systemTrigger.element(), "monitor");
    expect(document.documentElement.classList.contains(LIGHT_THEME_CLASS)).toBeTruthy();

    act(() => systemColorScheme.setMatches(true));
    expectIcon(systemTrigger.element(), "monitor");
    expect(document.documentElement.classList.contains(DARK_THEME_CLASS)).toBeTruthy();
  });
});
