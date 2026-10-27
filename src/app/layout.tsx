import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Raalhu — say it out loud, anonymously",
  description: "An anonymous confession space for Maldivians. No accounts. No judgment.",
};
export const viewport: Viewport = { themeColor: "#04090f" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-abyss antialiased">
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
