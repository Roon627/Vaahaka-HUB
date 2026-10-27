import type { MetadataRoute } from "next";

/** Web app manifest -> served at /manifest.webmanifest. Makes the site installable. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Ihusaas",
    short_name: "Ihusaas",
    description: "A quiet, anonymous place for Maldivians to set down what they're carrying. Seal it in a bottle. Let the sea listen.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a1c26",
    theme_color: "#0c2330",
    lang: "en",
    categories: ["lifestyle", "social", "health"],
    icons: [
      { src: "/brand/png/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/png/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/png/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/brand/png/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Long-press the home-screen icon for these (handled in SeaProvider / the /help page).
    shortcuts: [
      { name: "Write a letter", short_name: "Write", url: "/?write=1", icons: [{ src: "/brand/png/icon-192.png", sizes: "192x192" }] },
      { name: "Open a random bottle", short_name: "Surprise", url: "/?surprise=1", icons: [{ src: "/brand/png/icon-192.png", sizes: "192x192" }] },
      { name: "Get help now", short_name: "Help", url: "/help", icons: [{ src: "/brand/png/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
