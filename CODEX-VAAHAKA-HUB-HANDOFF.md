# CODEX handoff: Vaahaka-HUB (Ihusaas) — state as of 2026-10-28

Copy this file into the Vaahaka-HUB repo (e.g. `CODEX.md` or `docs/CODEX-HANDOFF.md`). It contains no secrets.

## Current override — 2026-10-30

**iOS 27 icon resolved and confirmed by the owner**, fix commit `b51800f`.
Read [the confirmed fix](docs/PWA-IOS27-ICON-FIX.md) before changing install metadata.
The embedded PNG touch icon must be preserved. Production uses `https://ihusaas.online/`;
`www` redirects to the apex. Earlier pending-device-test and www guidance below is historical.

## What this is
Vaahaka-HUB is the **Ihusaas** web app (Next.js, deployed on **Vercel**, production alias `husaasonline.vercel.app`, custom domain `ihusaas.online`). The owner's personal OS, **FODIBEY**, runs on a separate laptop server and talks to Ihusaas over a small API.

## Live state
- Domains `ihusaas.online` and `www.ihusaas.online` are attached to the Vercel project. Cloudflare is the DNS host (zone active).
- DNS (DNS-only, not proxied): `CNAME @` and `CNAME www` → `9d7652565a9f0be5.vercel-dns-017.com`. MX/TXT records are the registrar's email forwarding — **leave them alone**.
- Vercel redirects the bare domain to `www` (308). **Use `https://www.ihusaas.online` for anything that must not follow redirects.**
- Env vars are set in Vercel (Supabase URL / anon key / service role key, `FODIBEY_API_KEY`). Never commit them or paste them into chat.
- Old self-hosted copy on the owner's VPS (InstaBox `fodiaps`) was deleted; Vercel is the only host.

## FODIBEY ↔ Ihusaas API
- Base: `https://www.ihusaas.online/api/fodibey/v1`. FODIBEY's server proxies it and holds the key; the browser never sees it.
- Auth: `Authorization: Bearer <key>` or `X-Fodibey-Key: <key>` where the key is **Ihusaas's own `FODIBEY_API_KEY`** (generate with `openssl rand -hex 32`).
- Verified 2026-10-28: `GET /health` → `{"ok":true,"service":"ihusaas","api":"fodibey/v1","database":"ok"}`; unauthenticated calls → 401; unknown paths → 404 JSON. OpenAPI: `/api/fodibey/v1/openapi.json`.
- FODIBEY only forwards these (keep them stable): GET `health, stats, reports, posts, comments, blocked-terms, moderation-log, helplines`; POST `reports/:id/resolve`, `blocked-terms`, `moderation/check`; PATCH `posts|comments/:id`; DELETE `posts|comments|blocked-terms/:id`. Changing a response shape breaks the FODIBEY dashboard.
- Optional live events: Ihusaas can POST to FODIBEY's webhook (`FODIBEY_WEBHOOK_URL`); needs a matching secret on both sides.

## Key direction (do not mix up)
- `fdy_live_…` keys are **FODIBEY's own** API Global Manager keys (Ihusaas → FODIBEY). They belong in Ihusaas's *own* settings as its credential for calling FODIBEY. **Never send an `fdy_…` key to any Ihusaas endpoint** and never log it.
- Two `fdy_live_…` keys and one token were pasted into chat earlier: treat as exposed and rotate/revoke.

## How to update and deploy
1. Work on a branch in the repo on `roon`; run the project's own `npm run lint` and `npm run build` first.
2. Check in Vercel → Project → Settings → Git whether the repo is connected. If it is, pushing to the production branch deploys automatically. If not, deploy with the Vercel CLI (`vercel --prod`) from the project folder.
3. After deploy: open `https://www.ihusaas.online`, then check `https://www.ihusaas.online/api/fodibey/v1/health` returns 401 without a key (route is alive) and 200 with the key.
4. If the owner's FODIBEY dashboard shows "Ihusaas unavailable", read the exact text: "Unreadable response" previously meant a redirect (apex → www); a 401 means the key mismatch.

## Rules
- Safety queue handling is sensitive (self-harm reports first). Don't weaken moderation or expose report text in logs.
- Don't change DNS from code; DNS changes are made by the owner through FODIBEY's chat with a Confirm step (Cloudflare).
- Never commit `.env*`, Supabase keys, or the FODIBEY key. Don't ask the owner to paste secrets into chat; use Vercel's env UI.
- Keep `/api/fodibey/v1` backwards compatible; version it (`/v2`) for breaking changes.

## GUI update — 2026-10-28
- Homepage: compact mobile actions, shorter introduction, bottle cards, mood/place sheets; desktop letter illustration.
- Map: surprise destination, previous/next region hopping, session-only visited trail, mood discovery card, searchable regions, touch pan toggle, and reset controls.
- Mobile primary/filter actions are 36px high; desktop actions remain 44px. Map overlays are contained below global navigation.
- Validation: TypeScript and production build pass; Chromium checks at 320/390/768/1440px cover layout and discovery/search interactions.
- No standalone lint script exists; `next build` performs its configured lint/type checks.
- Local account-page exports are excluded in `.gitignore`. Do not add credential exports to Git.

## Illustrated map follow-up
- Default map uses georeferenced island polygons from geoBoundaries / Sentinel-2 (2021) with decorative surf, green land, and bottle markers. Source metadata and CC BY 4.0 attribution are in public/data/COASTLINES.md.
- Street toggle retains OpenStreetMap for newer reclamation and local details; illustrated data failure falls back to street tiles.
- Full-country view uses smaller markers, with labels and larger bottles on zoom. Administrative atoll polygons are used for navigation bounds, not rendered as land.

## Map control fix
- Pass the Leaflet imperative handle as an explicit `mapHandle` prop across Next's dynamic component boundary; a React `ref` there targets the loader rather than the map.
- Enable dragging, wheel zoom, double-click, and keyboard navigation together; detect any fine pointer for hybrid touch/mouse devices.
- Update map cursor/touch-action classes through the Leaflet container because MapContainer's initial props are not reactive. Phone scroll mode remains available.

## 2026-10-29 PWA/security sweep
See docs/SECURITY-REVIEW-2026-10-29.md. Next 15.5.28, asynchronous route params,
patched dependency lock, SW v8, icon URL v8, root PWA start URL, bounded request bodies,
error/privacy hardening, and security headers. iPhone installation must still be verified
on-device. Rotate previously exposed credentials in provider settings. Config backups use
`.bak-2026-10-29-sweep`; public backups moved to ignored `.local-backups/`.

## iPhone installed-icon follow-up
User clarified the logo previews correctly but the installed icon becomes a black “I”.
Live v8 touch PNG was confirmed 180×180 opaque RGB, HTTP 200, and present in initial head.
A minimal `/install.html` now isolates installation from framework metadata; one touch
icon plus 192/512 manifest icons use new physical `/pwa/ihusaas-install-*.png` paths.
SW v9 bypasses these paths. Installed launch goes home. This is an unconfirmed workaround:
a real iPhone reinstall is still required; do not claim a proven iOS cause or resolution.

## Canonical domain correction — 2026-10-30 (supersedes www guidance above)
Vercel now serves https://ihusaas.online directly (200) and redirects www to the apex (308).
Metadata and install guidance now use the apex. Icon/manifest URLs remain same-origin relative
paths, so there is no redirect when installing from https://ihusaas.online/install.html.
Update FODIBEY's externally configured API base to https://ihusaas.online/api/fodibey/v1
and NEXT_PUBLIC_SITE_URL in Vercel to https://ihusaas.online. Existing www installations
should be replaced from the apex. On-device icon rendering still needs user verification.

## iOS 27 touch-icon correction — 2026-10-30
The user's screenshot shows the logo in Share preview but a monogram already in the Add to Home Screen sheet.
Read-only inspection of fodibey's current ~/Desktop/GUIFODI-main showed Badhige is now separate.
~/Desktop/Badhige-source/scripts/build-badhige.mjs embeds its PNG as a data URI, as does its adminPwa.ts.
Ihusaas now uses the same approach: scripts/build-pwa-icons.mjs reads the existing opaque PNG,
generates src/lib/generated/pwa-icons.json for the server layout, and embeds it in public/install.html.
prebuild/predev and brand:build regenerate it. Network PNGs remain available for manifest/other browsers.
No remote files or services were changed. Confirm the live HTML contains data:image/png;base64
before testing installation. The owner subsequently confirmed it worked on iOS 27
on 2026-10-30 (fix commit `b51800f`). See docs/PWA-IOS27-ICON-FIX.md for the
evidence, regeneration commands, and regression checks.
