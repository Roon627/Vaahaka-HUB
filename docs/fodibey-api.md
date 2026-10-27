# Fodibey × Ihusaas API (v1)

A small REST API so a **Fodibey** dashboard can read stats, work the reports queue, hide/delete content and
manage the blocked-word list. Machine-readable contract: `GET /api/fodibey/v1/openapi.json` (generate a client from it).

Base URL: `https://ihusaas.online/api/fodibey/v1`

## 1. Turn it on (server environment only)

| Variable | What it is |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role`. **Secret.** Lets the API see hidden content. Never `NEXT_PUBLIC_`. |
| `FODIBEY_API_KEY` | The bearer token Fodibey sends. Make one: `openssl rand -hex 32`. Comma-separate two keys to rotate without downtime. |
| `FODIBEY_WEBHOOK_URL` / `FODIBEY_WEBHOOK_SECRET` | *Optional.* Where Ihusaas pushes events, and the secret that signs them. |
| `FODIBEY_RELAY_SECRET` | *Optional.* Shared secret for the Supabase Database Webhook → relay hop (below). |
| `FODIBEY_ALLOWED_ORIGINS` | *Optional.* Browser origins allowed to call the API. Prefer server-to-server; never put the key in browser code. |

If `FODIBEY_API_KEY` is unset the API answers `503 api_disabled`. Nothing is exposed by default.
Run `FODIBEY_API_KEY=… ./scripts/fodibey-smoke.sh https://ihusaas.online` to check it end to end.

## 2. Calling it

> **Important on the cPanel host:** its web server strips the `Authorization` header, so a bearer token never arrives.
> Send the key as **`X-Fodibey-Key: <key>`** instead (same value). Both headers are accepted; use the custom one in production.

```bash
curl https://ihusaas.online/api/fodibey/v1/stats \
  -H "Authorization: Bearer $FODIBEY_API_KEY" \
  -H "X-Fodibey-Actor: moderator@fodibey"      # optional: attributes actions in the audit log
```

Errors are always `{ "error": { "code": "...", "message": "..." } }` with a matching HTTP status.
No endpoint ever returns a device token. Paging: `limit` (≤200) and `cursor` (the `next_cursor` of the previous page).

## 3. Endpoints

| Method & path | Purpose |
|---|---|
| `GET /health` | **200** = API reachable and key valid. The `database` field is `ok`, `not_configured` (server lacks `SUPABASE_SERVICE_ROLE_KEY`) or `error` (503). Use it to tell "down" from "needs its database key" |
| `GET /stats` | Posts / comments / open reports, last 24h & 7d, by mood, by atoll, reaction totals |
| `GET /reports?status=open&target=post\|comment&reason=` | The moderation queue, with the reported content attached |
| `POST /reports/{id}/resolve` `{action, note?}` | `hide` · `dismiss` (restores auto-hidden content) · `delete` · `acknowledge` (handled, content untouched, e.g. a self-harm follow-up) |
| `GET /posts` · `PATCH /posts/{id}` `{is_hidden}` · `DELETE /posts/{id}` | Browse (incl. hidden), hide/unhide, delete |
| `GET /comments` · `PATCH /comments/{id}` · `DELETE /comments/{id}` | Same for notes |
| `GET /blocked-terms` · `POST /blocked-terms` · `DELETE /blocked-terms/{id}` | The word filter. POST takes one term or `{terms:[…]}` (≤500) |
| `POST /moderation/check` `{text, scope?}` | "Would this be blocked?" using the app's exact filter |
| `GET /moderation-log` | Audit trail of every action taken through this API |
| `GET /helplines` | The verified helplines the app shows (read-only for now) |
| `GET /openapi.json` | The contract (public) |

### Report reasons
`rude` · `hate` · `self_harm` · `spam` · `privacy` · `other`.
A `self_harm` report **never hides** anything. It flags a person who may need help, so surface those first in the dashboard
(`GET /reports?reason=self_harm`) and close them with `acknowledge` once someone has followed up.
Three distinct reports auto-hide a post/comment (two for Thaana-script text, where the word list is thin).

## 4. Managing the word filter (important for Dhivehi)

The filter runs **in the database**, so it can't be bypassed by a modified app. Each term compiles to a pattern that tolerates
repeated letters (`fuuuck`), leetspeak (`sh1t`), and, in `mode: "anywhere"`, separators (`f.u.c.k`). Spaced-out single letters
(`k y s`) are also caught. Boundaries are Thaana-aware, so **Thaana script and Latin-script Dhivehi both work**.

```bash
curl -X POST https://ihusaas.online/api/fodibey/v1/blocked-terms \
  -H "Authorization: Bearer $FODIBEY_API_KEY" -H "Content-Type: application/json" \
  -d '{"terms":[{"term":"ފޮށި","lang":"dv","scope":"comments"},{"term":"foshi","lang":"dv-latin"}]}'
```

* `scope: "comments"` — checked in notes only. `scope: "all"` — also in letters; **reserve it for slurs**, so people can still vent honestly.
* `mode: "word"` (default) matches whole words. Use `anywhere` only for strings that can't appear inside innocent words.
* **The shipped Dhivehi list is a starter set** (there is no public Dhivehi profanity lexicon). Have native speakers extend it through this endpoint.
* Avoid phrases that appear in *supportive* notes (e.g. "your fault" appears in "it's not your fault").

## 5. Getting events into Fodibey (optional)

Ihusaas can push signed events:

```
POST $FODIBEY_WEBHOOK_URL
X-Fodibey-Event: moderation.action          (also db.posts.insert, db.comments.insert, db.reports.insert, …)
X-Fodibey-Timestamp: 1767225600
X-Fodibey-Signature: sha256=<hex HMAC-SHA256 of "<timestamp>.<raw body>" using FODIBEY_WEBHOOK_SECRET>
```
Verify the signature **and** reject timestamps older than ~5 minutes (replay protection).

Moderator actions emit `moderation.action` automatically. For *new* posts/comments/reports (which happen in the browser, straight to Supabase),
add **Supabase → Database → Webhooks** on `posts`, `comments` and `reports` (Insert) pointing at
`POST https://ihusaas.online/api/fodibey/v1/relay` with the header `x-relay-secret: <FODIBEY_RELAY_SECRET>`.
The relay strips device tokens and forwards the event, signed, to Fodibey. Alternatively Fodibey can simply poll `GET /reports?status=open`.

## 6. Security notes

* The service-role key and API key live only in server env. The `server-only` import makes the build fail if admin code ever reaches the browser.
* Keys are compared in constant time. Rotate by listing two keys, switching Fodibey over, then removing the old one.
* Every mutating call writes to `moderation_log` (actor from `X-Fodibey-Actor`).
* Put Fodibey's egress IPs on an allow-list at your host/CDN if you can.
