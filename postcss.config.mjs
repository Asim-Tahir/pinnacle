import unocss from "@unocss/postcss";
import autoprefixer from "autoprefixer";

/** @type {import("postcss").Processor} */
export default {
  plugins: [unocss(), autoprefixer()],
};
