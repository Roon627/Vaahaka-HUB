import { readFile } from "node:fs/promises";
import path from "node:path";

// Serves the host's HTTPS-certificate validation files (cPanel AutoSSL / ACME).
// The Node app answers every URL on this domain, so without this the host's own challenge files
// at /.well-known/pki-validation/<id>.txt would 404 and certificates could never be issued or renewed.
// next.config.mjs rewrites /.well-known/:dir/:file here.
//
// Locked down on purpose: only two directories, only plain file names (no dots except ".txt", no slashes,
// so no path traversal), read-only, text/plain.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DIRS = new Set(["pki-validation", "acme-challenge"]);
const NAME = /^[A-Za-z0-9_-]{8,128}(\.txt)?$/;

export async function GET(_req: Request, context: { params: Promise<{ dir: string; file: string }> }) {
  const params = await context.params;
  if (!DIRS.has(params.dir) || !NAME.test(params.file)) return new Response("Not found", { status: 404 });
  try {
    const body = await readFile(path.join(process.cwd(), ".well-known", params.dir, params.file), "utf8");
    return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
