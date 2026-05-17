import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        "surface-2": "var(--color-surface-2)",
        brand: "var(--color-brand)",
        "brand-hover": "var(--color-brand-hover)",
        copy: "var(--color-copy)",
        "copy-strong": "var(--color-copy-strong)",
        "copy-muted": "var(--color-copy-muted)",
        border: "var(--color-border)",
        overlay: {
          subtle: "var(--overlay-subtle)",
          DEFAULT: "var(--overlay-default)",
          medium: "var(--overlay-medium)",
          strong: "var(--overlay-strong)",
        },
      },
      boxShadow: {
        panel: "var(--shadow-panel)",
      },
      fontFamily: {
        display: ['"DM Sans"', "sans-serif"],
        body: ['"DM Sans"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
