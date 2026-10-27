import "server-only";
import { NextResponse } from "next/server";
import { admin, ConfigError } from "./admin";
import { authenticate, safeEqual } from "./auth";
import { emit, scrub } from "./events";
import { openapi } from "./openapi";
import { HELPLINES } from "@/lib/helplines";

/**
 * Fodibey API v1: one small router instead of dozens of route files.
 * Mounted at /api/fodibey/v1/* by src/app/api/fodibey/v1/[[...path]]/route.ts.
 * Contract + examples: docs/fodibey-api.md and GET /api/fodibey/v1/openapi.json
 */

type Method = "GET" | "POST" | "PATCH" | "DELETE";
interface Ctx { req: Request; url: URL; params: Record<string, string>; actor: string; body: () => Promise<any> }
type Handler = (c: Ctx) => Promise<Response>;

const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
const fail = (status: number, code: string, message: string) => json({ error: { code, message } }, status);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const int = (v: string | null, d: number, min: number, max: number) => Math.min(max, Math.max(min, Number.parseInt(v ?? "", 10) || d));

async function audit(actor: string, action: string, targetType: string, targetId: string | null, detail: Record<string, unknown> = {}) {
  await admin().from("moderation_log").insert({ actor, action, target_type: targetType, target_id: targetId, detail });
  void emit("moderation.action", { actor, action, target_type: targetType, target_id: targetId, ...detail });
}

const table = (t: string) => (t === "post" ? "posts" : "comments");

// ----------------------------------------------------------------------------- handlers
/**
 * 200 = the API is reachable and your key is valid. `database` says whether data endpoints will work:
 *   "ok" | "not_configured" (SUPABASE_SERVICE_ROLE_KEY missing on the server) | "error" (database unreachable, 503).
 * A dashboard can therefore tell "Ihusaas is down" apart from "Ihusaas needs its database key".
 */
const health: Handler = async () => {
  const base = { service: "ihusaas", api: "fodibey/v1", time: new Date().toISOString() };
  let db: "ok" | "not_configured" | "error" = "ok";
  try {
    const { error } = await admin().from("posts").select("id", { head: true, count: "exact" }).limit(1);
    if (error) db = "error";
  } catch (e) {
    if (e instanceof ConfigError) db = "not_configured"; else db = "error";
  }
  return json({ ok: db !== "error", ...base, database: db, ...(db === "not_configured" ? { hint: "Set SUPABASE_SERVICE_ROLE_KEY on the server (scripts/set-server-secret.sh)." } : {}) }, db === "error" ? 503 : 200);
};

const stats: Handler = async () => {
  const db = admin();
  const count = async (q: any) => (await q).count ?? 0;
  const head = (t: string) => db.from(t).select("id", { count: "exact", head: true });
  const since = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
  const cats = ["horror", "sad", "vent", "secrets", "nostalgia", "work", "relationships"];

  const [posts, hiddenPosts, comments, hiddenComments, openReports, openSelfHarm, p24, p7, c24, byCat, atolls, react] = await Promise.all([
    count(head("posts").eq("is_hidden", false)), count(head("posts").eq("is_hidden", true)),
    count(head("comments").eq("is_hidden", false)), count(head("comments").eq("is_hidden", true)),
    count(head("reports").eq("status", "open")), count(head("reports").eq("status", "open").eq("reason", "self_harm")),
    count(head("posts").gte("created_at", since(24))), count(head("posts").gte("created_at", since(24 * 7))),
    count(head("comments").gte("created_at", since(24))),
    Promise.all(cats.map(async (c) => [c, await count(head("posts").eq("is_hidden", false).eq("category", c))] as const)),
    db.rpc("atoll_counts", { p_category: null }),
    // Fine to sum client-side at launch scale; move to a SQL function once there are ~100k posts.
    db.from("posts").select("felt_count,heart_count,listening_count").eq("is_hidden", false).limit(5000),
  ]);
  const r = (react.data ?? []) as { felt_count: number; heart_count: number; listening_count: number }[];
  return json({
    posts: { visible: posts, hidden: hiddenPosts, last_24h: p24, last_7d: p7 },
    comments: { visible: comments, hidden: hiddenComments, last_24h: c24 },
    reports: { open: openReports, open_self_harm: openSelfHarm },
    reactions: { felt: r.reduce((a, x) => a + x.felt_count, 0), heart: r.reduce((a, x) => a + x.heart_count, 0), listening: r.reduce((a, x) => a + x.listening_count, 0), sampled_posts: r.length },
    by_category: Object.fromEntries(byCat),
    by_atoll: Object.fromEntries(((atolls.data ?? []) as { atoll_code: string; total: number | string }[]).map((a) => [a.atoll_code, Number(a.total)])),
  });
};

const listReports: Handler = async ({ url }) => {
  const db = admin();
  const limit = int(url.searchParams.get("limit"), 50, 1, 200);
  let q = db.from("reports").select("id,created_at,reason,status,post_id,comment_id,resolved_at").order("created_at", { ascending: false }).limit(limit + 1);
  const status = url.searchParams.get("status") ?? "open";
  if (status !== "all") q = q.eq("status", status);
  const reason = url.searchParams.get("reason"); if (reason) q = q.eq("reason", reason);
  const target = url.searchParams.get("target");
  if (target === "post") q = q.not("post_id", "is", null);
  if (target === "comment") q = q.not("comment_id", "is", null);
  const cursor = url.searchParams.get("cursor"); if (cursor) q = q.lt("created_at", cursor);
  const { data, error } = await q;
  if (error) return fail(500, "db_error", error.message);

  const rows = data ?? [];
  const page = rows.slice(0, limit);
  const postIds = [...new Set(page.map((r) => r.post_id).filter(Boolean))] as string[];
  const commentIds = [...new Set(page.map((r) => r.comment_id).filter(Boolean))] as string[];
  const [posts, comments] = await Promise.all([
    postIds.length ? db.from("posts").select("id,body,category,atoll_code,island,is_hidden,report_count,created_at").in("id", postIds) : { data: [] },
    commentIds.length ? db.from("comments").select("id,post_id,body,is_hidden,report_count,created_at").in("id", commentIds) : { data: [] },
  ]);
  const P = new Map((posts.data ?? []).map((p: any) => [p.id, p]));
  const C = new Map((comments.data ?? []).map((c: any) => [c.id, c]));
  return json({
    items: page.map((r) => ({
      id: r.id, created_at: r.created_at, reason: r.reason, status: r.status, resolved_at: r.resolved_at,
      target: r.post_id ? { type: "post", id: r.post_id, content: P.get(r.post_id) ?? null } : { type: "comment", id: r.comment_id, content: C.get(r.comment_id!) ?? null },
    })),
    next_cursor: rows.length > limit ? page[page.length - 1].created_at : null,
  });
};

/** actions: hide · dismiss (restores if auto-hidden) · delete · acknowledge (handled, content untouched, e.g. a self-harm follow-up) */
const resolveReport: Handler = async ({ params, actor, body }) => {
  if (!UUID.test(params.id)) return fail(400, "bad_id", "Report id must be a UUID.");
  const { action, note } = (await body()) ?? {};
  if (!["hide", "dismiss", "delete", "acknowledge"].includes(action)) return fail(400, "bad_action", "action must be one of: hide, dismiss, delete, acknowledge.");
  const db = admin();
  const { data: rep } = await db.from("reports").select("id,post_id,comment_id").eq("id", params.id).maybeSingle();
  if (!rep) return fail(404, "not_found", "No such report.");
  const type = rep.post_id ? "post" : "comment";
  const id = (rep.post_id ?? rep.comment_id) as string;
  const col = type === "post" ? "post_id" : "comment_id";
  const now = new Date().toISOString();

  if (action === "hide") {
    await db.from(table(type)).update({ is_hidden: true }).eq("id", id);
    await db.from("reports").update({ status: "actioned", resolved_at: now }).eq(col, id).eq("status", "open");
  } else if (action === "dismiss") {
    await db.from("reports").update({ status: "dismissed", resolved_at: now }).eq(col, id).eq("status", "open");
    await db.from(table(type)).update({ is_hidden: false, report_count: 0 }).eq("id", id); // restore anything auto-hidden pending review
  } else if (action === "acknowledge") {
    await db.from("reports").update({ status: "actioned", resolved_at: now }).eq(col, id).eq("status", "open");
  } else {
    await db.from(table(type)).delete().eq("id", id); // reports cascade
  }
  await audit(actor, `report.${action}`, type, id, { report_id: params.id, note: typeof note === "string" ? note.slice(0, 500) : undefined });
  return json({ ok: true, action, target: { type, id } });
};

const listContent = (type: "post" | "comment"): Handler => async ({ url }) => {
  const limit = int(url.searchParams.get("limit"), 50, 1, 200);
  const cols = type === "post"
    ? "id,created_at,body,category,trigger_warning,atoll_code,island,felt_count,heart_count,listening_count,comment_count,report_count,is_hidden"
    : "id,post_id,created_at,body,report_count,is_hidden";
  let q = admin().from(table(type)).select(cols).order("created_at", { ascending: false }).limit(limit + 1);
  const hidden = url.searchParams.get("hidden"); if (hidden === "true" || hidden === "false") q = q.eq("is_hidden", hidden === "true");
  const cursor = url.searchParams.get("cursor"); if (cursor) q = q.lt("created_at", cursor);
  const text = url.searchParams.get("q"); if (text) q = q.ilike("body", `%${text.replace(/[%_]/g, "")}%`);
  if (type === "post") {
    const cat = url.searchParams.get("category"); if (cat) q = q.eq("category", cat);
    const atoll = url.searchParams.get("atoll"); if (atoll) q = q.eq("atoll_code", atoll);
  } else {
    const pid = url.searchParams.get("post_id"); if (pid) q = q.eq("post_id", pid);
  }
  const { data, error } = await q;
  if (error) return fail(500, "db_error", error.message);
  const rows = (data ?? []) as unknown as Record<string, any>[];
  return json({ items: rows.slice(0, limit), next_cursor: rows.length > limit ? rows[limit - 1].created_at : null });
};

const patchContent = (type: "post" | "comment"): Handler => async ({ params, actor, body }) => {
  if (!UUID.test(params.id)) return fail(400, "bad_id", "Id must be a UUID.");
  const b = (await body()) ?? {};
  if (typeof b.is_hidden !== "boolean") return fail(400, "bad_body", "Send { \"is_hidden\": true|false }.");
  const { data, error } = await admin().from(table(type)).update({ is_hidden: b.is_hidden }).eq("id", params.id).select("id,is_hidden").maybeSingle();
  if (error) return fail(500, "db_error", error.message);
  if (!data) return fail(404, "not_found", `No such ${type}.`);
  await audit(actor, b.is_hidden ? `${type}.hide` : `${type}.unhide`, type, params.id);
  return json(data);
};

const deleteContent = (type: "post" | "comment"): Handler => async ({ params, actor }) => {
  if (!UUID.test(params.id)) return fail(400, "bad_id", "Id must be a UUID.");
  const { error } = await admin().from(table(type)).delete().eq("id", params.id);
  if (error) return fail(500, "db_error", error.message);
  await audit(actor, `${type}.delete`, type, params.id);
  return json({ ok: true });
};

const listTerms: Handler = async () => {
  const { data, error } = await admin().from("blocked_terms").select("id,term,lang,scope,mode,note,created_at").order("created_at", { ascending: false }).limit(2000);
  return error ? fail(500, "db_error", error.message) : json({ items: data });
};

/** Single { term } or bulk { terms: [...] } (max 500). Patterns are compiled by a database trigger. */
const addTerms: Handler = async ({ actor, body }) => {
  const b = (await body()) ?? {};
  const list: any[] = Array.isArray(b.terms) ? b.terms : b.term ? [b] : [];
  if (!list.length || list.length > 500) return fail(400, "bad_body", "Send { term, lang?, scope?, mode?, note? } or { terms: [...] } with up to 500 entries.");
  const rows: any[] = [];
  for (const t of list) {
    const term = String(t.term ?? "").trim();
    const lang = t.lang ?? "en", scope = t.scope ?? "comments", mode = t.mode ?? "word";
    if (term.length < 2 || term.length > 60) return fail(400, "bad_term", `"${term.slice(0, 20)}": terms need 2–60 characters.`);
    if (!["en", "dv", "dv-latin", "any"].includes(lang)) return fail(400, "bad_lang", "lang must be en, dv, dv-latin or any.");
    if (!["comments", "all"].includes(scope)) return fail(400, "bad_scope", "scope must be comments or all.");
    if (!["word", "anywhere"].includes(mode)) return fail(400, "bad_mode", "mode must be word or anywhere.");
    rows.push({ term, lang, scope, mode, note: t.note ? String(t.note).slice(0, 200) : null });
  }
  const { data, error } = await admin().from("blocked_terms").upsert(rows, { onConflict: "term,lang", ignoreDuplicates: true }).select("id");
  if (error) return fail(500, "db_error", error.message);
  await audit(actor, "blocked_terms.add", "blocked_term", null, { requested: rows.length, added: data?.length ?? 0 });
  return json({ ok: true, requested: rows.length, added: data?.length ?? 0 }, 201);
};

const deleteTerm: Handler = async ({ params, actor }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id)) return fail(400, "bad_id", "Id must be an integer.");
  const { error } = await admin().from("blocked_terms").delete().eq("id", id);
  if (error) return fail(500, "db_error", error.message);
  await audit(actor, "blocked_terms.delete", "blocked_term", String(id));
  return json({ ok: true });
};

const check: Handler = async ({ body }) => {
  const { text, scope } = (await body()) ?? {};
  if (typeof text !== "string" || !text) return fail(400, "bad_body", "Send { text, scope?: 'comments'|'posts' }.");
  const { data, error } = await admin().rpc("check_blocked", { p_text: text, p_scope: scope === "posts" ? "posts" : "comments" });
  return error ? fail(500, "db_error", error.message) : json({ blocked: !!data });
};

const log: Handler = async ({ url }) => {
  const limit = int(url.searchParams.get("limit"), 100, 1, 500);
  const { data, error } = await admin().from("moderation_log").select("*").order("at", { ascending: false }).limit(limit);
  return error ? fail(500, "db_error", error.message) : json({ items: data });
};

/**
 * Supabase Database Webhook -> Fodibey. In the Supabase dashboard (Database → Webhooks) point INSERT/UPDATE
 * webhooks on posts, comments and reports at POST /api/fodibey/v1/relay with header
 * `x-relay-secret: $FODIBEY_RELAY_SECRET`. We scrub device tokens and forward it, signed, to FODIBEY_WEBHOOK_URL.
 */
const relay: Handler = async ({ req, body }) => {
  const secret = process.env.FODIBEY_RELAY_SECRET;
  if (!secret) return fail(503, "relay_disabled", "FODIBEY_RELAY_SECRET is not set.");
  if (!safeEqual(req.headers.get("x-relay-secret") ?? "", secret)) return fail(401, "unauthorized", "Bad relay secret.");
  const p = (await body()) ?? {};
  if (!p.table || !p.type) return fail(400, "bad_body", "Expected a Supabase webhook payload.");
  const rec = (r: unknown) => (r && typeof r === "object" ? scrub(r as Record<string, unknown>) : null);
  void emit(`db.${String(p.table)}.${String(p.type).toLowerCase()}`, { record: rec(p.record), old_record: rec(p.old_record) });
  return json({ ok: true }, 202);
};

// ----------------------------------------------------------------------------- routing
interface Route { method: Method; path: string; handler: Handler; auth?: boolean }
const ROUTES: Route[] = [
  { method: "GET", path: "openapi.json", handler: async () => json(openapi()), auth: false },
  { method: "POST", path: "relay", handler: relay, auth: false }, // has its own shared-secret check
  { method: "GET", path: "health", handler: health },
  { method: "GET", path: "stats", handler: stats },
  { method: "GET", path: "reports", handler: listReports },
  { method: "POST", path: "reports/:id/resolve", handler: resolveReport },
  { method: "GET", path: "posts", handler: listContent("post") },
  { method: "PATCH", path: "posts/:id", handler: patchContent("post") },
  { method: "DELETE", path: "posts/:id", handler: deleteContent("post") },
  { method: "GET", path: "comments", handler: listContent("comment") },
  { method: "PATCH", path: "comments/:id", handler: patchContent("comment") },
  { method: "DELETE", path: "comments/:id", handler: deleteContent("comment") },
  { method: "GET", path: "blocked-terms", handler: listTerms },
  { method: "POST", path: "blocked-terms", handler: addTerms },
  { method: "DELETE", path: "blocked-terms/:id", handler: deleteTerm },
  { method: "POST", path: "moderation/check", handler: check },
  { method: "GET", path: "moderation-log", handler: log },
  { method: "GET", path: "helplines", handler: async () => json({ items: HELPLINES }) },
];

function match(method: string, seg: string[]): { route: Route; params: Record<string, string> } | "method" | null {
  let pathHit = false;
  for (const r of ROUTES) {
    const parts = r.path.split("/");
    if (parts.length !== seg.length) continue;
    const params: Record<string, string> = {};
    if (!parts.every((p, i) => (p.startsWith(":") ? ((params[p.slice(1)] = decodeURIComponent(seg[i])), true) : p === seg[i]))) continue;
    pathHit = true;
    if (r.method === method) return { route: r, params };
  }
  return pathHit ? "method" : null;
}

/** CORS is opt-in (FODIBEY_ALLOWED_ORIGINS). Prefer server-to-server calls: never ship the API key to a browser. */
function cors(req: Request, res: Response): Response {
  const origin = req.headers.get("origin");
  const allowed = (process.env.FODIBEY_ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (origin && allowed.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Headers", "authorization, content-type, x-fodibey-actor, x-fodibey-key");
    res.headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    res.headers.append("Vary", "Origin");
  }
  return res;
}

export async function handle(req: Request, path: string[] | undefined): Promise<Response> {
  if (req.method === "OPTIONS") return cors(req, new Response(null, { status: 204 }));
  const seg = path ?? [];
  const hit = match(req.method, seg);
  if (hit === null) return cors(req, fail(404, "not_found", "Unknown endpoint. See /api/fodibey/v1/openapi.json."));
  if (hit === "method") return cors(req, fail(405, "method_not_allowed", "Method not allowed for this endpoint."));

  let actor = "relay";
  if (hit.route.auth !== false) {
    const a = authenticate(req);
    if (!a.ok) return cors(req, fail(a.status, a.code, a.message));
    actor = a.actor;
  }
  try {
    const body = async () => { try { return await req.json(); } catch { return null; } };
    return cors(req, await hit.route.handler({ req, url: new URL(req.url), params: hit.params, actor, body }));
  } catch (e) {
    if (e instanceof ConfigError) return cors(req, fail(503, "not_configured", e.message));
    console.error("fodibey api error", e);
    return cors(req, fail(500, "internal_error", "Something went wrong."));
  }
}
