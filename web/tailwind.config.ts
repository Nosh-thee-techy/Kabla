import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#1B1A17",
        paper: "#F6F1E7",
        savanna: "#2F5D50",
        terracotta: "#C4572D",
        gold: "#D9A441",
        "flag-red": "#B3261E",
        "flag-amber": "#B9770E",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
