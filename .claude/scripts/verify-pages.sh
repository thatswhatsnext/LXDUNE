#!/usr/bin/env bash
# Confirm GitHub Pages is serving what <new-ref> contains, for every file that changed since <old-ref>.
#
#   .claude/scripts/verify-pages.sh <old-ref> <new-ref> [base-url]
#
# 1. Waits for the "pages build and deployment" run for <new-ref> to finish (and fails if it failed).
# 2. For each changed file (dotfiles and node_modules skipped, since Pages does not serve them), fetches
#    the live copy with a cache-buster and compares it byte for byte with <new-ref>. Deleted files must 404.
#    A mismatch is retried up to 3 times straight away, which absorbs cut-off downloads.
# 3. Re-checks whatever still differs once a minute until everything matches or TIMEOUT seconds pass
#    (default 720: the Pages CDN can hold old copies for up to 10 minutes).
#
# Exit 0 when every file matches, 1 otherwise. Used by /ship.
set -u
OLD=${1:?usage: verify-pages.sh <old-ref> <new-ref> [base-url]}
NEW=${2:?usage: verify-pages.sh <old-ref> <new-ref> [base-url]}
BASE=${3:-https://thatswhatsnext.github.io/LXDUNE}
TIMEOUT=${TIMEOUT:-720}
SHA=$(git rev-parse "$NEW") || exit 1
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT

echo "Waiting for the Pages deploy of ${SHA:0:7}..."
deadline=$((SECONDS + 600)); run=""
while [ -z "$run" ] && [ $SECONDS -lt $deadline ]; do
  run=$(gh run list --branch main --limit 10 --json databaseId,name,headSha \
    -q "[.[] | select(.headSha==\"$SHA\") | select(.name|test(\"pages\";\"i\"))][0].databaseId // empty")
  [ -z "$run" ] && sleep 10
done
[ -z "$run" ] && { echo "No Pages deploy run found for ${SHA:0:7}."; exit 1; }
gh run watch "$run" --exit-status >/dev/null 2>&1 || { echo "Pages deploy run $run failed: gh run view $run"; exit 1; }
echo "Pages deploy succeeded (run $run)."

changes=$(git diff --name-status --no-renames "$OLD" "$NEW")
deadline=$((SECONDS + TIMEOUT)); attempt=0
while :; do
  attempt=$((attempt + 1)); pending=0; report=""; checked=0
  while IFS=$'\t' read -r status path; do
    [ -z "$path" ] && continue
    case "/$path" in */.*|*/node_modules/*) continue ;; esac
    checked=$((checked + 1))
    url="$BASE/${path// /%20}"
    if [ "$status" = "D" ]; then
      code=$(curl -s -o /dev/null -w '%{http_code}' "$url?v=$(date +%s)$RANDOM")
      if [ "$code" = "404" ]; then result="removed (404)"; else result="STILL SERVED (http $code)"; pending=1; fi
    else
      git show "$SHA:$path" > "$tmp/want"
      ok=""; code=""
      for try in 1 2 3; do
        code=$(curl -s -o "$tmp/got" -w '%{http_code}' "$url?v=$(date +%s)$RANDOM")
        if cmp -s "$tmp/got" "$tmp/want"; then ok=1; break; fi
        sleep 2
      done
      if [ -n "$ok" ]; then result="matches"
      else result="DIFFERS (http $code, $(wc -c < "$tmp/got" | tr -d ' ') of $(wc -c < "$tmp/want" | tr -d ' ') bytes)"; pending=1; fi
    fi
    report+=$(printf '  %-58s %s' "$path" "$result")$'\n'
  done <<< "$changes"

  if [ $checked -eq 0 ]; then echo "No served files changed between $OLD and $NEW."; exit 0; fi
  if [ $pending -eq 0 ]; then
    echo "All $checked changed files are live and match ${SHA:0:7} (check $attempt):"; printf '%s' "$report"; exit 0
  fi
  if [ $SECONDS -ge $deadline ]; then
    echo "Still differing after ${TIMEOUT}s (check $attempt):"; printf '%s' "$report"; exit 1
  fi
  sleep 60
done
