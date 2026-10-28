# Fodibey dashboard: handoff brief

Paste this file (and `docs/fodibey-api.md`) into the chat where you build the Fodibey side.
Everything Ihusaas needs is already built and deployed with the app. Fodibey only has to **call the API** and **show a dashboard**.

---

## 1. What already exists in Ihusaas

| Piece | Where |
|---|---|
| REST API for moderation + stats | `https://ihusaas.online/api/fodibey/v1/*` (code: `src/lib/fodibey/`) |
| OpenAPI 3 contract (generate a typed client from it) | `GET https://ihusaas.online/api/fodibey/v1/openapi.json` |
| Full endpoint reference + examples | `docs/fodibey-api.md` |
| Smoke test | `FODIBEY_API_KEY=… ./scripts/fodibey-smoke.sh https://ihusaas.online` |
| Database tables the API manages | `posts`, `comments`, `reports`, `blocked_terms`, `moderation_log` (Supabase) |

Status: auth, validation, routing, relay and OpenAPI were tested against a production build. The suggestions inbox (§3.6a) was tested end to end against the live database.
The data endpoints need `SUPABASE_SERVICE_ROLE_KEY` set and **have not been run against live data yet**. Run the smoke test once keys are in place.

## 2. Connect it (one-time setup)

On the **Ihusaas** host (e.g. Vercel → Settings → Environment Variables), server-side only, never `NEXT_PUBLIC_`:

```
SUPABASE_SERVICE_ROLE_KEY=<Supabase → Project Settings → API → service_role>
FODIBEY_API_KEY=<openssl rand -hex 32>           # Fodibey sends this as a Bearer token
# optional, for push events:
FODIBEY_WEBHOOK_URL=https://<fodibey>/webhooks/ihusaas
FODIBEY_WEBHOOK_SECRET=<openssl rand -hex 32>
FODIBEY_RELAY_SECRET=<openssl rand -hex 32>
```

On **Fodibey** (server env):

```
IHUSAAS_API_BASE=https://ihusaas.online/api/fodibey/v1
IHUSAAS_API_KEY=<same value as FODIBEY_API_KEY>
IHUSAAS_WEBHOOK_SECRET=<same value as FODIBEY_WEBHOOK_SECRET>
```

Every request from Fodibey:

```
X-Fodibey-Key: $IHUSAAS_API_KEY            # NOT "Authorization: Bearer": the cPanel host strips that header
X-Fodibey-Actor: <moderator id or email>      # shows up in the audit log
```

**Call the API from Fodibey's server, never from the browser.** The key must not reach a user's device.

## 2b. Gotchas found while testing the live server
* Always call **`https://`**. Plain `http://` returns an HTML "301 Moved Permanently" page, which a JSON client reports as "unreadable response".
* `GET /health` returns **200** with `database: "ok" | "not_configured" | "error"`. If it says `not_configured`, the server still needs `SUPABASE_SERVICE_ROLE_KEY`
  (`./scripts/set-server-secret.sh SUPABASE_SERVICE_ROLE_KEY`), and data endpoints (`/stats`, `/reports`…) answer 503 JSON until then. `/helplines` and `/openapi.json` work without it.
* Until the HTTPS certificate is valid, a strict HTTPS client fails the TLS handshake. See `docs/HOSTING_CPANEL.md` §4.

## 3. Dashboard to build: screens and the calls behind them

### 3.1 Overview (home)
`GET /stats` → cards: letters (visible / hidden / 24h / 7d), notes, **open reports**, **open self-harm flags** (highlight in red),
reactions totals, a bar chart by mood (`by_category`), a table or map by atoll (`by_atoll`). Refresh every 60s.

### 3.2 Safety queue (most important screen)
`GET /reports?status=open&reason=self_harm` shown **first and separately**, then `GET /reports?status=open`.
Each row: reason, age, target type, the reported text (`target.content.body`), how many reports.
Actions → `POST /reports/{id}/resolve` with:
- `hide`: take it down
- `dismiss`: false alarm (also restores content that was auto-hidden)
- `delete`: permanent
- `acknowledge`: for self-harm flags: "someone followed up", content untouched

Confirm before `delete`. After each action, re-fetch the queue. Paginate with `next_cursor`.

### 3.3 Content browser
`GET /posts?hidden=true|false&category=&atoll=&q=` and `GET /comments?post_id=&hidden=&q=`.
Row actions: `PATCH /posts/{id}` / `PATCH /comments/{id}` `{ "is_hidden": true|false }`, `DELETE …`.

### 3.4 Word filter (English + Dhivehi)
`GET /blocked-terms` table (term, lang, scope, mode, note) · add form `POST /blocked-terms` (bulk paste supported, ≤500) · delete.
Add a **"Test a sentence" box** → `POST /moderation/check {text, scope}` → shows blocked / allowed.
Explain in the UI: `scope: comments` = notes only; `scope: all` = also letters (slurs only). `mode: anywhere` only for terms that can't appear inside normal words.
**Priority task for launch:** native Dhivehi speakers extend the starter list (Thaana and Latin spellings).

### 3.5 Audit log
`GET /moderation-log?limit=100`: who did what, when. Read-only.

### 3.6a Suggestions inbox (new)
`GET /suggestions` (default = `new`) → a simple inbox: kind chip (💡 idea · 🐛 bug · 💌 thanks · 🛟 safety · 🌊 other), the message, `page` they were on, time, and the reply `contact` **only if present** (most are anonymous).
Actions: `PATCH /suggestions/{id}` `{status: read|planned|done|archived, note}` and `DELETE`. Show a **badge** from `GET /stats` → `suggestions.new`.
Put `safety` kind first and highlight it; those notes are not read in real time. Live push: handle the `suggestion.created` webhook event (same signature check as §4).
Don't try to identify writers; if they left a `contact`, a short, kind reply is enough.

### 3.6 Helplines (read-only for now)
`GET /helplines`: show with "last checked" date. (Editing would need a new endpoint and a DB table; not built yet.)

## 4. Optional: live events into Fodibey
- Moderator actions already push `moderation.action` to `FODIBEY_WEBHOOK_URL`.
- For new letters / notes / reports: in **Supabase → Database → Webhooks**, add INSERT webhooks on `posts`, `comments`, `reports` →
  `POST https://ihusaas.online/api/fodibey/v1/relay` with header `x-relay-secret: <FODIBEY_RELAY_SECRET>`.
- On Fodibey, verify every event: `X-Fodibey-Signature == "sha256=" + HMAC_SHA256(secret, X-Fodibey-Timestamp + "." + rawBody)`
  and reject timestamps older than 5 minutes. Use events to show a live badge on the Safety queue, or alert on self-harm reports.
- No push set up? Just poll `GET /reports?status=open` every minute.
- New suggestions arrive as a `suggestion.created` event the moment someone sends a note (no Supabase webhook needed). Or poll `GET /suggestions`.

## 5. Rules for the dashboard (these are sensitive people)
- Device tokens are never returned. Don't try to identify writers. Don't export letters.
- Moderators need a login on Fodibey's side (the API key is Fodibey's, not a person's). Pass their id in `X-Fodibey-Actor`.
- Self-harm reports are about care, not punishment: `acknowledge` after a follow-up, don't hide by default.
- Show content warnings in the queue (letters can be heavy). Blur reported text until the moderator clicks to reveal.

## 6. Prompt to start the other chat
> I'm building the Fodibey admin dashboard for Ihusaas. Here are the API docs (docs/fodibey-api.md) and this handoff brief.
> Generate a typed client from https://ihusaas.online/api/fodibey/v1/openapi.json, keep the API key server-side,
> and build these screens: Overview, Safety queue (self-harm first), Content browser, Word filter with a test box, Audit log.
