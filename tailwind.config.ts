import type { Config } from "tailwindcss";

/**
 * Brand tokens — do not deviate.
 * Forest #234b34 · cream #f6f1e6 · gold #c2a24a · charcoal #20241f · white.
 * Contrast rules (enforced via component classes in globals.css):
 *   - charcoal text only on cream or white
 *   - white text only on forest
 *   - gold only for buttons, icons, thin rules — never body text, never behind dark text
 *   - on forest, small labels use #d4b55f
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: { DEFAULT: "#234b34", 700: "#1d3f2c" },
        cream: "#f6f1e6",
        gold: { DEFAULT: "#c2a24a", hover: "#a98a35", onForest: "#d4b55f" },
        charcoal: "#20241f",
        ink: { DEFAULT: "#20241f", soft: "#3a3f38", muted: "#4a5047", faint: "#6b6552" },
        line: { DEFAULT: "#e8e0cd", warm: "#e0d6bf", soft: "#d8cdb3" },
      },
      fontFamily: {
        fraunces: ["var(--font-fraunces)", "Georgia", "serif"],
        inter: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      maxWidth: { shell: "1180px" },
      minHeight: { touch: "44px" },
      minWidth: { touch: "44px" },
    },
  },
  plugins: [],
};

export default config;
