import type { Config } from "tailwindcss";

// Palette: deep ocean + slate, with bioluminescent teal and coral accents.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        abyss: "#04090f", // page background
        deep: "#08121e", // raised surfaces
        tide: "#0f1d2d", // cards
        slate2: "#1c2b3d", // borders
        mist: "#8aa0b6", // muted text
        foam: "#e6f1f7", // primary text
        glow: "#2ee6c5", // bioluminescent teal
        coral: "#ff6b6b", // warm accent
      },
      fontFamily: {
        display: ["ui-serif", "Georgia", "Cambria", "serif"],
      },
      boxShadow: {
        glow: "0 0 24px -4px rgba(46,230,197,0.35)",
      },
      keyframes: {
        drift: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
      },
      animation: { drift: "drift 6s ease-in-out infinite" },
    },
  },
  plugins: [],
};
export default config;
