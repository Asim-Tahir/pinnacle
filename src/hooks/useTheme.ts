import { useLayoutEffect, useMemo } from "react";

import {
  DARK_COLOR_SCHEME_MEDIA_QUERY,
  DARK_THEME_CLASS,
  LIGHT_THEME_CLASS,
  THEME_STORAGE_KEY,
} from "@/constants/theme";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export type Theme = "light" | "dark" | "system";
type ColorScheme = Exclude<Theme, "system">;

function isTheme(value: string): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

export function useTheme() {
  const [storedTheme, setStoredTheme] = useLocalStorage<Theme>(THEME_STORAGE_KEY, "system", {
    writeInitialValue: false,
  });
  const theme = useMemo<Theme>(
    () => (isTheme(storedTheme) ? storedTheme : "system"),
    [storedTheme],
  );
  const isUsingDarkColorScheme = useMediaQuery(DARK_COLOR_SCHEME_MEDIA_QUERY);

  const systemColorScheme = useMemo<ColorScheme>(
    () => (isUsingDarkColorScheme ? "dark" : "light"),
    [isUsingDarkColorScheme],
  );
  const colorScheme = useMemo<ColorScheme>(
    () => (theme === "system" ? systemColorScheme : theme),
    [theme, systemColorScheme],
  );

  useLayoutEffect(() => {
    const isDark = colorScheme === "dark";
    document.documentElement.classList.toggle(DARK_THEME_CLASS, isDark);
    document.documentElement.classList.toggle(LIGHT_THEME_CLASS, !isDark);
    document.documentElement.style.colorScheme = colorScheme;
  }, [colorScheme]);

  return {
    theme,
    colorScheme,
    setTheme: (value: Theme) => setStoredTheme(value),
  };
}
