# Ihusaas — ihusaas.online

*Ihusaas* (feeling) is an anonymous, gentle place for Maldivians to set down what they're carrying.
Write a letter, seal it in a bottle, let strangers listen. Readers reply with 🫂 🫀 🕯️ and kind anonymous notes. No accounts.

**Stack:** Next.js 15 (App Router) · Tailwind · Framer Motion · Leaflet · Supabase · installable PWA.

## Run it

```bash
cp .env.example .env.local          # fill in the Supabase URL + anon key
npm install
npm run dev                         # http://localhost:3000
```

Database (Supabase SQL editor, in this order):

1. `supabase/schema.sql` — tables, indexes, RLS, column grants, reaction/report RPCs
2. `supabase/migrations/002_comments_moderation.sql` — anonymous notes, the English + Dhivehi word filter, richer reports, audit log
3. *(optional)* `supabase/seed_showcase.sql` — 24 sample letters + notes for demos. Remove with `delete from posts where device_token like 'seed-%';`

## Deploy to ihusaas.online

1. Push to GitHub and import the repo into Vercel (or any Node host).
2. Environment variables: everything in `.env.example`. At minimum `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL=https://www.ihusaas.online`.
3. Add the domain `ihusaas.online` in the host's dashboard and point DNS at it (the host shows the exact records).
4. HTTPS is required for the PWA install prompt and service worker, and every host above provides it automatically.

## What's inside

```
supabase/                 schema, migrations, seeds
public/data/              real atoll boundaries (jawish/maldives-geo) + 1,063 islands (naxeem/maldives-atoll-islands), both MIT
public/brand/             logo pack (see public/brand/README.md)
public/sw.js              service worker (same-origin only; never caches Supabase)
scripts/                  build-geo-data · build-brand · fodibey-smoke.sh
docs/fodibey-api.md       the Fodibey integration
src/lib/helplines.ts      verified Maldives helplines (add only numbers you've verified)
src/lib/fodibey/          the Fodibey API (server-only)
src/components/           feed, bottles, reader, composer, map, nav, sheets
```

Handy scripts: `npm run geo:build` refreshes the map/island data · `npm run brand:build` regenerates the whole logo pack.

## Safety by design

* **Anonymous:** a random device token (localStorage) is used only to dedupe reactions/reports and rate-limit posting; it lives in columns the public API can't read.
* **Kindness is enforced in the database:** rude/harsh wording (English + Dhivehi, Thaana and Latin spellings), links, emails and phone numbers are rejected for notes; slurs are rejected everywhere. Rate limits stop floods. See `docs/fodibey-api.md` §4 for managing the list.
* **Reports** on letters and notes (with reasons). Three distinct reports auto-hide; "someone may be in danger" never hides but flags for follow-up and shows helplines.
* **Helplines** (911 · 1677 · 1412 · 1421 · FPA · 1484) are one tap away from the menu, every letter, the composer (a gentle nudge on crisis wording), and the offline page. They work with no data.
* **Please review before launch:** the Dhivehi blocked-word list is a *starter set*: have native speakers extend it. Re-verify the helpline numbers periodically (`src/lib/helplines.ts` records when they were last checked).

## Data credits
Atoll boundaries: [jawish/maldives-geo](https://github.com/jawish/maldives-geo) (MIT). Islands: [naxeem/maldives-atoll-islands](https://github.com/naxeem/maldives-atoll-islands) (MIT). Fonts: Fraunces, Nunito, Caveat (SIL OFL).

## PWA and security checks

Run `node --test tests/pwa-security.test.mjs`, `npm run typecheck`, `npm audit`, and `npm run build`.
When a local server is running, build separately: `NEXT_DIST_DIR=.next-sweep npm run build`.

The install manifest uses a same-origin `/` launch URL. The correct production address is
`https://www.ihusaas.online/` (a dot after `www`, not a slash). Icon URLs are versioned and
opaque. After deploying an icon update, remove the old iPhone home-screen shortcut, open
this address in Safari, let it load, and add it again. Device-side icon caching still requires
real iPhone verification; desktop/browser tests cannot prove the iOS home-screen tile.

See [the security review](docs/SECURITY-REVIEW-2026-10-29.md) for changes and remaining operational work.
