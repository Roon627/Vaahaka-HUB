import type { Metadata, Viewport } from "next";
import { Caveat, Fraunces, Nunito } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Ocean from "@/components/Ocean";
import { SeaProvider } from "@/components/SeaProvider";
import PWA from "@/components/PWA";

// Soft, warm serif for stories + headings; rounded sans for UI.
const display = Fraunces({ subsets: ["latin"], variable: "--font-display", style: ["normal", "italic"] });
const sans = Nunito({ subsets: ["latin"], variable: "--font-sans" });
// Handwriting: only for the little human touches ("Dear sea,", sign-offs).
const hand = Caveat({ subsets: ["latin"], variable: "--font-hand" });

const title = "Ihusaas — say it to the sea";
const description = "A quiet, anonymous place for Maldivians to set down what they're carrying. Seal it in a bottle. Let the sea listen.";

export const metadata: Metadata = {
  // Always the canonical www host: the apex redirects, and a redirecting og:image / icon URL is dropped by iOS and chat apps.
  metadataBase: new URL("https://www.ihusaas.online"),
  title: { default: title, template: "%s · Ihusaas" },
  description,
  applicationName: "Ihusaas",
  appleWebApp: { capable: true, title: "Ihusaas", statusBarStyle: "default" },
  other: { "mobile-web-app-capable": "yes" },
  formatDetection: { telephone: false }, // we link helpline numbers explicitly; don't auto-link random digits
  openGraph: { type: "website", siteName: "Ihusaas", title, description, images: [{ url: "/brand/og-square.png", width: 1200, height: 1200, alt: "Ihusaas" }, { url: "/brand/og.png", width: 1200, height: 630, alt: "Ihusaas" }] },
  twitter: { card: "summary_large_image", title, description, images: ["/brand/og.png"] },
};
// viewportFit "cover" lets the scene run under the notch; safe-area insets keep controls clear of it.
export const viewport: Viewport = { themeColor: "#0c2330", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${display.variable} ${sans.variable} ${hand.variable}`}>
      <head>
        {/* Static, same-origin install metadata and opaque, versioned touch icons. */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" sizes="180x180" href="/pwa/ihusaas-install-180.png" />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <SeaProvider>
          <Ocean />
          <Nav />
          <PWA />
          {/* top padding clears the floating nav; bottom padding clears the mobile dock */}
          <main className="pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-[calc(3.5rem+env(safe-area-inset-top))] md:pb-0 md:pt-24">{children}</main>
        </SeaProvider>
      </body>
    </html>
  );
}
