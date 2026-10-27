/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
