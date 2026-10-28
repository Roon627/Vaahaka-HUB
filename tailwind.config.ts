import type { Config } from "tailwindcss";

// Palette: a moonlit lagoon. Deep teal water, pearl-white text, and soft
// seafoam / sand / peach accents — nothing neon.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        abyss: "#0a1c26", // page background (deep water)
        deep: "#0f2733", // raised surfaces
        tide: "#143240", // card base
        slate2: "#234a55", // soft borders
        mist: "#9db9b8", // muted text
        foam: "#f5efe4", // pearl, primary text
        glow: "#9fe3d0", // seafoam accent
        coral: "#f4a595", // soft peach accent
        sand: "#ecd9b5", // warm sand
        lantern: "#f7d58e", // candle light
        ink: "#3a2d1f", // handwriting on parchment
        inksoft: "#7a6a55",
        wax: "#b4563f", // wax seal red
      },
      fontFamily: {
        // CSS variables are injected by next/font in layout.tsx
        display: ["var(--font-display)", "Dhivehi", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Dhivehi", "ui-sans-serif", "system-ui", "sans-serif"],
        hand: ["var(--font-hand)", "Dhivehi", "cursive"],
      },
      boxShadow: {
        soft: "0 14px 44px -14px rgba(3,14,20,0.65)",
        glow: "0 0 34px -8px rgba(159,227,208,0.35)",
      },
      keyframes: {
        drift: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        // Seamless horizontal scroll for an SVG that is two periods wide.
        waveX: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        // Plankton drifting up from the seabed with a lazy sway.
        floatUp: {
          "0%": { transform: "translate(0,0)", opacity: "0" },
          "10%": { opacity: "0.7" },
          "50%": { transform: "translate(18px,-55vh)" },
          "90%": { opacity: "0.5" },
          "100%": { transform: "translate(-10px,-108vh)", opacity: "0" },
        },
        breathe: {
          "0%,100%": { transform: "scale(1)", opacity: "0.8" },
          "50%": { transform: "scale(1.16)", opacity: "1" },
        },
        shimmer: { "0%": { backgroundPosition: "0% 0%" }, "100%": { backgroundPosition: "200% 0%" } },
        bob: {
          "0%,100%": { transform: "translateY(0) rotate(-2.5deg)" },
          "50%": { transform: "translateY(-10px) rotate(3deg)" },
        },
        twinkle: { "0%,100%": { opacity: "0.15" }, "50%": { opacity: "1" } },
        shoot: {
          "0%": { transform: "translateX(0)", opacity: "0" },
          "2%": { opacity: "1" },
          "9%": { transform: "translateX(-460px)", opacity: "0" },
          "100%": { transform: "translateX(-460px)", opacity: "0" },
        },
        sway: { "0%,100%": { transform: "rotate(-15deg)" }, "50%": { transform: "rotate(-8deg)" } },
        dash: { to: { strokeDashoffset: "-64" } },
        rain: { "0%": { transform: "translateY(0)", opacity: "0" }, "10%": { opacity: "1" }, "100%": { transform: "translateY(115vh)", opacity: "0.3" } },
        sail: { "0%": { transform: "translateX(-20vw) rotate(-8deg)" }, "50%": { transform: "translateX(50vw) translateY(-14px) rotate(6deg)" }, "100%": { transform: "translateX(120vw) rotate(-4deg)" } },
      },
      animation: {
        drift: "drift 6s ease-in-out infinite",
        wave1: "waveX 32s linear infinite",
        wave2: "waveX 48s linear infinite reverse",
        wave3: "waveX 64s linear infinite",
        floatup: "floatUp 20s linear infinite",
        breathe: "breathe 5s ease-in-out infinite",
        shimmer: "shimmer 14s linear infinite",
        bob: "bob 7s ease-in-out infinite",
        twinkle: "twinkle 4s ease-in-out infinite",
        shoot: "shoot 13s linear infinite 5s",
        sway: "sway 12s ease-in-out infinite",
        dash: "dash 6s linear infinite",
        rain: "rain 1.2s linear infinite",
        sail: "sail 5s ease-in-out forwards",
      },
    },
  },
  plugins: [],
};
export default config;
