#!/usr/bin/env bash
# Set (or remove) a server-only secret in ~/ihusaas/.env.production ON THE HOST.
# The value is typed hidden, travels over ssh's stdin, and never touches your shell history, the process list, or git.
#   ./scripts/set-server-secret.sh FODIBEY_API_KEY          (prompts for the value)
#   ./scripts/set-server-secret.sh --remove FODIBEY_API_KEY
# The app restarts automatically. NOTE: a variable set in cPanel's "Setup Node.js App" page overrides this file.
set -euo pipefail
HOST="${HOST:-cfodibey}"; APP_DIR="${APP_DIR:-ihusaas}"
if [ "${1:-}" = "--remove" ]; then NAME="${2:?usage: $0 --remove NAME}"; V=""; else
  NAME="${1:?usage: $0 NAME   |   $0 --remove NAME}"
  read -rsp "Value for $NAME (hidden): " V; echo
  [ -n "$V" ] || { echo "Empty value: nothing changed."; exit 1; }
fi
[[ "$NAME" =~ ^[A-Z][A-Z0-9_]{1,63}$ ]] || { echo "NAME must look like FODIBEY_API_KEY"; exit 1; }

read -r -d '' REMOTE <<'EOS' || true
set -e; umask 077; cd ~/"$2"; f=.env.production; touch "$f"; name="$1"
IFS= read -r v || true
grep -vE "^#?${name}=" "$f" > "$f.new" || true
[ -n "$v" ] && printf '%s=%s\n' "$name" "$v" >> "$f.new"
mv "$f.new" "$f"; mkdir -p tmp; touch tmp/restart.txt
EOS
printf '%s\n' "$V" | ssh -o BatchMode=yes "$HOST" "bash -c $(printf '%q' "$REMOTE") _ $NAME $APP_DIR" 2>/dev/null
[ -n "$V" ] && echo "✓ $NAME saved on $HOST and the app restarted." || echo "✓ $NAME removed on $HOST and the app restarted."
