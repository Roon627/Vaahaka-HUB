# iOS 27 home-screen icon — confirmed fixed, 2026-10-30

The owner confirmed the bottle icon works after deploying commit `b51800f`
(`Embed iOS touch icon using Badhige’s working installation method`).
Production is **https://ihusaas.online/**; `www` redirects to this apex domain.

## Symptom and evidence

Safari’s Share preview showed the bottle, but the **Add to Home Screen sheet already
showed a black “I” before tapping Add**, and installation kept that generic tile.
A correct Share preview does not establish that the installer selected the touch icon.
The owner reported iOS 27; Fodibey and Badhige worked on the same phone.

The external PNG was valid, opaque RGB, 180×180, served over HTTPS with HTTP 200
and `image/png`, and linked in the initial HTML head. HTTPS/domain corrections,
opaque artwork, icon URL versioning, fresh filenames, manifest adjustments, and a
minimal install page with an external icon URL did not resolve the reported tile.

Read-only inspection via `ssh fodibey` found the current GUI in
`/home/b1sh3/Desktop/GUIFODI-main` and the separate Badhige source in
`/home/b1sh3/Desktop/Badhige-source`. Its `scripts/build-badhige.mjs` embeds the
touch PNG directly in HTML as a base64 data URL; `apps/badhige/adminPwa.ts` uses
the same approach. **No Fodibey/Badhige files or services were changed.**

## The working change

Use one `apple-touch-icon` link in the initial HTML head with
`href="data:image/png;base64,…"`, embedding the actual PNG rather than requiring
an additional icon fetch. Apply it to both the homepage and `/install.html`.
This is a user-confirmed workaround, not proof of a particular Apple internal bug.

- Source artwork: `public/pwa/ihusaas-install-180.png` (opaque PNG).
- Generator: `scripts/build-pwa-icons.mjs` reads that PNG, writes
  `src/lib/generated/pwa-icons.json`, and updates the single touch link in
  `public/install.html`.
- `src/app/layout.tsx` imports that generated JSON and renders the embedded icon.
- `prebuild`, `predev`, and `brand:build` regenerate the embedded data.
- Manifest icons remain ordinary 192/512 PNG files. Manifest `id`, `start_url`,
  and `scope` remain `/`.
- Service worker v9 bypasses `/pwa/`, `/install.html`, manifest and touch-icon
  requests. Preserve these exclusions.

## Maintaining and checking the fix

After changing artwork, run `npm run brand:build`. To re-embed an existing PNG,
run `npm run pwa:build`. Commit both the generated JSON and updated install HTML;
do not maintain base64 by hand or replace the embedded link with a network URL.

```bash
npm run pwa:build
node --test tests/pwa-security.test.mjs
# Use a separate output directory if a local development server is running:
NEXT_DIST_DIR=.next-inline-icon npm run build
```

Review any build-generated `tsconfig.json` changes before committing.
The regression tests check source PNG/data-URL byte equality, the install page’s
single touch link, the layout reference, manifest paths, and worker exclusions.
Before the successful device test, all four tests and the production build passed.
The deployed initial HTML for **both `/` and `/install.html`** was also checked:
each contained one embedded touch icon whose decoded bytes exactly matched the PNG.
A successful local build alone does not prove the deployed HTML is current.

For a future device regression, open https://ihusaas.online/install.html in Safari,
choose Share → Add to Home Screen, and inspect the icon **before tapping Add**.
Check the resulting installed tile too. The owner confirmed this fix worked on
2026-10-30 after receiving those instructions. Desktop checks cannot replace that
on-device confirmation for later changes.

## Avoid repeating the failed investigation

Keep the apex canonical domain and valid HTTPS, but do not describe either as the
fix for the black tile: the problem persisted after those corrections. Likewise,
a working Share preview, HTTP 200 for a PNG, or another cache-busting suffix is
not sufficient evidence of a working installation icon. Preserve the embedded
PNG approach unless a replacement has been tested on the affected device.
