import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design System TradeShare — palette officielle light/SaaS/fintech.
        background: "#EEEFF1", // bg-main
        surface: "#FFFFFF",    // bg-surface
        border: "#E2E8F0",
        foreground: "#0F172A", // text-primary
        muted: "#64748B",      // usage générique existant (labels, texte discret)
        textSecondary: "#475569",
        textMuted: "#94A3B8",
        primary: {
          DEFAULT: "#0F172A",
        },
        secondary: {
          DEFAULT: "#F1F5F9",
        },
        win: {
          DEFAULT: "#059669",
          dim: "rgba(5, 150, 105, 0.08)",
        },
        loss: {
          DEFAULT: "#DC2626",
          dim: "rgba(220, 38, 38, 0.08)",
        },
        accent: {
          DEFAULT: "#2563EB",
          cyan: "#2563EB",
        },
        neutral: {
          DEFAULT: "#64748B",
        },
      },
      borderRadius: {
        lg: "0.625rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jbmono)", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(5, 150, 105, 0.12), 0 4px 16px rgba(15, 23, 42, 0.04)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;