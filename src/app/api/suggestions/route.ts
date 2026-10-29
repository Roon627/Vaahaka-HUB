import { readBody, BodyTooLarge } from "@/lib/request-body";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { admin, ConfigError } from "@/lib/fodibey/admin";
import { emit } from "@/lib/fodibey/events";

// Node runtime and never cached. The suggestions table is private: this route (server side) is the only way in.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS = ["idea", "bug", "thanks", "safety", "other"];
const reply = (status: number, body: unknown) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const err = (status: number, message: string) => reply(status, { error: { message } });
// strip control characters but keep newlines and tabs
const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max) : "");

/** Same-origin only: our own site (www or apex) or localhost. Other sites can't post here from a browser. */
function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser callers (curl) have no Origin; rate limits still apply
  try {
    const o = new URL(origin).host.replace(/^www\./, "");
    const mine = [req.headers.get("host") ?? "", new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ihusaas.online").host].map((h) => h.replace(/^www\./, ""));
    return mine.includes(o);
  } catch { return false; }
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return err(403, "Not allowed.");
  let raw: string;
  try { raw = await readBody(req, 8000); } catch (e) { return err(e instanceof BodyTooLarge ? 413 : 400, "Invalid or oversized request."); }
  let b: Record<string, unknown>;
  try { b = JSON.parse(raw); } catch { return err(400, "Bad request."); }

  if (!b || typeof b !== "object" || Array.isArray(b)) return err(400, "Bad request.");

  // Honeypot: real people never see or fill this field. Pretend it worked so bots learn nothing.
  if (typeof b.website === "string" && b.website.trim() !== "") return reply(200, { ok: true });

  const message = clean(b.message, 2000);
  const device = clean(b.device, 100);
  if (message.length < 5) return err(400, "Tell us a little more, a few words at least.");
  if (device.length < 16) return err(400, "Something went wrong. Please refresh and try again.");
  const kind = KINDS.includes(String(b.kind)) ? String(b.kind) : "other";
  const contact = clean(b.contact, 120);
  const page = clean(b.page, 120);

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  const ipHash = createHash("sha256").update(`${process.env.SUGGESTION_SALT ?? "ihusaas-suggestions"}|${ip}`).digest("hex").slice(0, 32);

  try {
    const { data, error } = await admin().rpc("send_suggestion", { p_kind: kind, p_message: message, p_contact: contact || null, p_page: page || null, p_device: device, p_ip_hash: ipHash });
    if (error) {
      // The function's own messages are written for people (rate limits, length); show them as they are.
      const limited = /few notes|a lot of notes|full for the moment/i.test(error.message);
      return err(limited ? 429 : 400, /P0001|Tell us|keep it under|few notes|a lot of notes|full for|invalid device/i.test(`${error.code} ${error.message}`) ? error.message : "Sorry, that didn't go through. Please try again.");
    }
    const row = (Array.isArray(data) ? data[0] : data) as { id: string; created_at: string } | null;
    // Straight to the Fodibey dashboard (signed webhook). Never blocks or fails the person's note: Fodibey can also poll /suggestions.
    await Promise.race([
      emit("suggestion.created", { id: row?.id, created_at: row?.created_at, kind, message, contact: contact || null, page: page || null }),
      new Promise((r) => setTimeout(r, 1500)),
    ]);
    return reply(200, { ok: true });
  } catch (e) {
    if (e instanceof ConfigError) return err(503, "The suggestion box isn't switched on yet. Please try again later.");
    console.error("suggestion request failed");
    return err(500, "Sorry, something went wrong. Please try again.");
  }
}
