# PWA and security review — 2026-10-29

## Fixed
- PWA launch simplified to `/`; same-origin URLs avoid hardcoded preview/production-host mistakes. Live manifest contained no `https://www/ihusaas.online` typo.
- Opaque icons validated against declared dimensions; cache-bust version 8 and default Apple status bar. Brand generator now reproduces all opaque touch/manifest assets.
- Worker v8 excludes API routes, authorized requests, manifest and install icons; respects private/no-store responses and keeps background refresh alive. Redirect response copies discard stale encoding/length headers.
- Next upgraded to 15.5.28 and dynamic route params migrated. Removed unused D3/react-simple-maps packages. Next's PostCSS overridden to patched 8.5.x. Fresh lockfile audited; SunCalc stays at 1.9.0.
- Bounded streaming body reads (8 KB suggestions; 64 KB authenticated moderation requests), null/array suggestion validation, no raw exceptions in logs/UI, no double-decoding path segments, no webhook redirects carrying confidential payloads.
- Added frame protection, no-sniff, restrictive base/object/frame CSP directives, referrer policy, and revalidation for SW/manifest. This is not a full script CSP.
- Malformed reaction/opened local storage no longer crashes UI. Cache recovery awaits cleanup, preserves device/reaction storage, and targets only app caches.
- Public backup copies moved to ignored `.local-backups/`; backup files and marketing excluded from commits.

## Scope and validation
Reviewed app routes, Fodibey auth/router/webhooks, suggestion validation, client storage, PWA metadata/cache paths, dependency advisories, and checked-in Supabase grants/RLS/functions. Read-only production manifest/icon checks; no production submissions or database writes.
Browser tests cover homepage/map and invalid suggestion requests. Regression tests cover install URL/icon references and SW exclusions. Icon dimensions/opacity checked with Sharp. Production build/type checking and dependency audit run before push.

## Remaining operational work
- The handover reports exposed credentials. Rotate the Fodibey and Supabase service-role credentials through their provider/Vercel settings, updating connected services. Code changes cannot revoke old credentials. No secrets were printed or committed.
- Live database grants and deployed migrations were not exhaustively verified; anonymous device tokens are rate-limit identifiers, not strong user authentication. Concurrent database-level abuse testing was not performed.
- Completed 2026-10-30: the owner confirmed the iOS 27 icon fix after deployment of `b51800f`. See [the embedded-PNG fix](PWA-IOS27-ICON-FIX.md). Future icon changes still require device testing.
- Push does not guarantee Vercel has finished deployment. Check the deployed manifest, icon responses, and unauthenticated `/api/fodibey/v1/health` (401) after deployment.

References: https://nextjs.org/docs/app/guides/upgrading/version-15 and
https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/start_url
