import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0E14",
        surface: "#151921",
        border: "#2A2F3D",
        muted: "#9CA3AF",
        foreground: "#E5E7EB",
        win: {
          DEFAULT: "#10B981",
          dim: "rgba(16, 185, 129, 0.12)",
        },
        loss: {
          DEFAULT: "#EF4444",
          dim: "rgba(239, 68, 68, 0.12)",
        },
        accent: {
          DEFAULT: "#6366F1",
          cyan: "#22D3EE",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jbmono)", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(16,185,129,0.15), 0 8px 30px rgba(16,185,129,0.08)",
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
