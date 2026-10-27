import "server-only";

/** OpenAPI 3.0 description of the Fodibey API. Served at /api/fodibey/v1/openapi.json. */
export function openapi() {
  const ref = (n: string) => ({ $ref: `#/components/schemas/${n}` });
  const ok = (schema: object, description = "OK") => ({ "200": { description, content: { "application/json": { schema } } } });
  const id = { name: "id", in: "path", required: true, schema: { type: "string" } };
  const paged = [
    { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 200, default: 50 } },
    { name: "cursor", in: "query", description: "`next_cursor` from the previous page (a created_at timestamp).", schema: { type: "string" } },
  ];
  const q = (name: string, description: string, schema: object = { type: "string" }) => ({ name, in: "query", description, schema });

  return {
    openapi: "3.0.3",
    info: { title: "Ihusaas × Fodibey API", version: "1.0.0", description: "Moderation + analytics API for the Fodibey dashboard. Authenticate with `Authorization: Bearer <FODIBEY_API_KEY>` or, if a proxy strips that header (the cPanel host does), `X-Fodibey-Key: <FODIBEY_API_KEY>`. Optionally send `X-Fodibey-Actor: <moderator id>` so actions are attributed in the audit log. No endpoint ever returns device tokens." },
    servers: [{ url: "/api/fodibey/v1" }],
    security: [{ bearer: [] }, { fodibeyKey: [] }],
    components: {
      securitySchemes: { bearer: { type: "http", scheme: "bearer" }, fodibeyKey: { type: "apiKey", in: "header", name: "X-Fodibey-Key", description: "Same key as the bearer token. Use this if your host strips the Authorization header." } },
      schemas: {
        Error: { type: "object", properties: { error: { type: "object", properties: { code: { type: "string" }, message: { type: "string" } } } } },
        Report: { type: "object", properties: { id: { type: "string", format: "uuid" }, created_at: { type: "string", format: "date-time" }, reason: { type: "string", enum: ["rude", "hate", "self_harm", "spam", "privacy", "other"] }, status: { type: "string", enum: ["open", "actioned", "dismissed"] }, resolved_at: { type: "string", format: "date-time", nullable: true }, target: { type: "object", properties: { type: { type: "string", enum: ["post", "comment"] }, id: { type: "string", format: "uuid" }, content: { type: "object", nullable: true } } } } },
        BlockedTerm: { type: "object", properties: { id: { type: "integer" }, term: { type: "string" }, lang: { type: "string", enum: ["en", "dv", "dv-latin", "any"] }, scope: { type: "string", enum: ["comments", "all"], description: "`all` = also enforced on posts (use for slurs)." }, mode: { type: "string", enum: ["word", "anywhere"] }, note: { type: "string", nullable: true } } },
      },
    },
    paths: {
      "/health": { get: { summary: "Liveness + database check", responses: ok({ type: "object" }) } },
      "/stats": { get: { summary: "Counts for the dashboard home (posts, comments, open reports, by category, by atoll)", responses: ok({ type: "object" }) } },
      "/reports": { get: { summary: "Reports queue with the reported content attached", parameters: [q("status", "open (default), actioned, dismissed or all"), q("target", "post | comment"), q("reason", "rude | hate | self_harm | spam | privacy | other"), ...paged], responses: ok({ type: "object", properties: { items: { type: "array", items: ref("Report") }, next_cursor: { type: "string", nullable: true } } }) } },
      "/reports/{id}/resolve": { post: { summary: "Act on a report", description: "hide · dismiss (restores content that was auto-hidden) · delete · acknowledge (handled; content untouched, e.g. after following up a self-harm report).", parameters: [id], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["action"], properties: { action: { type: "string", enum: ["hide", "dismiss", "delete", "acknowledge"] }, note: { type: "string" } } } } } }, responses: ok({ type: "object" }) } },
      "/posts": { get: { summary: "List posts (including hidden)", parameters: [q("hidden", "true | false"), q("category", "mood id"), q("atoll", "atoll code"), q("q", "substring search in the body"), ...paged], responses: ok({ type: "object" }) } },
      "/posts/{id}": {
        patch: { summary: "Hide or unhide a post", parameters: [id], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["is_hidden"], properties: { is_hidden: { type: "boolean" } } } } } }, responses: ok({ type: "object" }) },
        delete: { summary: "Permanently delete a post (and its comments + reports)", parameters: [id], responses: ok({ type: "object" }) },
      },
      "/comments": { get: { summary: "List comments (including hidden)", parameters: [q("hidden", "true | false"), q("post_id", "only comments on this post"), q("q", "substring search"), ...paged], responses: ok({ type: "object" }) } },
      "/comments/{id}": {
        patch: { summary: "Hide or unhide a comment", parameters: [id], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["is_hidden"], properties: { is_hidden: { type: "boolean" } } } } } }, responses: ok({ type: "object" }) },
        delete: { summary: "Permanently delete a comment", parameters: [id], responses: ok({ type: "object" }) },
      },
      "/blocked-terms": {
        get: { summary: "List blocked words/phrases (English + Dhivehi)", responses: ok({ type: "object", properties: { items: { type: "array", items: ref("BlockedTerm") } } }) },
        post: { summary: "Add one term or up to 500 (duplicates are ignored)", description: "Patterns compile automatically in the database; they tolerate repeated letters and leetspeak, and `mode: anywhere` also matches inside words and across separators. Thaana and Latin-script Dhivehi are both supported.", requestBody: { required: true, content: { "application/json": { schema: { oneOf: [ref("BlockedTerm"), { type: "object", properties: { terms: { type: "array", items: ref("BlockedTerm") } } }] } } } }, responses: { "201": { description: "Created" } } },
      },
      "/blocked-terms/{id}": { delete: { summary: "Remove a blocked term", parameters: [id], responses: ok({ type: "object" }) } },
      "/moderation/check": { post: { summary: "Would this text be blocked? Uses the exact same filter as the app.", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["text"], properties: { text: { type: "string" }, scope: { type: "string", enum: ["comments", "posts"] } } } } } }, responses: ok({ type: "object", properties: { blocked: { type: "boolean" } } }) } },
      "/moderation-log": { get: { summary: "Audit trail of moderator actions", parameters: [q("limit", "1–500", { type: "integer" })], responses: ok({ type: "object" }) } },
      "/helplines": { get: { summary: "The verified Maldives helplines the app shows (read-only for now)", responses: ok({ type: "object" }) } },
      "/relay": { post: { summary: "Database-webhook relay (called by Supabase, not by Fodibey)", description: "Authenticated with `x-relay-secret`. Scrubs device tokens and forwards the event, HMAC-signed, to FODIBEY_WEBHOOK_URL.", security: [], responses: { "202": { description: "Accepted" } } } },
    },
  };
}
