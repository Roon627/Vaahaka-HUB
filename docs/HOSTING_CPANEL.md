# Hosting Ihusaas on the cPanel account (ssh alias `cfodibey`)

Same account and pattern as MaldivesXplorer: a CloudLinux **Node.js app**, with its own folder `~/ihusaas`.
The server never builds anything. `scripts/deploy-cpanel.sh` builds a standalone bundle on your laptop and uploads it.

## One-time setup

**1. Add the domain in cPanel** (can't be done over SSH on this server)
cPanel → **Domains** → **Create A New Domain** → `ihusaas.online`
→ untick *Share document root* → Document Root: `ihusaas.online` → Submit.

**2. Point the domain at the hosting** (Namecheap → Domain List → ihusaas.online → **Advanced DNS**)
| Type | Host | Value |
|---|---|---|
| A Record | `@` | `69.57.162.44` |
| CNAME Record | `www` | `ihusaas.online.` |
Delete the old parking/redirect records on `@` and `www`. DNS takes minutes to a couple of hours.

**3. Create the Node app** (over SSH, or in cPanel → *Setup Node.js App*)
```
cloudlinux-selector create --json --interpreter nodejs --version 22 \
  --app-root ihusaas --app-uri / --app-mode production --startup-file server.js --domain ihusaas.online
```

**3b. Copy the routing file into the app folder** (required on this host, see "Quirks" below)
```
ssh cfodibey 'cp ~/ihusaas.online/.htaccess ~/ihusaas/.htaccess && touch ~/ihusaas/tmp/restart.txt'
```

**4. HTTPS.** The host redirects HTTP→HTTPS, but until a certificate exists the HTTPS side presents the host's generic one, so cPanel's AutoSSL check
(which fetches a file over HTTP and follows that redirect) can never validate. Two fixes, either works:
* **Cloudflare (fastest, no cPanel needed):** Cloudflare → DNS → set `ihusaas.online` and `www` to **Proxied** (orange cloud); SSL/TLS → Overview → mode **Full**.
  Visitors get a valid certificate immediately (this is how xplorer works). Keep *Bot Fight Mode* off, or skip it for `/api/fodibey/*`, so Fodibey's server isn't challenged.
* **cPanel:** Domains → turn **Force HTTPS Redirect** off for `ihusaas.online` and `www` → SSL/TLS Status → *Run AutoSSL* → turn the redirect back on.

Old note: cPanel → **SSL/TLS Status** → tick `ihusaas.online` and `www.ihusaas.online` → *Run AutoSSL*. The PWA install needs HTTPS.
If AutoSSL fails, read its error. If it complains about a redirect, temporarily switch off *Force HTTPS Redirect* for the domain (cPanel → Domains), run AutoSSL, then switch it back on.

**5. Secrets** (only if you use the Fodibey API). Don't use cPanel's "Setup Node.js App" page for this: it fails with
*"No such domain: ihusaas.online.itnvend.com"* because the app is registered under cPanel's hidden helper subdomain. Use the script instead:
```
./scripts/set-server-secret.sh SUPABASE_SERVICE_ROLE_KEY     # prompts (hidden), saves to ~/ihusaas/.env.production, restarts
./scripts/set-server-secret.sh FODIBEY_API_KEY               # (already set via cPanel earlier: see note)
./scripts/set-server-secret.sh --remove NAME
```
Note: a variable set in cPanel's Node.js page **overrides** the file, so if `FODIBEY_API_KEY` is already set there, changing the file has no effect on it.
Fodibey must send the key as `X-Fodibey-Key: <key>` (this host strips `Authorization`; see `docs/fodibey-api.md`).

## Every deploy
```
./scripts/deploy-cpanel.sh
```
Builds locally, uploads only what changed, restarts the app. It never overwrites `.env.production`.

## Checks / troubleshooting
* Test before DNS is switched: `curl --resolve ihusaas.online:80:69.57.162.44 http://ihusaas.online/help -I`
* Logs: `ssh cfodibey 'tail -50 ~/ihusaas/stderr.log'` · restart: `touch ~/ihusaas/tmp/restart.txt`
* Roll back: `git checkout <old commit>` then `./scripts/deploy-cpanel.sh`.
* Shared-hosting limits apply (memory/CPU). Measured on the host: ~96 MB at idle.
* Supabase hosts the data, so nothing is stored on the server. Redeploying never loses letters.
* The laptop-hosting idea (Cloudflare tunnel) is no longer needed; `NEXT_PUBLIC_SITE_URL` is already `https://ihusaas.online`.

## Quirks of this host (learned the hard way)
* **The web server serves `~/ihusaas` (the app folder) as the site's document root**, even though cPanel lists `~/ihusaas.online`.
  The Node routing file (`.htaccess` with `PassengerAppRoot …`) must therefore sit in **`~/ihusaas/.htaccess`**. Without it the host serves the app folder as a
  plain file listing (and `server.js` becomes downloadable). `deploy-cpanel.sh` never touches that file.
* **A new domain takes about 15 minutes** before the web server notices it, and Node apps on it work only after that.
* **Certificate validation files** land in `~/ihusaas/.well-known/pki-validation/`. Because the app answers every URL, `src/app/api/dcv/` (plus a rewrite in
  `next.config.mjs`) serves exactly those files. The deploy script excludes `.well-known` so a deploy can't delete them.
* The add-on domain also created an internal subdomain `ihusaas.online.itnvend.com`. Harmless; ignore it.
* **Namecheap's banner** ("offline until you use dns1/dns2.namecheaphosting.com") does **not** apply: DNS is on Cloudflare with an A record to `69.57.162.44`.
  Don't switch nameservers unless you move all DNS records into cPanel.
* cPanel's Node.js page says *"No such domain: ihusaas.online.itnvend.com"* when saving env vars: the app record names a helper subdomain that doesn't exist (cPanel's real one is `ihusaas.itnvend.com`). Ignore the page and use `scripts/set-server-secret.sh`.
* `cloudlinux-selector restart` can hang over SSH; use `touch ~/ihusaas/tmp/restart.txt` instead.
* `deploy-cpanel.sh` uses `rsync --delete`: any extra file you put in `~/ihusaas` (other than `.env.production`, `.htaccess`, `tmp`, `.well-known`, `stderr.log`) is removed on the next deploy.
