import { theme as defaultTheme } from "@unocss/preset-wind4";
import { defineConfig, presetWebFonts, presetWind4, transformerDirectives } from "unocss";

import { DARK_THEME_CLASS, LIGHT_THEME_CLASS } from "./src/constants/theme";

export default defineConfig({
  outputToCssLayers: true,
  presets: [
    presetWind4({
      dark: {
        dark: DARK_THEME_CLASS,
        light: LIGHT_THEME_CLASS,
      },
    }),
    presetWebFonts({
      provider: "google",
      fonts: {
        sans: [
          {
            name: "Inter",
            weights: ["400", "500", "600", "700"],
            italic: false,
          },
          {
            name: "sans-serif",
            provider: "none",
          },
        ],
      },
    }),
  ],
  transformers: [transformerDirectives()],
  theme: {
    ...defaultTheme,
    colors: {
      border: "var(--border)",
      input: "var(--input)",
      ring: "var(--ring)",
      background: "var(--background)",
      foreground: "var(--foreground)",
      primary: {
        DEFAULT: "var(--primary)",
        foreground: "var(--primary-foreground)",
      },
      secondary: {
        DEFAULT: "var(--secondary)",
        foreground: "var(--secondary-foreground)",
      },
      destructive: {
        DEFAULT: "var(--destructive)",
        foreground: "var(--destructive-foreground)",
      },
      muted: {
        DEFAULT: "var(--muted)",
        foreground: "var(--muted-foreground)",
      },
      accent: {
        DEFAULT: "var(--accent)",
        foreground: "var(--accent-foreground)",
      },
      popover: {
        DEFAULT: "var(--popover)",
        foreground: "var(--popover-foreground)",
      },
      card: {
        DEFAULT: "var(--card)",
        foreground: "var(--card-foreground)",
      },
      chart1: "var(--chart1)",
      chart2: "var(--chart2)",
      chart3: "var(--chart3)",
      chart4: "var(--chart4)",
      chart5: "var(--chart5)",
      sidebar: {
        DEFAULT: "var(--sidebar-background)",
        background: "var(--sidebar-background)",
        foreground: "var(--sidebar-foreground)",
        primary: {
          DEFAULT: "var(--sidebar-primary)",
          foreground: "var(--sidebar-primary-foreground)",
        },
        accent: {
          DEFAULT: "var(--sidebar-accent)",
          foreground: "var(--sidebar-accent-foreground)",
        },
        border: "var(--sidebar-border)",
        ring: "var(--sidebar-ring)",
      },
    },
  },
});
