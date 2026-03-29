import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#0a0a18",
        surface: "#0f0f24",
        elevated: "#161632",
        border: "#1a1a3e",
        green: "#00ff88",
        amber: "#ffcc00",
        red: "#ff4444",
        muted: "#666688",
        "text-primary": "#ffffff",
        "text-secondary": "#aaaacc",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-space-mono)", "monospace"],
        pixel: ["var(--font-press-start)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
