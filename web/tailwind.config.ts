import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#1B1A17",
        paper: "#F6F1E7",
        blot: "#EDE4D4",
        wax: "#E8C9A0",
        dusk: "#241C16",
        "dusk-2": "#32261D",
        savanna: "#2F5D50",
        terracotta: "#C4572D",
        gold: "#D9A441",
        foil: "#C9A15B",
        lamp: "#F3E6C8",
        "flag-red": "#B3261E",
        "flag-amber": "#B9770E",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        stamp: "0 3px 0 rgb(0 0 0 / 0.28)",
        folder: "6px 8px 0 rgb(36 28 22 / 0.12)",
      },
    },
  },
  plugins: [],
} satisfies Config;
