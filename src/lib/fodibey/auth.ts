import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Fodibey authenticates with a bearer token (FODIBEY_API_KEY). Several keys may be listed, comma-separated,
 * so a key can be rotated without downtime. Comparison is constant-time (hashes are compared, so lengths
 * never leak). Keys live only in server env: never use a NEXT_PUBLIC_ prefix.
 */
const sha = (s: string) => createHash("sha256").update(s).digest();

export function configuredKeys(): Buffer[] {
  return (process.env.FODIBEY_API_KEY ?? "").split(",").map((k) => k.trim()).filter(Boolean).map(sha);
}

export type AuthResult = { ok: true; actor: string } | { ok: false; status: 401 | 503; code: string; message: string };

export function authenticate(req: Request): AuthResult {
  const keys = configuredKeys();
  if (keys.length === 0) return { ok: false, status: 503, code: "api_disabled", message: "The Fodibey API is not configured on this server (FODIBEY_API_KEY is unset)." };
  const m = /^Bearer\s+(.+)$/i.exec(req.headers.get("authorization") ?? "");
  const given = m ? sha(m[1].trim()) : null;
  if (!given || !keys.some((k) => timingSafeEqual(k, given))) return { ok: false, status: 401, code: "unauthorized", message: "Missing or invalid bearer token." };
  // Who clicked, for the audit log. Fodibey passes its own moderator id; never trusted for access decisions.
  const actor = (req.headers.get("x-fodibey-actor") ?? "fodibey").replace(/[^\w@.\- ]/g, "").slice(0, 80) || "fodibey";
  return { ok: true, actor };
}

export function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(sha(a), sha(b));
}

/** HMAC-SHA256 over `${timestamp}.${body}`: Fodibey verifies this to know an event really came from us. */
export function sign(secret: string, timestamp: string, body: string): string {
  return "sha256=" + createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}
