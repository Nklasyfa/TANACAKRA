/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      "colors": {
        // ===== Tanacakra "Volcanic Agronomy" design tokens =====
        // Brand moss green (Teras)
        "primary": "#243319",
        "primary-container": "#3a4a2e",
        "on-primary": "#ffffff",
        "on-primary-container": "#a6b995",
        "primary-fixed": "#d5e9c3",
        "primary-fixed-dim": "#bacda8",
        "on-primary-fixed": "#111f08",
        "on-primary-fixed-variant": "#3b4b2f",
        "inverse-primary": "#bacda8",

        // Burned-orange CTA accent (from mockups)
        "cta": "#A8452A",
        "cta-hover": "#923c24",
        "cta-soft": "#F3ECE0",

        // Warm canvas / parchment (Kertas)
        "surface": "#fff8f4",
        "background": "#fff8f4",
        "on-background": "#231a10",
        "surface-bright": "#fff8f4",
        "surface-dim": "#e9d7c7",
        "surface-container": "#fdebdb",
        "surface-container-low": "#fff1e6",
        "surface-container-high": "#f8e5d5",
        "surface-container-highest": "#f2dfcf",
        "surface-container-lowest": "#ffffff",
        "surface-variant": "#f2dfcf",
        "on-surface": "#231a10",
        "on-surface-variant": "#444840",
        "surface-tint": "#536345",
        "inverse-surface": "#392e24",
        "inverse-on-surface": "#ffeedf",

        // Neutral earth text (Tanah)
        "secondary": "#645d58",
        "on-secondary": "#ffffff",
        "secondary-container": "#e8ded7",
        "on-secondary-container": "#68615c",
        "secondary-fixed": "#ebe0da",
        "secondary-fixed-dim": "#cfc5be",
        "on-secondary-fixed": "#1f1b17",
        "on-secondary-fixed-variant": "#4c4641",
        "tertiary": "#2a3128",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#40473e",
        "tertiary-fixed": "#dee5d8",
        "tertiary-fixed-dim": "#c2c9bc",
        "on-tertiary-fixed": "#171d16",
        "on-tertiary-fixed-variant": "#42493f",

        // Status / error
        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",

        // Lines & outlines (Garis)
        "outline": "#75786f",
        "outline-variant": "#c5c8bd",
        "border": "#e5e0d8",
        "input": "#e5e0d8",
        "ring": "#243319",

        // Legacy aliases so existing classes keep working
        "foreground": "#231a10",
        "muted": "#f8e5d5",
        "muted-foreground": "#645d58",
        "accent": "#f2dfcf",
        "accent-foreground": "#231a10",
        "destructive": "#ba1a1a",
        "destructive-foreground": "#ffffff",
        "chart-1": "#3a4a2e",
        "chart-2": "#a8452a",
        "chart-3": "#d9a13b",
        "chart-4": "#645d58",
        "chart-5": "#bacda8"
      },
      "spacing": {
        "gutter": "1.5rem",
        "stack": "2rem",
        "section": "3rem",
        "stack-md": "1rem",
        "stack-lg": "2rem",
        "margin-desktop": "3rem",
        "stack-sm": "0.5rem",
        "margin-mobile": "1.5rem"
      },
      "borderRadius": {
        "DEFAULT": "0.25rem",
        "sm": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "2xl": "0.875rem",
        "card": "0.875rem",
        "full": "9999px"
      },
      "fontFamily": {
        "sans": ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        "serif": ["Newsreader", "Georgia", "serif"],
        "display": ["Newsreader", "Georgia", "serif"],
        "mono": ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"]
      },
      "fontSize": {
        "display-lg": ["56px", { "lineHeight": "64px", "fontWeight": "400", "letterSpacing": "-0.02em" }],
        "headline-xl": ["40px", { "lineHeight": "48px", "fontWeight": "400", "letterSpacing": "-0.015em" }],
        "headline-lg": ["32px", { "lineHeight": "40px", "fontWeight": "400", "letterSpacing": "-0.01em" }],
        "headline-md": ["20px", { "lineHeight": "28px", "fontWeight": "400", "letterSpacing": "-0.01em" }],
        "headline-sm": ["18px", { "lineHeight": "24px", "fontWeight": "600" }],
        "body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "400" }],
        "body-md": ["15px", { "lineHeight": "24px", "fontWeight": "400" }],
        "body-sm": ["13px", { "lineHeight": "20px", "fontWeight": "400" }],
        "label-lg": ["14px", { "lineHeight": "20px", "fontWeight": "600", "letterSpacing": "0.02em" }],
        "label-md": ["12px", { "lineHeight": "16px", "fontWeight": "600", "letterSpacing": "0.04em" }],
        "label-sm": ["11px", { "lineHeight": "14px", "fontWeight": "500", "letterSpacing": "0.05em" }]
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}