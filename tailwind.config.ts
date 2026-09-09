import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#EEEFF1",
        surface: "#FFFFFF",
        border: "#E2E8F0",
        foreground: "#0F172A",
        muted: "#475569",
        subtle: "#94A3B8",
        secondary: "#F1F5F9",
        primary: "#0F172A",
        success: "#059669",
        danger: "#DC2626",
        neutral: "#64748B",
        win: {
          DEFAULT: "#059669",
          dim: "rgba(5, 150, 105, 0.08)",
        },
        loss: {
          DEFAULT: "#DC2626",
          dim: "rgba(220, 38, 38, 0.08)",
        },
        neutralData: "#64748B",
        accent: {
          DEFAULT: "#2563EB",
          cyan: "#2563EB",
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
        card: "0 1px 2px 0 rgba(15, 23, 42, 0.04)",
        glow: "0 0 0 1px rgba(37, 99, 235, 0.12)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.15s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;