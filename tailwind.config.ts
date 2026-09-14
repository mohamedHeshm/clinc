import type { Config } from "tailwindcss";

// ─────────────────────────────────────────────────────────────
// Design tokens — Clinic
// هوية بصرية هادئة/طبية مقصودة، بعيدة عن قوالب SaaS الجاهزة:
// - لا أزرق سطوعي (#3B82F6-style)، بل درجة تيل-أزرق طبي عميق ومطفأ.
// - لا كريمي دافئ (#F4F1EA) شائع في التصاميم المولّدة، بل أبيض-عاجي أهدأ وأبرد قليلًا.
// - الأخضر الطبي محدود جدًا (Availability/Success فقط) وليس لونًا أساسيًا.
// - الخط: IBM Plex Sans Arabic — احترافي، مقروء بوضوح، ويدعم العربية بشكل ممتاز
//   (بديل متعمَّد عن Inter/Cairo الشائعين في القوالب الجاهزة).
// ─────────────────────────────────────────────────────────────

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: { lg: "1120px", xl: "1200px" },
    },
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: {
          DEFAULT: "hsl(var(--surface))",
          muted: "hsl(var(--surface-muted))",
        },
        border: "hsl(var(--border))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          hover: "hsl(var(--primary-hover))",
          foreground: "hsl(var(--primary-foreground))",
          subtle: "hsl(var(--primary-subtle))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          subtle: "hsl(var(--accent-subtle))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        warning: "hsl(var(--warning))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "10px",
        lg: "14px",
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgb(20 30 28 / 0.04), 0 1px 6px -1px rgb(20 30 28 / 0.05)",
        elevated: "0 4px 16px -4px rgb(20 30 28 / 0.10)",
      },
      fontFamily: {
        sans: [
          "IBM Plex Sans Arabic",
          "IBM Plex Sans",
          "system-ui",
          "sans-serif",
        ],
      },
      fontSize: {
        xs: ["0.8125rem", { lineHeight: "1.4" }],
        sm: ["0.9375rem", { lineHeight: "1.5" }],
        base: ["1rem", { lineHeight: "1.65" }],
        lg: ["1.125rem", { lineHeight: "1.6" }],
        xl: ["1.375rem", { lineHeight: "1.4" }],
        "2xl": ["1.75rem", { lineHeight: "1.3" }],
        "3xl": ["2.25rem", { lineHeight: "1.2" }],
        "4xl": ["2.75rem", { lineHeight: "1.15" }],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
