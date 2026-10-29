import "server-only";
import { sign } from "./auth";

/**
 * Push an event to Fodibey (best effort, never blocks or fails the caller).
 *   POST FODIBEY_WEBHOOK_URL
 *   X-Fodibey-Event: report.created        X-Fodibey-Timestamp: <unix seconds>
 *   X-Fodibey-Signature: sha256=<hmac of "<timestamp>.<raw body>" with FODIBEY_WEBHOOK_SECRET>
 * Reject events with an old timestamp on the Fodibey side to stop replays.
 * Payloads NEVER include device tokens.
 */
export async function emit(type: string, data: unknown): Promise<void> {
  const url = process.env.FODIBEY_WEBHOOK_URL;
  if (!url) return;
  const body = JSON.stringify({ type, at: new Date().toISOString(), data });
  const ts = String(Math.floor(Date.now() / 1000));
  const secret = process.env.FODIBEY_WEBHOOK_SECRET;
  try {
    await fetch(url, {
      method: "POST",
      redirect: "error",
      headers: {
        "content-type": "application/json",
        "x-fodibey-event": type,
        "x-fodibey-timestamp": ts,
        ...(secret ? { "x-fodibey-signature": sign(secret, ts, body) } : {}),
      },
      body,
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    /* Fodibey being down must never break moderation */
  }
}

/** Strip anything private from a database row before it leaves this server. */
export function scrub<T extends Record<string, unknown>>(row: T): Omit<T, "device_token" | "ip_hash"> {
  const { device_token: _drop, ip_hash: _drop2, ...rest } = row;
  return rest;
}
