import { defineConfig, presetWind4 } from "unocss";

export default defineConfig({
  outputToCssLayers: true,
  presets: [
    presetWind4({
      dark: "media",
    }),
  ],
});
