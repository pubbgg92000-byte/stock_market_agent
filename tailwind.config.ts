import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--color-ink)",
        muted: "var(--color-muted)",
        paper: "var(--color-paper)",
        panel: "var(--color-panel)",
        line: "var(--color-line)",
        cobalt: "var(--color-cobalt)",
        pine: "var(--color-pine)",
        amber: "var(--color-amber)",
        rose: "var(--color-rose)"
      }
    }
  },
  plugins: []
};

export default config;
