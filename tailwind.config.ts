import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        white: "var(--surface)",
        paper: "var(--paper)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        line: "var(--line)",
        accent: "var(--primary)",
        "accent-hover": "var(--primary-hover)",
        "accent-soft": "var(--primary-soft)",
      },
      fontFamily: {
        sans: ["Verdana", "sans-serif"],
        display: ["Georgia", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
