/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://*.supabase.co",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.open-meteo.com",
              "media-src 'self' blob: data:",
              "object-src 'none'",
              "base-uri 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] },
      { source: "/manifest.webmanifest", headers: [{ key: "Cache-Control", value: "no-cache, must-revalidate" }] },
    ];
  },
  // Lets a production build live beside the dev server's folder (NEXT_DIST_DIR=.next-prod next build),
  // so building never corrupts a running `next dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // NEXT_OUTPUT=standalone bundles only what the server needs (own node_modules, ~tens of MB) so it can be
  // uploaded to shared hosting without running npm install or a build there. See scripts/deploy-cpanel.sh.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  // Certificate-validation files from the host (see src/app/api/dcv): served by the app because it owns every URL.
  async rewrites() {
    return [{ source: "/.well-known/:dir/:file", destination: "/api/dcv/:dir/:file" }];
  },
};
export default nextConfig;
