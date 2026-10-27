/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lets a production build live beside the dev server's folder (NEXT_DIST_DIR=.next-prod next build),
  // so building never corrupts a running `next dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};
export default nextConfig;
