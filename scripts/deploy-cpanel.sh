#!/usr/bin/env bash
# Build Ihusaas as a self-contained "standalone" bundle and publish it to the cPanel host.
#   ./scripts/deploy-cpanel.sh            (host = ssh alias "cfodibey", app folder = ~/ihusaas)
# Nothing is built or installed on the shared server: it only receives files and gets a restart nudge.
# Server-only secrets live in ~/ihusaas/.env.production ON THE SERVER; this script never touches that file.
set -euo pipefail
HOST="${HOST:-cfodibey}"; APP_DIR="${APP_DIR:-ihusaas}"
cd "$(dirname "$0")/.."

echo "› building (standalone)…"
rm -rf deploy .next-deploy
NEXT_OUTPUT=standalone NEXT_DIST_DIR=.next-deploy npx next build >/tmp/ihusaas-build.log 2>&1 || { tail -30 /tmp/ihusaas-build.log; exit 1; }
# `next build` records its dist dir in tsconfig.json; undo so the repo stays clean
python3 - <<'PY'
import json; p="tsconfig.json"; d=json.load(open(p)); d["include"]=[i for i in d["include"] if ".next-" not in i]
json.dump(d,open(p,"w"),indent=2); open(p,"a").write("\n")
PY

echo "› assembling bundle…"
mkdir -p deploy/.next-deploy
cp -a .next-deploy/standalone/. deploy/
cp -a .next-deploy/static deploy/.next-deploy/static
cp -a public deploy/public

echo "› uploading to $HOST:~/$APP_DIR …"
rsync -az --delete --exclude .env.production --exclude tmp --exclude stderr.log --exclude .htaccess --exclude .well-known \
  -e "ssh -o BatchMode=yes" deploy/ "$HOST:$APP_DIR/"

echo "› restarting the app…"
ssh -o BatchMode=yes "$HOST" "mkdir -p ~/$APP_DIR/tmp && touch ~/$APP_DIR/tmp/restart.txt"
echo "✓ deployed. Check: https://ihusaas.online"
