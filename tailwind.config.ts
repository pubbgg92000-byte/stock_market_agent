import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        paper: "#f7f8fb",
        line: "#d8dee9",
        cobalt: "#2563eb",
        pine: "#047857",
        amber: "#b45309",
        rose: "#be123c"
      }
    }
  },
  plugins: []
};

export default config;
