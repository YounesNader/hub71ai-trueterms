import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#faf9f6",
        ink: "#24342f",
        muted: "#52635b",
        line: "#cbd3cd",
        accent: "#14635b",
        "accent-hover": "#104f49",
        "accent-soft": "#eaf3ef",
      },
      fontFamily: {
        sans: ["Verdana", "sans-serif"],
        display: ["Georgia", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
