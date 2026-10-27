# Raalhu (ރާޅު, "Wave")

Anonymous confession / dumping-ground platform for Maldivians.
Next.js 14 (App Router) · Tailwind · Framer Motion · react-simple-maps · Supabase.

```
supabase/schema.sql          tables, indexes, RLS, column grants, RPCs (run once)
public/data/*.geojson        atoll boundaries (placeholder shipped — see below)
scripts/build-placeholder-geo.mjs
src/
├─ app/
│  ├─ layout.tsx             shell + Nav
│  ├─ template.tsx           per-route enter transition (Framer Motion)
│  ├─ page.tsx               feed
│  └─ map/page.tsx           heatmap
├─ components/
│  ├─ DumpingGround.tsx      masonry feed, infinite scroll, composer modal
│  ├─ DropStory.tsx          anonymous composer
│  ├─ PostCard.tsx           card, trigger-warning gate, report
│  ├─ ReactionBar.tsx        🫂 Felt · 🫀 Heart · 🕯️ Listening
│  ├─ CategoryFilter.tsx     mood chips (shared by feed + map)
│  ├─ AtollMap.tsx           GeoJSON heatmap + tooltips + category toggle
│  └─ Nav.tsx
├─ hooks/  usePosts.ts (keyset pagination) · useAtollCounts.ts
└─ lib/    constants.ts · types.ts · supabase.ts · device.ts · geo.ts
```

## Setup
1. Create a Supabase project, run `supabase/schema.sql` in the SQL editor.
2. `cp .env.example .env.local` and fill in URL + anon key.
3. `npm install && npm run dev`

## Real map data
A schematic placeholder is committed so the app runs immediately. To use real
boundaries (e.g. `jawish/maldives-geo`), drop the GeoJSON at
`public/data/maldives-atolls.geojson` (or set `NEXT_PUBLIC_ATOLL_GEOJSON_URL`).
Features are matched to atolls by `src/lib/geo.ts` (code or name in common
property keys) — add your dataset's key to `KEYS` if needed. Island-level
datasets work: all islands of an atoll share one count.
If polygons render as a filled rectangle, the ring winding is inverted for
d3-geo; rewind them with `@turf/rewind` (`reverse: true`).

## Privacy model
No accounts. A random device token (localStorage) is used only for reaction
dedupe and a 5-posts/hour limit; it lives in columns anon cannot SELECT.
Reactions and reports are only writable through SECURITY DEFINER RPCs.
Three distinct reports auto-hide a post pending review.
Before launch consider: CAPTCHA (Turnstile) on insert, an admin moderation view
using the service role, and crisis-helpline copy reviewed by locals.
