#!/usr/bin/env bash
# Smoke-test the Fodibey API against a running server.
#   FODIBEY_API_KEY=... ./scripts/fodibey-smoke.sh [base-url]
set -u
BASE="${1:-http://localhost:3000}/api/fodibey/v1"
KEY="${FODIBEY_API_KEY:?set FODIBEY_API_KEY}"
H=(-H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -H "X-Fodibey-Actor: smoke-test")
pass=0; fail=0
t() { # name expected_status curl-args...
  local name=$1 want=$2; shift 2
  local got; got=$(curl -s -o /tmp/fodibey-smoke.out -w "%{http_code}" "$@")
  if [ "$got" = "$want" ]; then pass=$((pass+1)); echo "ok   $name ($got)"; else fail=$((fail+1)); echo "FAIL $name: wanted $want got $got -> $(head -c 200 /tmp/fodibey-smoke.out)"; fi
}
t "no token -> 401"            401 "$BASE/health"
t "bad token -> 401"           401 -H "Authorization: Bearer nope" "$BASE/health"
t "health"                     200 "${H[@]}" "$BASE/health"
t "openapi (public)"           200 "$BASE/openapi.json"
t "stats"                      200 "${H[@]}" "$BASE/stats"
t "reports (open)"             200 "${H[@]}" "$BASE/reports?status=open&limit=5"
t "posts (hidden only)"        200 "${H[@]}" "$BASE/posts?hidden=true&limit=5"
t "comments"                   200 "${H[@]}" "$BASE/comments?limit=5"
t "helplines"                  200 "${H[@]}" "$BASE/helplines"
t "moderation log"             200 "${H[@]}" "$BASE/moderation-log?limit=5"
t "check: blocked"             200 "${H[@]}" -X POST "$BASE/moderation/check" -d '{"text":"you are an idiot"}'; grep -q '"blocked":true' /tmp/fodibey-smoke.out || { fail=$((fail+1)); echo "FAIL check should say blocked"; }
t "check: kind text passes"    200 "${H[@]}" -X POST "$BASE/moderation/check" -d '{"text":"sending you strength"}'; grep -q '"blocked":false' /tmp/fodibey-smoke.out || { fail=$((fail+1)); echo "FAIL kind text should pass"; }
t "bad uuid -> 400"            400 "${H[@]}" -X PATCH "$BASE/posts/not-a-uuid" -d '{"is_hidden":true}'
t "bad body -> 400"            400 "${H[@]}" -X POST "$BASE/blocked-terms" -d '{}'
t "unknown route -> 404"       404 "${H[@]}" "$BASE/nope"
t "wrong method -> 405"        405 "${H[@]}" -X PUT "$BASE/stats"
echo; echo "passed $pass, failed $fail"; [ "$fail" = 0 ]
